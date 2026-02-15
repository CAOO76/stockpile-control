import React, { useState, useEffect } from 'react';
import { dataService } from '../services/DataService';
import { storageService } from '../services/StorageService';
import { M3TextField } from './M3TextField';
import { M3Select } from './M3Select';
import { motion } from 'framer-motion';
import { Geolocation } from '@capacitor/geolocation';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

interface StockpileRegistrationProps {
    onSuccess: (assetId: string) => void;
    onCancel: () => void;
}

/**
 * StockpileRegistration (V3.2 - Visual Optimized)
 * Optimized images on client-side for performance and storage.
 */
export const StockpileRegistration: React.FC<StockpileRegistrationProps> = ({ onSuccess, onCancel }) => {
    const [name, setName] = useState('');
    const [clase, setClase] = useState<'mineral' | 'esteril' | 'baja_ley'>('mineral');
    const [locationRef, setLocationRef] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [savedAssetId, setSavedAssetId] = useState<string | null>(null);
    const [gps, setGps] = useState<{ lat: number; lng: number; acc: number } | null>(null);
    const [photo, setPhoto] = useState<string | null>(null);

    useEffect(() => {
        const initGps = async () => {
            try {
                const permission = await Geolocation.checkPermissions();
                if (permission.location !== 'granted') {
                    await Geolocation.requestPermissions();
                }
                const pos = await Geolocation.getCurrentPosition({
                    enableHighAccuracy: true,
                    timeout: 10000
                });
                setGps({
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                    acc: pos.coords.accuracy
                });
            } catch (err) {
                console.warn('[Registration] Capacitor GPS Error:', err);
            }
        };
        initGps();
    }, []);

    const takePhoto = async () => {
        if (isSaved) return;
        try {
            const image = await Camera.getPhoto({
                quality: 90, // We optimize manually after
                allowEditing: false,
                resultType: CameraResultType.DataUrl,
                source: CameraSource.Camera,
                correctOrientation: true,
                saveToGallery: false
            });

            if (image.dataUrl) {
                setPhoto(image.dataUrl);
            }
        } catch (err) {
            console.warn('[Registration] Camera Canceled or Error:', err);
        }
    };

    const handleSave = async () => {
        if (!name.trim() || !photo) return;
        setIsSaving(true);

        try {
            console.log('[Registration] Optimizing and uploading visuals (HD REPORT)...');

            // 1. Convert DataURL to Blob
            const response = await fetch(photo);
            const blob = await response.blob();

            // 2. Upload to Cloud Storage
            const uploadResult = await storageService.uploadStockpileImage(blob, `new_${Date.now()}`, {
                quality: 0.85,
                format: 'jpeg',
                maxWidth: 1920
            });

            console.log('[Registration] Creating asset with Storage visuals...');
            const assetId = await dataService.createAsset({
                name,
                clase,
                location_ref: locationRef,
                initial_photo_url: uploadResult.url,
                thumbnail_url: uploadResult.url, // Standardizing to one URL for now to save complexity
                geo_point: {
                    latitude: gps?.lat || 0,
                    longitude: gps?.lng || 0,
                    altitude: null,
                    accuracy: gps?.acc || 0
                }
            });
            console.log('[Registration] Success:', assetId);

            setSavedAssetId(assetId);
            setIsSaved(true);

            if (navigator.vibrate) navigator.vibrate([30, 10, 30]);

        } catch (error: any) {
            console.error('[Registration] Save error:', error);
            alert(`ERROR: ${error.message || 'Error de conexión'}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleBack = () => {
        if (isSaved && savedAssetId) {
            onSuccess(savedAssetId);
        } else {
            onCancel();
        }
    };

    return (
        <motion.main
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-screen w-screen bg-black flex flex-col font-atkinson text-white overflow-hidden select-none"
        >
            <header className="pt-14 pb-4 px-6 border-b border-white/5 bg-black/40 backdrop-blur-xl flex items-center justify-between z-50">
                <div className="flex flex-col">
                    <h1 className="text-[9px] font-bold tracking-[0.4em] uppercase text-white/30">
                        {isSaved ? 'ACTIVO REGISTRADO' : 'NUEVO ACTIVO'}
                    </h1>
                    <h2 className="text-lg font-bold tracking-tight text-white/90">
                        {isSaved ? 'Ficha de Alta' : 'Registro'}
                    </h2>
                </div>
                <div className="flex gap-3">
                    {isSaved ? (
                        <>
                            <button onClick={handleBack} className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center active:scale-90 border border-white/5">
                                <span className="material-symbols-outlined text-primary">arrow_back</span>
                            </button>
                            <button onClick={() => setIsSaved(false)} className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center active:scale-90 border border-white/5 shadow-[0_0_15px_rgba(255,176,0,0.1)]">
                                <span className="material-symbols-outlined text-primary">edit</span>
                            </button>
                        </>
                    ) : (
                        <>
                            <button onClick={onCancel} className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center active:scale-90 border border-white/5">
                                <span className="material-symbols-outlined text-red-500">close</span>
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving || !name.trim() || !locationRef.trim() || !photo}
                                className="w-16 h-12 rounded-2xl bg-primary flex items-center justify-center active:scale-90 shadow-[0_0_20px_rgba(255,176,0,0.2)] disabled:opacity-20 disabled:grayscale"
                            >
                                {isSaving ? <span className="material-symbols-outlined animate-spin text-black">sync</span> : <span className="material-symbols-outlined text-black font-bold">save</span>}
                            </button>
                        </>
                    )}
                </div>
            </header>

            <section className="flex-1 overflow-y-auto p-6 space-y-6 hide-scrollbar relative">
                <div className="space-y-3">
                    <h3 className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/20">Evidencia Inicial</h3>
                    <div
                        onClick={takePhoto}
                        className="relative w-full aspect-video bg-white/5 rounded-3xl border border-dashed border-white/10 flex flex-col items-center justify-center overflow-hidden active:bg-white/10"
                    >
                        {photo ? (
                            <>
                                <img src={photo} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/20" />
                                {!isSaved && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setPhoto(null); }}
                                        className="absolute top-4 right-4 w-10 h-10 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10"
                                    >
                                        <span className="material-symbols-outlined text-white/60">delete</span>
                                    </button>
                                )}
                                <div className="absolute bottom-4 left-4 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-green-500 text-sm">check_circle</span>
                                    <span className="text-[8px] font-black uppercase text-white tracking-widest bg-black/40 px-2 py-0.5 rounded">Capturado</span>
                                </div>
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-4xl text-white/10 mb-2">add_a_photo</span>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-white/20">Capturar Portada</span>
                            </>
                        )}
                    </div>
                </div>

                <div className={`space-y-4 ${isSaved ? 'opacity-60 pointer-events-none' : ''}`}>
                    <M3TextField label="ID / NOMBRE" value={name} onChange={setName} placeholder="Ej: A9" autoComplete="off" />
                    <M3Select
                        label="CLASE"
                        value={clase}
                        options={[
                            { id: 'mineral', label: 'Mineral' },
                            { id: 'esteril', label: 'Estéril' },
                            { id: 'baja_ley', label: 'Baja Ley' }
                        ]}
                        onChange={(v) => setClase(v as any)}
                    />
                    <M3TextField label="REFERENCIA UBICACIÓN" value={locationRef} onChange={setLocationRef} placeholder="Ej: Sector Chancado 1" autoComplete="off" />

                    <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                        <span className="text-[8px] font-bold uppercase tracking-[0.1em] text-white/20 block">GEODATOS</span>
                        <div className="flex justify-between items-center mt-1">
                            <span className="text-xs font-bold text-primary/60">PRECISIÓN: {gps ? `±${gps.acc.toFixed(1)} m` : '---'}</span>
                            <span className="text-[10px] font-medium text-white/30 uppercase">
                                {gps ? `${gps.lat.toFixed(5)}, ${gps.lng.toFixed(5)}` : 'Sincronizando GPS...'}
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            <footer className="p-6 pb-12 flex justify-center opacity-10">
                <span className="text-[8px] font-black tracking-[0.8em] text-white">NATIVE_BRIDGE_V6</span>
            </footer>
        </motion.main>
    );
};
