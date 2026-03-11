import type { SecureContext } from '@minreport/sdk';
import { idbStorage } from '../utils/indexedDB';
import { setSyncStatus } from '../utils/syncStatus';

// Extraer IP inyectada por Live Reload o usar origin (bypassa ADB)
const getSyncUrl = () => {
    // 1. IP inyectada estáticamente en el bundle de offline Android (set-dev-ip.js)
    if (import.meta.env && import.meta.env.VITE_DEV_MAC_IP) {
        return import.meta.env.VITE_DEV_MAC_IP;
    }

    if (typeof window === 'undefined') return '';
    const _host = window.location.hostname;
    
    // 2. Si Live Reload está inyectando el host Web dinámicamente
    if (window.location.origin?.includes(':5190')) return window.location.origin;
    
    // 3. Fallback a localhost solo si NO estamos en un dispositivo (Capacitor)
    const isCapacitor = (window as any).Capacitor || window.location.protocol === 'http-extension:';
    if (!isCapacitor && (_host === 'localhost' || _host === '127.0.0.1')) {
        return `http://localhost:5190`;
    }
    
    const finalUrl = `http://${_host}:5190`;
    console.log(`[Mock Sync] Resolved Sync URL via Hostname: ${finalUrl}`);
    return finalUrl;
}

const VITE_SYNC_URL = getSyncUrl();
console.log(`[Mock Sync] VITE_DEV_MAC_IP ENV: ${import.meta.env?.VITE_DEV_MAC_IP || 'UNDEFINED'}`);
console.log(`[Mock Sync] INITIALIZED WITH URL: ${VITE_SYNC_URL}`);

/**
 * Push data to Mock Sync Server
 */
