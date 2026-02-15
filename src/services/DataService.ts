import type { SecureContext } from '@minreport/sdk';
import { getDb } from '../config/firebase.config';
import type { StockpileAsset, StockpileMeasurement } from '../types/StockpileAsset';
import {
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    onSnapshot,
    type Unsubscribe
} from 'firebase/firestore';



export class DataService {
    private readonly ASSETS_PATH = 'stockpile_assets';
    private readonly MEASUREMENTS_PATH = 'stockpile_measurements';
    private db = getDb();
    private secureContext: SecureContext | null = null;

    public setSecureContext(context: SecureContext): void {
        this.secureContext = context;
    }

    /**
     * Crear un nuevo Activo (Ficha Inicial)
     */
    async createAsset(asset: Omit<StockpileAsset, 'id' | 'createdAt' | 'createdBy'>): Promise<string> {
        const docId = `asset_${Date.now()}`;
        const newAsset: StockpileAsset = {
            ...asset,
            id: docId,
            createdAt: Date.now(),
            createdBy: (this.secureContext as any)?.user?.email || 'anonymous'
        };

        try {
            // Firestore handles offline queuing and local resolution natively.
            // Removing withTimeout to prevent blocking UI on high-latency mobile networks.
            await setDoc(doc(this.db, this.ASSETS_PATH, docId), newAsset);

            if (this.secureContext) {
                await this.secureContext.storage.write(docId, newAsset);
            }

            return docId;
        } catch (error) {
            console.error('[DataService] Error creating asset:', error);
            throw error;
        }
    }

    /**
     * Registrar una nueva Cubicación
     */
    async addMeasurement(measurement: Omit<StockpileMeasurement, 'id'>): Promise<string> {
        const mId = `meas_${Date.now()}`;
        const newM: StockpileMeasurement = { ...measurement, id: mId };

        try {
            // 1. Guardar medición
            await setDoc(doc(this.db, this.MEASUREMENTS_PATH, mId), newM);

            // 2. Actualizar último estado en el Activo (Denormalización para performance)
            await setDoc(doc(this.db, this.ASSETS_PATH, measurement.assetId), {
                last_volume_m3: measurement.volumen_m3,
                last_weight_t: measurement.peso_t,
                last_photo_url: measurement.photo_url,
                last_measured_at: measurement.timestamp,
                // Legacy compatibility for DesktopAnalytics
                volumen: measurement.volumen_m3,
                peso_final_toneladas: measurement.peso_t
            }, { merge: true });

            return mId;
        } catch (error) {
            console.error('[DataService] Error adding measurement:', error);
            throw error;
        }
    }

    /**
     * Obtener Activo por ID
     */
    async getAsset(id: string): Promise<StockpileAsset | null> {
        const docSnap = await getDoc(doc(this.db, this.ASSETS_PATH, id));
        return docSnap.exists() ? docSnap.data() as StockpileAsset : null;
    }

    /**
     * Obtener una medición específica por ID
     */
    async getMeasurement(id: string): Promise<StockpileMeasurement | null> {
        const docSnap = await getDoc(doc(this.db, this.MEASUREMENTS_PATH, id));
        return docSnap.exists() ? docSnap.data() as StockpileMeasurement : null;
    }

    /**
     * Obtener Historial de Cubicaciones
     */
    async getMeasurements(assetId: string): Promise<StockpileMeasurement[]> {
        const q = query(
            collection(this.db, this.MEASUREMENTS_PATH),
            where('assetId', '==', assetId),
            orderBy('timestamp', 'desc')
        );
        const snap = await getDocs(q);
        return snap.docs.map(d => d.data() as StockpileMeasurement);
    }

    /**
     * Obtener todos los activos stock
     */
    async getAllAssets(): Promise<StockpileAsset[]> {
        const snap = await getDocs(collection(this.db, this.ASSETS_PATH));
        return snap.docs.map(d => ({ id: d.id, ...d.data() }) as StockpileAsset);
    }

    /**
     * Suscripción en tiempo real a un activo
     */
    subscribeToAsset(id: string, callback: (data: StockpileAsset | null) => void): Unsubscribe {
        return onSnapshot(doc(this.db, this.ASSETS_PATH, id), (snap) => {
            callback(snap.exists() ? snap.data() as StockpileAsset : null);
        });
    }

