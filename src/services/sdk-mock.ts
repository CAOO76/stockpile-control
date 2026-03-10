import type { SecureContext } from '@minreport/sdk';

// Extraer IP inyectada por Live Reload o usar origin (bypassa ADB)
const getSyncUrl = () => {
    // 1. IP inyectada estáticamente en el bundle de offline Android (set-dev-ip.js)
    if (import.meta.env && import.meta.env.VITE_DEV_MAC_IP) {
        return import.meta.env.VITE_DEV_MAC_IP;
    }

    if (typeof window === 'undefined') return '';
    const _host = window.location.hostname;
    
    // 2. Si Live Reload está inyectando el host Web dinámicamente
    if (window.location.origin.includes(':5190')) return window.location.origin;
    
    // 3. Fallback a localhost si estamos probando en Desktop (Mac)
    if (_host === 'localhost' || _host === '127.0.0.1') return `http://localhost:5190`;
    
    const finalUrl = `http://${_host}:5190`;
    console.log(`[Mock Sync] Resolved Sync URL: ${finalUrl}`);
    return finalUrl;
}

const VITE_SYNC_URL = getSyncUrl();
console.log(`[Mock Sync] INITIALIZED WITH URL: ${VITE_SYNC_URL}`);

/**
 * Push data to Mock Sync Server
 */
const pushToDevServer = async (key: string, value: any) => {
    if (!VITE_SYNC_URL) return;
    try {
        await fetch(`${VITE_SYNC_URL}/__mock_sync_push`, {
            method: 'POST',
            body: JSON.stringify({ [`mock_sdk_${key}`]: value }),
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e: any) {
        console.warn(`[Mock Sync] Dev server unreachable for push: ${e?.message || e}`);
    }
};

/**
 * Pull data from Mock Sync Server
 */
export const pullFromDevServer = async () => {
    if (!VITE_SYNC_URL) return;
    try {
        const res = await fetch(`${VITE_SYNC_URL}/__mock_sync_pull`);
        if (res.ok) {
            const data = await res.json();
            Object.keys(data).forEach(k => {
                if (k.startsWith('mock_sdk_')) {
                    localStorage.setItem(k, JSON.stringify(data[k]));
                }
            });
            console.log('[Mock Sync] Synced from Dev Server', Object.keys(data).length, 'keys');
        }
    } catch (e: any) {
        console.warn(`[Mock Sync] Dev server unreachable for pull: ${e?.message || e}`);
    }
};

// Auto pull en inicio (se ejecuta en DEV Mac y en WebView Capacitor Offline)
pullFromDevServer();

// Hot Module Replacement HMR listening (solo disponible entorno Vite originario)
if (import.meta.env && import.meta.env.DEV && import.meta.hot) {
        import.meta.hot.on('mock:sync-updated', (data) => {
            console.log('[Mock Sync HMR] Server payload updated');
            Object.keys(data).forEach(k => {
                if (k.startsWith('mock_sdk_')) {
                    localStorage.setItem(k, JSON.stringify(data[k]));
                }
            });
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
            // console.log(`[SDK Mock] Leyendo key: ${key}`);
            const item = localStorage.getItem(`mock_sdk_${key}`);
            return item ? JSON.parse(item) : null;
        },
        write: async <T>(key: string, value: T): Promise<void> => {
            console.log(`[SDK Mock] Escribiendo key: ${key}`);
            localStorage.setItem(`mock_sdk_${key}`, JSON.stringify(value));
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