const pushToDevServer = async (key: string, value: any) => {
    if (!VITE_SYNC_URL) return;
    console.log(`[Mock Sync] Pushing key: ${key}`);
    setSyncStatus('syncing', 'Subiendo...');
    try {
        await fetch(`${VITE_SYNC_URL}/__mock_sync_push`, {
            method: 'POST',
            body: JSON.stringify({ [`mock_sdk_${key}`]: value }),
            headers: { 'Content-Type': 'application/json' }
        });
        console.log(`[Mock Sync] Push successful for key: ${key}`);
        setSyncStatus('success');
        // Reset to idle after a delay
        setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (e: any) {
        console.warn(`[Mock Sync] Dev server unreachable for push: ${e?.message || e}`);
        setSyncStatus('error', 'Error al subir');
    }
};
 
/**
 * Lazy load a single key from Dev Server
 */
export const fetchFullKey = async (key: string) => {
    if (!VITE_SYNC_URL) return null;
    setSyncStatus('syncing', 'Descargando imagen...');
    try {
        const res = await fetch(`${VITE_SYNC_URL}/__mock_sync_get?key=mock_sdk_${key}`);
        if (res.ok) {
            setSyncStatus('success');
            setTimeout(() => setSyncStatus('idle'), 2000);
            return await res.json();
        }
    } catch (e) {
        console.warn(`[Mock Sync] Failed to lazy load key ${key}`);
        setSyncStatus('error', 'Error descarga');
    }
    return null;
};

/**
 * Pull data from Mock Sync Server
 */
export const pullFromDevServer = async () => {
    if (!VITE_SYNC_URL) return;
    console.log(`[Mock Sync] pulling data from: ${VITE_SYNC_URL}`);
    setSyncStatus('syncing', 'Sincronizando...');
    try {
        const res = await fetch(`${VITE_SYNC_URL}/__mock_sync_pull`);
        if (res.ok) {
            const data = await res.json();
            const keys = Object.keys(data);
            console.log(`[Mock Sync] Received ${keys.length} keys from server`);
            for (const k of keys) {
                if (k.startsWith('mock_sdk_')) {
                    const realKey = k.replace('mock_sdk_', '');
                    await idbStorage.set(realKey, data[k]);
                    // Clean up localStorage to reclaim 5MB quota
                    localStorage.removeItem(k);
                }
            }
            console.log('[Mock Sync] Pull complete. Dispatched mock-sync-updated.');
            setSyncStatus('success', 'Sincronizado');
            setTimeout(() => setSyncStatus('idle'), 3000);
            window.dispatchEvent(new Event('mock-sync-updated'));
        }
    } catch (e: any) {
        console.warn(`[Mock Sync] Dev server unreachable for pull: ${e?.message || e}`);
        setSyncStatus('error', 'Sin conexión con servidor sync');
    }
};

// Auto pull en inicio (se ejecuta en DEV Mac y en WebView Capacitor Offline)
pullFromDevServer();

// Hot Module Replacement HMR listening (solo disponible entorno Vite originario)
if (import.meta.env && import.meta.env.DEV && import.meta.hot) {
        import.meta.hot.on('mock:sync-updated', async (data) => {
            console.log('[Mock Sync HMR] Server payload updated');
            for (const k of Object.keys(data)) {
                if (k.startsWith('mock_sdk_')) {
                    const realKey = k.replace('mock_sdk_', '');
                    await idbStorage.set(realKey, data[k]);
                }
            }
            window.dispatchEvent(new Event('mock-sync-updated'));
        });
    }

/**
 * Mock del SecureContext para desarrollo local y standalone
 * Simula el almacenamiento blindado usando localStorage
 */
export const MockSecureContext: SecureContext = {
    storage: {
        read: async <T>(key: string): Promise<T | null> => {
            let item: any = await idbStorage.get<T>(key);
            
            if (item) {
                // Transparent Lazy Load
                if (item.__is_lazy) {
                    console.log(`[Mock Sync] Lazy loading full record for key: ${key}`);
                    const fullItem = await fetchFullKey(key);
                    if (fullItem) {
                        await idbStorage.set(key, fullItem);
                        return fullItem as T;
                    }
                }
                return item;
            }

            // Priority 2: localStorage (Legacy fallback for migration)
            const legacyItem = localStorage.getItem(`mock_sdk_${key}`);
            if (legacyItem) {
                try {
                    const parsed = JSON.parse(legacyItem);
                    // Migrar a IndexedDB automáticamente
                    await idbStorage.set(key, parsed);
                    // localStorage.removeItem(`mock_sdk_${key}`); // Opcional: limpiar después
                    return parsed;
                } catch (e) {
                    return null;
                }
            }

            return null;
        },
        write: async <T>(key: string, value: T): Promise<void> => {
            console.log(`[SDK Mock] Escribiendo en IndexedDB: ${key}`);
            await idbStorage.set(key, value);
            await pushToDevServer(key, value);
        }
    }
};

/**
 * Utilidad para detectar si estamos en un entorno hosteado o standalone
 */
export const isStandalone = (): boolean => {
    // Si window.MinReport no existe, asumimos standalone
    return typeof (window as any).MinReport === 'undefined';
};

/**
 * Mock del MinReport Core para desarrollo
 */
export const MinReport = {
    version: '2.1.0',
    EntityManager: {
        queryEntities: async (options: { extension: string; filters?: any; limit?: number }) => {
            console.log(`[SDK v2.1.0 Mock] Querying ${options.extension}`, options);
            return [];
        },
        subscribeToEntity: (extension: string, id: string, _callback: (data: any) => void) => {
            console.log(`[SDK v2.1.0 Mock] Subscribed to ${extension}:${id}`);
            return () => console.log(`[SDK v2.1.0 Mock] Unsubscribed`);
        }
    },
    Core: {
        getPluginRegistry: () => ({
            getPlugin: (_name: string) => null
        })
    }
};

/**
 * Hard Reset: Clears everything (IndexedDB locally + Mock Sync Server)
 */
export async function hardSyncReset() {
    console.warn('[Mock Sync] PERFORMING HARD RESET...');
    
    // 1. Clear IndexedDB
    const { idbStorage } = await import('../utils/indexedDB');
    await idbStorage.clear();
    
    // 2. Clear Server
    try {
        await fetch(`${VITE_SYNC_URL}/__mock_sync_reset`, { method: 'POST' });
    } catch (e) {
        console.error('[Mock Sync] Server reset failed', e);
    }
    
    // 3. Reload
    window.location.reload();
}
