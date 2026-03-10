/**
 * LocalDB - Capa de persistencia 100% local para modo Android Offline
 *
 * Reemplaza Firebase completamente cuando no hay credenciales reales.
 * Usa localStorage como backend de datos, garantizando funcionamiento
 * total sin conexión a internet ni servidor de desarrollo.
 *
 * Estrategia de keys:
 *  - "sc_asset_{id}"           → StockpileAsset individual
 *  - "sc_meas_{id}"            → StockpileMeasurement individual
 *  - "sc_all_asset_ids"        → string[] de todos los IDs de activos
 *  - "sc_meas_ids_{assetId}"   → string[] de IDs de mediciones de un activo
 */

const PREFIX = 'sc_';

function lsKey(key: string): string {
    return `${PREFIX}${key}`;
}

export const localDb = {
    set<T>(key: string, value: T): void {
        try {
            localStorage.setItem(lsKey(key), JSON.stringify(value));
        } catch (e) {
            console.error('[LocalDB] Error al guardar:', key, e);
        }
    },

    get<T>(key: string): T | null {
        try {
            const raw = localStorage.getItem(lsKey(key));
            return raw ? (JSON.parse(raw) as T) : null;
        } catch (e) {
            console.error('[LocalDB] Error al leer:', key, e);
            return null;
        }
    },

    delete(key: string): void {
        localStorage.removeItem(lsKey(key));
    },

    keys(): string[] {
        const result: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.startsWith(PREFIX)) {
                result.push(k.slice(PREFIX.length));
            }
        }
        return result;
    },

    addToList(listKey: string, id: string): void {
        const current = this.get<string[]>(listKey) || [];
        if (!current.includes(id)) {
            current.push(id);
            this.set(listKey, current);
        }
    },

    getList(listKey: string): string[] {
        return this.get<string[]>(listKey) || [];
    }
};
