// Definiciones TypeScript para el SDK de MINREPORT v1.0.3
// Basado en la especificación del SDK

declare module '@minreport/sdk' {
    /**
     * Interfaz del ciclo de vida del plugin
     * Todos los plugins deben implementar esta interfaz
     */
    export interface PluginLifeCycle {
        /**
         * Se invoca cuando el plugin es activado en MINREPORT
         */
        onActivate(): void | Promise<void>;

        /**
         * Se invoca cuando el plugin es desactivado en MINREPORT
         */
        onDeactivate(): void | Promise<void>;

        /**
         * Se invoca cuando el plugin es inicializado (opcional)
         */
        onInit?(): void | Promise<void>;

        /**
         * Se invoca cuando el plugin recibe datos (opcional)
         */
        onData?(data: any): void | Promise<void>;
    }

    /**
     * Contexto del plugin proporcionado por MINREPORT
     */
    export interface PluginContext {
        region: string;
        pluginName: string;
        version: string;
        environment: 'development' | 'staging' | 'production';
    }

    /**
     * Configuración del plugin
     */
    export interface PluginConfig {
        name: string;
        version: string;
        description?: string;
        author?: string;
    }

    /**
     * Metadatos de la versión del SDK
     */
    export interface SDKVersion {
        id: string;
        versionNumber: string;
        changelog: string;
        status: 'ALPHA' | 'BETA' | 'STABLE' | 'DEPRECATED';
        createdBy: string;
        author: string;
        releaseDate: {
            seconds: number;
            nanoseconds: number;
        };
    }

    /**
     * Utilidades del SDK
     */
    export const SDK: {
        version: string;
        getContext(): PluginContext;
        registerPlugin(config: PluginConfig, lifecycle: PluginLifeCycle): void;
    };
}
