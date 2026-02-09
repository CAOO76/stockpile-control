/**
 * DataService - Servicio de persistencia de datos del plugin
 * 
 * Este servicio utiliza EXCLUSIVAMENTE MinReport.Data.extendEntity para guardar datos
 * Los datos se almacenan en extensions.stockpile-control dentro de MINREPORT
 * 
 * Soporte Offline First: Todos los datos se guardan localmente y se sincronizan
 * cuando hay conexión disponible
 */

import type { SecureContext, StockpileAsset } from '@minreport/sdk';
import { getDb } from '../config/firebase.config';
import {
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    query,
    where,
    onSnapshot,
    type Unsubscribe
} from 'firebase/firestore';

/**
 * Interfaz para datos de stockpile (acopio) compatibles con StockpileAsset de SDK 2.0.0
 */
export interface StockpileData extends Partial<StockpileAsset> {
    id?: string;
    name: string;
    location: {
        lat: number;
        lng: number;
    };
    timestamp: number;
    imageUrls?: string[];
    peso_romana?: number;
    factor_real?: number;
    geometry_type?: string;
    volumen?: number;
    density_factor?: number;
    weight_t?: number;
    dimensions?: { base_m: number; height_m: number }; // Añadido
    metadata?: any;
}

/**
 * Servicio de datos para el plugin stockpile-control
 * Refactorizado para SDK 2.0.0: Utiliza SecureContext para persistencia blindada.
 */
export class DataService {
    private readonly COLLECTION_NAME = 'stockpile-data';
    private db = getDb();
    private secureContext: SecureContext | null = null;

    /**
     * Inyecta el contexto seguro del SDK 2.0.0
     * @param context Contexto proporcionado por MINREPORT en onInit
     */
    public setSecureContext(context: SecureContext): void {
        this.secureContext = context;
        console.log('[DataService] SecureContext inyectado correctamente.');
    }

    /**
     * Guardar datos de stockpile usando SecureContext.storage.write
     * Los datos se guardan con ámbito a extensions.stockpile-control
     * 
     * OFFLINE FIRST: Los datos se guardan localmente y se sincronizan automáticamente
     * 
     * @param data - Datos del stockpile a guardar
     * @param entityId - ID opcional de la entidad a extender
     * @returns Promise con el ID del documento guardado
     */
    async saveStockpileData(
        data: StockpileData,
        entityId?: string
    ): Promise<string> {
        try {
            console.log(`[DataService] Guardando datos blindados via SecureContext.storage`);

            const docId = entityId || `stockpile_${Date.now()}`;

            // 1. Persistencia blindada via SDK (Reemplaza MinReport.Data.extendEntity)
            if (this.secureContext) {
                await this.secureContext.storage.write(docId, data);
                console.log(`[DataService] Datos escritos en almacenamiento blindado: ${docId}`);
            } else {
                console.warn('[DataService] SecureContext no disponible. Los datos no se persistirán vía SDK.');
            }

            // 2. Persistencia en Firestore local para soporte Offline First del plugin
            const dataWithId = { ...data, id: docId };

            await setDoc(
                doc(this.db, this.COLLECTION_NAME, docId),
                {
                    ...dataWithId,
                    savedAt: new Date().toISOString(),
                    synced: !!this.secureContext, // Se marca como sincronizado si el SDK lo aceptó
                }
            );

            console.log(`✅ Registro de acopio persistido correctamente: ${docId}`);
            return docId;
        } catch (error) {
            console.error('❌ Error guardando datos:', error);
            throw new Error(`Error guardando stockpile: ${error}`);
        }
    }

