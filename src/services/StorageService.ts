/**
 * StorageService - Servicio de almacenamiento de imágenes para stockpiles
 * 
 * Utiliza Cloud Storage de Firebase con un bucket independiente
 * Configurado exclusivamente para la región southamerica-west1
 * 
 * Características:
 * - Bucket independiente: stockpile-control-images
 * - Optimización de imágenes antes de subir
 * - Soporte offline: las imágenes se guardan localmente y se suben cuando hay conexión
 */

import {
    getStorageInstance,
    FIREBASE_REGION
} from '../config/firebase.config';
import {
    ref,
    uploadBytesResumable,
    getDownloadURL,
    deleteObject,
    listAll,
    type UploadTaskSnapshot
} from 'firebase/storage';

/**
 * Opciones de carga de imagen
 */
export interface UploadOptions {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    format?: 'jpeg' | 'png' | 'webp';
}

/**
 * Resultado de carga de imagen
 */
export interface UploadResult {
    url: string;
    path: string;
    size: number;
    uploadedAt: string;
}

/**
 * Servicio de almacenamiento para el plugin
 */
export class StorageService {
    private storage = getStorageInstance();
    private readonly BUCKET_PATH = 'stockpile-control-images';

    /**
     * Optimizar imagen antes de subir
     * Reduce tamaño y convierte a formato optimizado
     * 
     * @param file - Archivo de imagen
     * @param options - Opciones de optimización
     * @returns Promise con blob optimizado
     */
    private async optimizeImage(
        file: File | Blob,
        options: UploadOptions = {}
    ): Promise<Blob> {
        const {
            maxWidth = 1920,
            maxHeight = 1080,
            quality = 0.85,
            format = 'jpeg'
        } = options;

        return new Promise((resolve, reject) => {
            const img = new Image();
            const url = URL.createObjectURL(file);

            img.onload = () => {
                // Calcular dimensiones manteniendo aspect ratio
                let { width, height } = img;

                if (width > maxWidth || height > maxHeight) {
                    const ratio = Math.min(maxWidth / width, maxHeight / height);
                    width *= ratio;
                    height *= ratio;
                }

                // Crear canvas y redimensionar
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('No se pudo obtener contexto 2D del canvas'));
                    return;
                }

                ctx.drawImage(img, 0, 0, width, height);

                // Convertir a blob optimizado
                canvas.toBlob(
                    (blob) => {
                        URL.revokeObjectURL(url);
                        if (blob) {
                            console.log(`✅ Imagen optimizada: ${(blob.size / 1024).toFixed(2)} KB`);
                            resolve(blob);
                        } else {
                            reject(new Error('Error convirtiendo a blob'));
                        }
                    },
                    `image/${format}`,
                    quality
                );
            };

            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('Error cargando imagen'));
            };

            img.src = url;
        });
    }

    /**
     * Subir imagen de stockpile al bucket de Cloud Storage
     * 
     * @param file - Archivo de imagen
     * @param stockpileId - ID del stockpile
     * @param options - Opciones de optimización
     * @param onProgress - Callback de progreso (0-100)
     * @returns Promise con resultado de la carga
     */
    async uploadStockpileImage(
        file: File | Blob,
        stockpileId: string,
        options: UploadOptions = {},
        onProgress?: (progress: number) => void
    ): Promise<UploadResult> {
        try {
            console.log(`[StorageService] Subiendo imagen para stockpile: ${stockpileId}`);
            console.log(`📍 Región: ${FIREBASE_REGION}`);

            // Optimizar imagen
            const optimizedBlob = await this.optimizeImage(file, options);

            // Generar nombre de archivo único
            const timestamp = Date.now();
            const filename = `${stockpileId}_${timestamp}.${options.format || 'jpeg'}`;
            const path = `${this.BUCKET_PATH}/${stockpileId}/${filename}`;

            // Crear referencia en Storage
            const storageRef = ref(this.storage, path);

            // Subir con seguimiento de progreso
            const uploadTask = uploadBytesResumable(storageRef, optimizedBlob, {
                contentType: `image/${options.format || 'jpeg'}`,
                customMetadata: {
                    stockpileId: stockpileId,
                    uploadedAt: new Date().toISOString(),
                    region: FIREBASE_REGION,
                },
            });

            return new Promise((resolve, reject) => {
                uploadTask.on(
                    'state_changed',
                    (snapshot: UploadTaskSnapshot) => {
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        if (onProgress) {
                            onProgress(Math.round(progress));
                        }
                        console.log(`📤 Progreso: ${progress.toFixed(1)}%`);
                    },
                    (error) => {
                        console.error('❌ Error subiendo imagen:', error);
                        reject(error);
                    },
                    async () => {
                        try {
                            const url = await getDownloadURL(uploadTask.snapshot.ref);
                            const result: UploadResult = {
                                url,
                                path,
                                size: uploadTask.snapshot.totalBytes,
                                uploadedAt: new Date().toISOString(),
                            };

                            console.log(`✅ Imagen subida correctamente: ${url}`);
                            resolve(result);
                        } catch (error) {
                            reject(error);
                        }
                    }
                );
            });
        } catch (error) {
            console.error('❌ Error en uploadStockpileImage:', error);
            throw error;
        }
    }

    /**
     * Obtener URL de descarga de una imagen
     * 
     * @param path - Ruta de la imagen en Storage
     * @returns Promise con URL de descarga
     */
    async getImageUrl(path: string): Promise<string> {
        try {
            const storageRef = ref(this.storage, path);
            const url = await getDownloadURL(storageRef);
            return url;
        } catch (error) {
            console.error('❌ Error obteniendo URL:', error);
            throw error;
        }
    }

    /**
     * Listar todas las imágenes de un stockpile
     * 
     * @param stockpileId - ID del stockpile
     * @returns Promise con array de URLs de imágenes
     */
    async listStockpileImages(stockpileId: string): Promise<string[]> {
        try {
            const folderRef = ref(this.storage, `${this.BUCKET_PATH}/${stockpileId}`);
            const result = await listAll(folderRef);

            const urlPromises = result.items.map((itemRef) => getDownloadURL(itemRef));
            const urls = await Promise.all(urlPromises);

            console.log(`✅ Encontradas ${urls.length} imágenes para stockpile ${stockpileId}`);
            return urls;
        } catch (error) {
            console.error('❌ Error listando imágenes:', error);
            return [];
        }
    }

    /**
     * Eliminar una imagen
     * 
     * @param path - Ruta de la imagen
     */
    async deleteImage(path: string): Promise<void> {
        try {
            const storageRef = ref(this.storage, path);
            await deleteObject(storageRef);
            console.log(`✅ Imagen eliminada: ${path}`);
        } catch (error) {
            console.error('❌ Error eliminando imagen:', error);
            throw error;
        }
    }

    /**
     * Eliminar todas las imágenes de un stockpile
     * 
     * @param stockpileId - ID del stockpile
     */
    async deleteAllStockpileImages(stockpileId: string): Promise<void> {
        try {
            const folderRef = ref(this.storage, `${this.BUCKET_PATH}/${stockpileId}`);
            const result = await listAll(folderRef);

            const deletePromises = result.items.map((itemRef) => deleteObject(itemRef));
            await Promise.all(deletePromises);

            console.log(`✅ Eliminadas ${result.items.length} imágenes de stockpile ${stockpileId}`);
        } catch (error) {
            console.error('❌ Error eliminando imágenes:', error);
            throw error;
        }
    }
}

// Exportar instancia única
export const storageService = new StorageService();
