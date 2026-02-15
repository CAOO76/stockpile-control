/**
 * Configuración central de Firebase para el plugin stockpile-control
 */

import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore, enableIndexedDbPersistence, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, type FirebaseStorage, connectStorageEmulator } from 'firebase/storage';
import { isStandalone } from '../services/sdk-mock';

// Validación contra App Engine
const validateNotAppEngine = () => {
    if (typeof (globalThis as any).google?.appengine !== 'undefined') {
        throw new Error(
            '⛔ PROHIBIDO: Se detectó Google App Engine. ' +
            'Este proyecto debe usar EXCLUSIVAMENTE Firebase.'
        );
    }
};

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'demo-api-key',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'stockpile-control-demo',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'stockpile-control-images.appspot.com',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const FIREBASE_REGION = 'southamerica-west1';

validateNotAppEngine();

// Inicializar Firebase
let app: FirebaseApp;
let db: Firestore;
let storage: FirebaseStorage;

try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    storage = getStorage(app);

    const useEmulator = isStandalone() && import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true';

    if (useEmulator) {
        // En Android real, debemos usar la IP de la máquina (ej: 192.168.1.15)
        // En Android Emulator, 10.0.2.2 es el alias del host PC
        const host = import.meta.env.VITE_FIREBASE_EMULATOR_HOST || '10.0.2.2';
        console.warn(`📡 [Firebase] CONECTANDO A EMULADORES EN: ${host}`);
        connectFirestoreEmulator(db, host, 8080);
        connectStorageEmulator(storage, host, 9199);
    } else {
        console.log(`☁️ [Firebase] OPERANDO EN MODO CLOUD (Requiere config. real)`);
    }

    console.log(`✅ Firebase inicializado correctamente`);
} catch (error) {
    console.error('❌ Error inicializando Firebase:', error);
    throw error;
}

/**
 * Información de configuración (para debugging y plugin context)
 */
export const getFirebaseConfig = () => ({
    projectId: firebaseConfig.projectId,
    region: FIREBASE_REGION,
    storageBucket: firebaseConfig.storageBucket,
    offlineEnabled: true,
    appEngineProhibited: true,
});

export const enableOfflinePersistence = async (): Promise<boolean> => {
    try {
        await enableIndexedDbPersistence(db);
        console.log('✅ Persistencia offline habilitada (IndexedDB)');
        return true;
    } catch (error: any) {
        return false;
    }
};

export const getFirebaseApp = (): FirebaseApp => app;
export const getDb = (): Firestore => db;
export const getStorageInstance = (): FirebaseStorage => storage;

export default {
    app,
    db,
    storage,
    region: FIREBASE_REGION,
    enableOfflinePersistence,
};
