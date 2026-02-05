/**
 * Configuración central de Firebase para el plugin stockpile-control
 * 
 * IMPORTANTE: Este proyecto está configurado EXCLUSIVAMENTE para Firebase
 * NO USAR GOOGLE APP ENGINE - Está explícitamente prohibido
 * 
 * Región: southamerica-west1 (estrictamente configurado)
 */

import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

// Validación contra App Engine
const validateNotAppEngine = () => {
    if (typeof (globalThis as any).google?.appengine !== 'undefined') {
        throw new Error(
            '⛔ PROHIBIDO: Se detectó Google App Engine. ' +
            'Este proyecto debe usar EXCLUSIVAMENTE Firebase. ' +
            'No se permite el uso de App Engine.'
        );
    }
};

/**
 * Configuración de Firebase
 * Todos los recursos deben estar en la región southamerica-west1
 */
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'demo-api-key',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'stockpile-control-demo',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'stockpile-control-images.appspot.com',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

/**
 * Configuración de región
 * CRÍTICO: Todos los recursos deben estar en southamerica-west1
 */
export const FIREBASE_REGION = 'southamerica-west1';

// Validar que no estamos en App Engine
validateNotAppEngine();

// Inicializar Firebase
let app: FirebaseApp;
let db: Firestore;
let storage: FirebaseStorage;

try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    storage = getStorage(app);

    console.log(`✅ Firebase inicializado correctamente`);
    console.log(`📍 Región configurada: ${FIREBASE_REGION}`);
    console.log(`🗄️ Proyecto: ${firebaseConfig.projectId}`);
    console.log(`⛔ App Engine: PROHIBIDO`);
} catch (error) {
    console.error('❌ Error inicializando Firebase:', error);
    throw error;
}

/**
 * Habilitar persistencia offline de Firestore
 * Esto permite que el plugin funcione en zonas sin cobertura
 */
export const enableOfflinePersistence = async (): Promise<boolean> => {
    try {
        await enableIndexedDbPersistence(db);
        console.log('✅ Persistencia offline habilitada (IndexedDB)');
        return true;
    } catch (error: any) {
        if (error.code === 'failed-precondition') {
            console.warn('⚠️ Persistencia offline no disponible: múltiples pestañas abiertas');
        } else if (error.code === 'unimplemented') {
            console.warn('⚠️ Persistencia offline no soportada por este navegador');
        } else {
            console.error('❌ Error habilitando persistencia offline:', error);
        }
        return false;
    }
};

/**
 * Obtener la instancia de Firebase App
 */
export const getFirebaseApp = (): FirebaseApp => app;

/**
 * Obtener la instancia de Firestore
 */
export const getDb = (): Firestore => db;

/**
 * Obtener la instancia de Storage
 */
export const getStorageInstance = (): FirebaseStorage => storage;

/**
 * Información de configuración (para debugging)
 */
export const getFirebaseConfig = () => ({
    projectId: firebaseConfig.projectId,
    region: FIREBASE_REGION,
    storageBucket: firebaseConfig.storageBucket,
    offlineEnabled: true,
    appEngineProhibited: true,
});

export default {
    app,
    db,
    storage,
    region: FIREBASE_REGION,
    enableOfflinePersistence,
    getFirebaseConfig,
};
