/**
 * DataService - Servicio de persistencia de datos del plugin
 * 
 * Este servicio utiliza EXCLUSIVAMENTE MinReport.Data.extendEntity para guardar datos
 * Los datos se almacenan en extensions.stockpile-control dentro de MINREPORT
 * 
 * Soporte Offline First: Todos los datos se guardan localmente y se sincronizan
 * cuando hay conexión disponible
 */

import { MinReport } from '../lib/minreport-sdk-mock';
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
 * Interfaz para datos de stockpile (acopio)
 */
export interface StockpileData {
    id?: string;
    name: string;
    volume: number;
    location: {
        lat: number;
        lng: number;
    };
    timestamp: number;
    imageUrls?: string[];
    metadata?: Record<string, any>;
}

/**
 * Servicio de datos para el plugin stockpile-control
 */
export class DataService {
    private readonly EXTENSION_NAME = 'stockpile-control';
    private readonly COLLECTION_NAME = 'stockpile-data';
    private db = getDb();

    /**
     * Guardar datos de stockpile usando MinReport.Data.extendEntity
     * Los datos se guardan en extensions.stockpile-control
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
            console.log(`[DataService] Guardando datos en extensions.${this.EXTENSION_NAME}`);

            // Usar MinReport.Data.extendEntity para guardar en la extensión
            await MinReport.Data.extendEntity({
                extension: this.EXTENSION_NAME,
                data: data,
                entityId: entityId,
            });

            // También guardar en Firestore local para persistencia offline
            const docId = entityId || `stockpile_${Date.now()}`;
            const dataWithId = { ...data, id: docId };

            await setDoc(
                doc(this.db, this.COLLECTION_NAME, docId),
                {
                    ...dataWithId,
                    savedAt: new Date().toISOString(),
                    synced: false, // Se marca como true cuando se sincroniza con MINREPORT
                }
            );

            console.log(`✅ Datos guardados correctamente: ${docId}`);
            return docId;
        } catch (error) {
            console.error('❌ Error guardando datos:', error);
            throw new Error(`Error guardando stockpile: ${error}`);
        }
    }

    /**
     * Obtener datos de stockpile por ID
     * 
     * @param id - ID del stockpile
     * @returns Promise con los datos del stockpile
     */
    async getStockpileData(id: string): Promise<StockpileData | null> {
        try {
            const docRef = doc(this.db, this.COLLECTION_NAME, id);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return docSnap.data() as StockpileData;
            }

            console.warn(`⚠️ Stockpile no encontrado: ${id}`);
            return null;
        } catch (error) {
            console.error('❌ Error obteniendo datos:', error);
            throw error;
        }
    }

    /**
     * Obtener todos los stockpiles
     * 
     * @returns Promise con array de stockpiles
     */
    async getAllStockpiles(): Promise<StockpileData[]> {
        try {
            const querySnapshot = await getDocs(collection(this.db, this.COLLECTION_NAME));
            const stockpiles: StockpileData[] = [];

            querySnapshot.forEach((doc) => {
                stockpiles.push(doc.data() as StockpileData);
            });

            console.log(`✅ Obtenidos ${stockpiles.length} stockpiles`);
            return stockpiles;
        } catch (error) {
            console.error('❌ Error obteniendo stockpiles:', error);
            throw error;
        }
    }

    /**
     * Buscar stockpiles por criterios
     * 
     * @param filters - Filtros de búsqueda
     * @returns Promise con array de stockpiles filtrados
     */
    async searchStockpiles(filters: {
        minVolume?: number;
        maxVolume?: number;
        name?: string;
    }): Promise<StockpileData[]> {
        try {
            let q = query(collection(this.db, this.COLLECTION_NAME));

            if (filters.minVolume !== undefined) {
                q = query(q, where('volume', '>=', filters.minVolume));
            }

            if (filters.maxVolume !== undefined) {
                q = query(q, where('volume', '<=', filters.maxVolume));
            }

            if (filters.name) {
                q = query(q, where('name', '==', filters.name));
            }

            const querySnapshot = await getDocs(q);
            const stockpiles: StockpileData[] = [];

            querySnapshot.forEach((doc) => {
                stockpiles.push(doc.data() as StockpileData);
            });

            return stockpiles;
        } catch (error) {
            console.error('❌ Error en búsqueda:', error);
            throw error;
        }
    }

    /**
     * Suscribirse a cambios en tiempo real de un stockpile
     * 
     * @param id - ID del stockpile
     * @param callback - Función a ejecutar cuando hay cambios
     * @returns Función para cancelar la suscripción
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
     * Sincronizar datos locales con MINREPORT
     * Marca los datos como sincronizados después de subirlos
     */
    async syncWithMinReport(): Promise<void> {
        try {
            console.log('[DataService] Sincronizando datos con MINREPORT...');

            const q = query(
                collection(this.db, this.COLLECTION_NAME),
                where('synced', '==', false)
            );

            const querySnapshot = await getDocs(q);
            const syncPromises: Promise<void>[] = [];

            querySnapshot.forEach((docSnapshot) => {
                const data = docSnapshot.data() as StockpileData;

                // Sincronizar cada documento no sincronizado
                const syncPromise = MinReport.Data.extendEntity({
                    extension: this.EXTENSION_NAME,
                    data: data,
                    entityId: docSnapshot.id,
                }).then(() => {
                    // Marcar como sincronizado
                    return setDoc(
                        doc(this.db, this.COLLECTION_NAME, docSnapshot.id),
                        { synced: true },
                        { merge: true }
                    );
                });

                syncPromises.push(syncPromise);
            });

            await Promise.all(syncPromises);
            console.log(`✅ Sincronizados ${syncPromises.length} registros con MINREPORT`);
        } catch (error) {
            console.error('❌ Error en sincronización:', error);
            throw error;
        }
    }
}

// Exportar instancia única
export const dataService = new DataService();
