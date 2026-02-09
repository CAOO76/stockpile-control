/**
 * Mock implementation of MINREPORT SDK v2.0.0
 * Este es un mock local del SDK de MINREPORT alineado con la versión 2.0.0.
 */

export interface SecureContext {
    storage: {
        read<T>(key: string): Promise<T | null>;
        write<T>(key: string, value: T): Promise<void>;
    };
}

export interface PluginLifeCycle {
    onActivate?(): void | Promise<void>;
    onDeactivate?(): void | Promise<void>;
    onInit(context: SecureContext): void | Promise<void>;
    onData?(data: any): void | Promise<void>;
}

export interface PluginContext {
    region: string;
    pluginName: string;
    version: string;
    environment: 'development' | 'staging' | 'production';
}

export interface PluginConfig {
    name: string;
    version: string;
    description?: string;
    author?: string;
}

export interface StockpileAsset {
    geometry_type: 'CONO_ELIPTICO' | 'CONO_ELIPTICO_TRUNCADO' | 'CONO_PERIMETRO' | 'FOTOGRAMETRIA';
    dimensions: Record<string, number>;
    volume_m3: number;
    density_factor: number;
    weight_t: number;
    metadata: {
        timestamp: number;
        geo: 'southamerica-west1';
        precision: number;
        operatorId: string;
    };
}

/**
 * MinReport Core API Mock
 */
export const MinReport = {
    /**
     * EntityManager API (Mock)
     */
    EntityManager: {
        queryEntities: async (options: {
            extension: string;
            filters?: Record<string, any>;
            limit?: number;
        }): Promise<any[]> => {
            console.log(`[Mock EntityManager] Consultando entidades de ${options.extension}`, options.filters);
            return Promise.resolve([]);
        },

        subscribeToEntity: (
            extension: string,
            entityId: string,
            _callback: (data: any) => void
        ): (() => void) => {
            console.log(`[Mock EntityManager] Suscrito a ${extension}.${entityId}`);
            return () => console.log(`[Mock EntityManager] Desuscrito de ${extension}.${entityId}`);
        },
    },

    /**
     * Core API (Mock)
     */
    Core: {
        getPluginRegistry: () => {
            console.log('[Mock Core] Obteniendo registro de plugins');
            return {
                getPlugin: (name: string) => {
                    console.log(`[Mock Core] Buscando plugin: ${name}`);
                    return null;
                }
            };
        }
    },
};

/**
 * SDK Principal Mock
 */
export const SDK = {
    version: '2.0.0',

    getContext(): PluginContext {
        return {
            region: import.meta.env.VITE_MINREPORT_REGION || 'southamerica-west1',
            pluginName: import.meta.env.VITE_PLUGIN_NAME || 'stockpile-control',
            version: '2.0.0',
            environment: (import.meta.env.VITE_ENVIRONMENT as any) || 'development',
        };
    },

    registerPlugin(config: PluginConfig, _lifecycle: PluginLifeCycle): void {
        console.log('[Mock SDK] Registrando plugin:', config);

        // Simulación de inyección de SecureContext en onInit
        const mockSecureContext: SecureContext = {
            storage: {
                read: async (key: string) => {
                    console.log(`[Mock Storage] Leyendo extensions.stockpile-control.${key}`);
                    const val = localStorage.getItem(`minreport.ext.stockpile-control.${key}`);
                    return val ? JSON.parse(val) : null;
                },
                write: async (key: string, value: any) => {
                    console.log(`[Mock Storage] Escribiendo extensions.stockpile-control.${key}`, value);
                    localStorage.setItem(`minreport.ext.stockpile-control.${key}`, JSON.stringify(value));
                }
            }
        };

        if (_lifecycle.onInit) {
            _lifecycle.onInit(mockSecureContext);
        }
    },
};