    /**
     * Obtener datos de stockpile por ID (desde Firestore local)
     */
    async getStockpileData(id: string): Promise<StockpileData | null> {
        try {
            const docRef = doc(this.db, this.COLLECTION_NAME, id);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return docSnap.data() as StockpileData;
            }

            // Si no está en Firestore, intentar leer desde el almacenamiento blindado del SDK
            if (this.secureContext) {
                const sdkData = await this.secureContext.storage.read<StockpileData>(id);
                if (sdkData) return sdkData;
            }

            console.warn(`⚠️ Stockpile no encontrado: ${id}`);
            return null;
        } catch (error) {
            console.error('❌ Error obteniendo datos:', error);
            throw error;
        }
    }

    /**
     * Obtener todos los stockpiles de la base local
     */
    async getAllStockpiles(): Promise<StockpileData[]> {
        try {
            const querySnapshot = await getDocs(collection(this.db, this.COLLECTION_NAME));
            return querySnapshot.docs.map(doc => doc.data() as StockpileData);
        } catch (error) {
            console.error('❌ Error obteniendo stockpiles:', error);
            throw error;
        }
    }

    /**
     * Buscar stockpiles por criterios en base local
     */
    async searchStockpiles(filters: {
        minVolume?: number;
        maxVolume?: number;
        name?: string;
    }): Promise<StockpileData[]> {
        try {
            let q = query(collection(this.db, this.COLLECTION_NAME));

            if (filters.minVolume !== undefined) {
                q = query(q, where('volumen', '>=', filters.minVolume));
            }

            if (filters.maxVolume !== undefined) {
                q = query(q, where('volumen', '<=', filters.maxVolume));
            }

            if (filters.name) {
                q = query(q, where('name', '==', filters.name));
            }

            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => doc.data() as StockpileData);
        } catch (error) {
            console.error('❌ Error en búsqueda:', error);
            throw error;
        }
    }

    /**
     * Suscribirse a cambios en tiempo real
     */
    subscribeToStockpile(
        id: string,
        callback: (data: StockpileData | null) => void
    ): Unsubscribe {
        const docRef = doc(this.db, this.COLLECTION_NAME, id);

        return onSnapshot(docRef, (doc) => {
            if (doc.exists()) {
                callback(doc.data() as StockpileData);
            } else {
                callback(null);
            }
        });
    }

    /**
     * Sincronizar datos locales pendientes con el almacenamiento blindado del SDK
     */
    async syncWithMinReport(): Promise<void> {
        if (!this.secureContext) {
            console.warn('[DataService] Abortando sincronización: SecureContext no disponible.');
            return;
        }

        try {
            console.log('[DataService] Sincronizando datos locales con almacenamiento blindado...');

            const q = query(
                collection(this.db, this.COLLECTION_NAME),
                where('synced', '==', false)
            );

            const querySnapshot = await getDocs(q);

            for (const docSnapshot of querySnapshot.docs) {
                const data = docSnapshot.data() as StockpileData;

                // Escribir en almacenamiento blindado
                await this.secureContext.storage.write(docSnapshot.id, data);

                // Marcar como sincronizado localmente
                await setDoc(
                    doc(this.db, this.COLLECTION_NAME, docSnapshot.id),
                    { synced: true },
                    { merge: true }
                );
            }

            console.log(`✅ Sincronizados ${querySnapshot.size} registros con MINREPORT SDK`);
        } catch (error) {
            console.error('❌ Error en sincronización:', error);
            throw error;
        }
    }

    /**
     * Perfiles de Material: Guarda los factores de densidad globales calibrados por el admin.
     * Estos se sincronizan con todos los dispositivos móviles.
     */
    async saveMaterialProfiles(profiles: Record<string, number>): Promise<void> {
        try {
            if (this.secureContext) {
                await this.secureContext.storage.write('global_material_profiles', profiles);
                console.log('[DataService] Perfiles de material actualizados globalmente.');
            }

            // Persistencia local para el dashboard reactivo
            await setDoc(
                doc(this.db, 'config', 'material-profiles'),
                { ...profiles, updatedAt: new Date().toISOString() }
            );
        } catch (error) {
            console.error('[DataService] Error guardando perfiles:', error);
        }
    }

    /**
     * Obtiene los perfiles de material (factores base) actuales.
     */
    async getMaterialProfiles(): Promise<Record<string, number>> {
        const defaultProfiles = { 'COLPAS': 1.66, 'GRANSA': 1.78, 'MIXTO': 1.88, 'FINOS': 2.05 };
        try {
            if (this.secureContext) {
                const sdkProfiles = await this.secureContext.storage.read<Record<string, number>>('global_material_profiles');
                if (sdkProfiles) return sdkProfiles;
            }

            const docSnap = await getDoc(doc(this.db, 'config', 'material-profiles'));
            return docSnap.exists() ? docSnap.data() as Record<string, number> : defaultProfiles;
        } catch (error) {
            return defaultProfiles;
        }
    }

    /**
     * Inteligencia Industrial: Obtiene los últimos factores reales para un tipo de granulometría.
     */
    async getLastFactorsByGranulometry(tipo: string, limit: number = 5): Promise<{ factor: number }[]> {
        try {
            const q = query(
                collection(this.db, this.COLLECTION_NAME),
                where('tipo_granulometria', '==', tipo),
                where('peso_romana', '!=', null)
            );

            const querySnapshot = await getDocs(q);
            const docs = querySnapshot.docs.map(doc => doc.data());
            docs.sort((a, b) => b.timestamp - a.timestamp);

            return docs.slice(0, limit).map(d => ({ factor: d.factor_real }));
        } catch (error) {
            console.error('[DataService] Error obteniendo historial de factores:', error);
            return [];
        }
    }
}

// Exportar instancia única
export const dataService = new DataService();
