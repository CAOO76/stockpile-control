import type { SecureContext } from '@minreport/sdk';

/**
 * Mock del SecureContext para desarrollo local y standalone
 * Simula el almacenamiento blindado usando localStorage
 */
export const MockSecureContext: SecureContext = {
    storage: {
        read: async <T>(key: string): Promise<T | null> => {
            console.log(`[SDK Mock] Leyendo key: ${key}`);
            const item = localStorage.getItem(`mock_sdk_${key}`);
            return item ? JSON.parse(item) : null;
        },
        write: async <T>(key: string, value: T): Promise<void> => {
            console.log(`[SDK Mock] Escribiendo key: ${key}`, value);
            localStorage.setItem(`mock_sdk_${key}`, JSON.stringify(value));
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
    EntityManager: {
        queryEntities: async (options: { extension: string; filters?: any; limit?: number }) => {
            console.log(`[Mock EntityManager] Querying ${options.extension}`, options);
            return [];
        },
        subscribeToEntity: (extension: string, id: string, _callback: (data: any) => void) => {
            console.log(`[Mock EntityManager] Subscribed to ${extension}:${id}`);
            return () => console.log(`[Mock EntityManager] Unsubscribed`);
        }
    },
    Core: {
        getPluginRegistry: () => ({
            getPlugin: (_name: string) => null
        })
    }
};