    /**
     * Suscripción en tiempo real a TODOS los activos
     */
    subscribeToAllAssets(callback: (data: StockpileAsset[]) => void): Unsubscribe {
        return onSnapshot(collection(this.db, this.ASSETS_PATH), (snap) => {
            const assets = snap.docs.map(d => ({ id: d.id, ...d.data() }) as StockpileAsset);
            callback(assets);
        });
    }

    /**
     * Suscripción en tiempo real al historial de cubicaciones de un activo
     */
    subscribeToMeasurements(assetId: string, callback: (data: StockpileMeasurement[]) => void): Unsubscribe {
        const q = query(
            collection(this.db, this.MEASUREMENTS_PATH),
            where('assetId', '==', assetId),
            orderBy('timestamp', 'desc')
        );
        return onSnapshot(q, (snap) => {
            callback(snap.docs.map(d => d.data() as StockpileMeasurement));
        });
    }

    /**
     * Suscripción en tiempo real a una medición específica
     */
    subscribeToMeasurement(id: string, callback: (data: StockpileMeasurement | null) => void): Unsubscribe {
        return onSnapshot(doc(this.db, this.MEASUREMENTS_PATH, id), (snap) => {
            callback(snap.exists() ? { id: snap.id, ...snap.data() } as StockpileMeasurement : null);
        });
    }

    /**
     * Obtener Perfiles de Material (Factores de Densidad)
     */
    async getMaterialProfiles(): Promise<Record<string, number>> {
        const docSnap = await getDoc(doc(this.db, 'config', 'material_profiles'));
        if (docSnap.exists()) {
            return docSnap.data() as Record<string, number>;
        }
        // Default profiles if not found
        return {
            'COLPAS': 1.6,
            'GRANSA': 1.8,
            'MIXTO': 1.7,
            'FINOS': 1.5
        };
    }

    /**
     * Guardar Perfiles de Material
     */
    async saveMaterialProfiles(profiles: Record<string, number>): Promise<void> {
        await setDoc(doc(this.db, 'config', 'material_profiles'), profiles);
    }

    /**
     * Guardar datos de Stockpile (Actualización completa o parcial)
     */
    async saveStockpileData(data: Partial<StockpileAsset>, id: string): Promise<void> {
        await setDoc(doc(this.db, this.ASSETS_PATH, id), data, { merge: true });
    }

    /**
     * Alternar estado de "Ignorado" de una medición.
     * Si se ignora, se debe recalcular el "último estado válido" del activo.
     */
    async toggleIgnoreMeasurement(measurementId: string, assetId: string, currentIgnoredStatus: boolean): Promise<void> {
        const newStatus = !currentIgnoredStatus;
        const measurementRef = doc(this.db, this.MEASUREMENTS_PATH, measurementId);
        const assetRef = doc(this.db, this.ASSETS_PATH, assetId);

        try {
            // 1. Actualizar estado de la medición
            await setDoc(measurementRef, { ignored: newStatus }, { merge: true });

            // 2. Recalcular estado del Activo
            // Obtener todas las mediciones ordenadas por fecha descendente
            const measurements = await this.getMeasurements(assetId);

            // Filtrar las que NO están ignoradas (incluyendo la que acabamos de cambiar)
            const updatedMeasurements = measurements.map(m =>
                m.id === measurementId ? { ...m, ignored: newStatus } : m
            );

            // Buscar la más reciente válida
            const validMeasurement = updatedMeasurements.find(m => !m.ignored);

            if (validMeasurement) {
                // Restaurar estado a la última válida
                await setDoc(assetRef, {
                    last_volume_m3: validMeasurement.volumen_m3,
                    last_weight_t: validMeasurement.peso_t,
                    last_photo_url: validMeasurement.photo_url,
                    last_measured_at: validMeasurement.timestamp,
                    // Legacy compatibility
                    volumen: validMeasurement.volumen_m3,
                    peso_final_toneladas: validMeasurement.peso_t
                }, { merge: true });
            } else {
                // No quedan mediciones validas -> Resetear a 0
                await setDoc(assetRef, {
                    last_volume_m3: 0,
                    last_weight_t: 0,
                    last_photo_url: null,
                    last_measured_at: null,
                    // Legacy compatibility
                    volumen: 0,
                    peso_final_toneladas: 0
                }, { merge: true });
            }

        } catch (error) {
            console.error('[DataService] Error toggleIgnoreMeasurement:', error);
            throw error;
        }
    }
}

export const dataService = new DataService();
