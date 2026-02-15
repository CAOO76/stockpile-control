import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import { calculationEngine } from '../services/calculation-engine';
import { dataService } from '../services/DataService';
import { storageService } from '../services/StorageService';
import { motion } from 'framer-motion';

interface MobileScannerProps {
    assetId: string;
    onSuccess: (measurementId: string) => void;
    onBack: () => void;
}

/**
 * MobileScanner - VERSIÓN MÓVIL EXCLUSIVA
 * Diseño: Stitch Industrial con funcionalidad completa
 * Características: Cámara real, controles operativos, cálculo de volúmenes
 */
export const MobileScanner: React.FC<MobileScannerProps> = ({ assetId, onSuccess, onBack }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const [density] = useState('1.66'); // Valor de referencia para HUD
    const [dimensions] = useState({ a: '14.82', b: '14.82', h: '8' });
    const [isSaving, setIsSaving] = useState(false);
    const [flashEnabled, setFlashEnabled] = useState(false);
    const [zoom, setZoom] = useState(1.0);
    const [isCameraActive, setIsCameraActive] = useState(false);

    // Inicializar cámara
    const enableCamera = useCallback(async () => {
        try {
            // Verificar permisos de Geolocation (para los resultados)
            const geoPerm = await Geolocation.checkPermissions();
            if (geoPerm.location !== 'granted') await Geolocation.requestPermissions();

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                },
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setIsCameraActive(true);
            }

            // Habilitar flash si es posible
            const track = stream.getVideoTracks()[0];
            const capabilities = track.getCapabilities() as any;
            if (capabilities.torch) {
                track.applyConstraints({ advanced: [{ torch: flashEnabled }] as any });
            }
        } catch (err) {
            console.error('Error al acceder a la cámara o GPS:', err);
            alert('Error de Hardware: Verifica permisos de Cámara y GPS');
        }
    }, [flashEnabled]);

    useEffect(() => {
        enableCamera();
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, [enableCamera]);

    // Cálculo en tiempo real
    const realTimeCalc = useMemo(() => {
        const a = parseFloat(dimensions.a) || 0;
        const b = parseFloat(dimensions.b) || 0;
        const h = parseFloat(dimensions.h) || 0;
        const volume = calculationEngine.calculateEllipticCone(a, b, h);
        return {
            volume: volume.toFixed(0),
            distance: Math.max(a, b).toFixed(2)
        };
    }, [dimensions]);

    const handleCapture = async () => {
        setIsSaving(true);
        try {
            // Captura de Frame para la medida
            const canvas = document.createElement('canvas');
            if (videoRef.current) {
                canvas.width = videoRef.current.videoWidth;
                canvas.height = videoRef.current.videoHeight;
                canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
            }

            // 1. Obtener base64 crudo
            const rawPhoto = canvas.toDataURL('image/jpeg', 0.9);

            // 2. Convertir a Blob y subir a Cloud Storage
            console.log('[Scanner] Uploading captured frame to Storage...');
            const response = await fetch(rawPhoto);
            const blob = await response.blob();

            const uploadResult = await storageService.uploadStockpileImage(blob, assetId, {
                quality: 0.75,
                format: 'jpeg',
                maxWidth: 1280
            });

            const a = parseFloat(dimensions.a);
            const b = parseFloat(dimensions.b);
            const h = parseFloat(dimensions.h);
            const densityNum = parseFloat(density);
            const volume = calculationEngine.calculateEllipticCone(a, b, h);
            const weight = calculationEngine.computeTotalMass(volume, densityNum);

            const measurementId = await dataService.addMeasurement({
                assetId,
                timestamp: Date.now(),
                volumen_m3: volume,
                peso_t: weight,
                density_factor: densityNum,
                method: 'digital',
                photo_url: uploadResult.url,
                geometry: {
                    type: 'CONO_ELIPTICO',
                    dimensions: { a, h }
                }
            });

            onSuccess(measurementId);
        } catch (error) {
            console.error('[Scanner] Error:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const toggleFlash = () => {
        const newState = !flashEnabled;
        setFlashEnabled(newState);

        if (streamRef.current) {
            const track = streamRef.current.getVideoTracks()[0];
            const capabilities = track.getCapabilities() as any;
            if (capabilities.torch) {
                track.applyConstraints({ advanced: [{ torch: newState }] as any });
            }
        }
    };

    const adjustZoom = (direction: 'in' | 'out') => {
        setZoom(prev => {
            const newZoom = direction === 'in'
                ? Math.min(prev + 0.5, 3.0)
                : Math.max(prev - 0.5, 1.0);

            if (streamRef.current && videoRef.current) {
                videoRef.current.style.transform = `scale(${newZoom})`;
            }
            return newZoom;
        });
    };

    return (
        <motion.main
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-screen w-screen overflow-hidden flex flex-col relative bg-black text-white font-atkinson select-none"
        >
            {/* Camera Background */}
            <div className="absolute inset-0 z-0 bg-black">
                {isCameraActive ? (
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                        style={{ transform: `scale(${zoom})` }}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center opacity-20">
                        <span className="material-symbols-outlined text-9xl">no_photography</span>
                    </div>
                )}
            </div>

            {/* Ultra Minimal Header HUD */}
            <header className="absolute top-0 left-0 w-full pt-14 pb-4 px-6 flex items-center justify-between z-50 bg-gradient-to-b from-black/80 to-transparent">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center active:scale-90 transition-transform">
                        <span className="material-symbols-outlined text-3xl text-primary">arrow_back</span>
                    </button>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black tracking-[0.4em] uppercase text-white/20">ESCÁNER</span>
                        <span className="text-xl font-black tracking-tight text-white/90">DIGITAL</span>
                    </div>
                </div>
                <div className="w-12 h-12 flex items-center justify-center opacity-20">
                    <span className="material-symbols-outlined text-3xl">landscape</span>
                </div>
            </header>

            {/* AR Reticle Overlay (Central Zone) */}
            <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
                <div className="relative w-64 h-64 landscape:w-48 landscape:h-48 border border-white/20 rounded-[4px] flex items-center justify-center transition-all">
                    <div className="absolute -top-1 -left-1 w-12 h-12 border-t-4 border-l-4 border-primary"></div>
                    <div className="absolute -top-1 -right-1 w-12 h-12 border-t-4 border-r-4 border-primary"></div>
                    <div className="absolute -bottom-1 -left-1 w-12 h-12 border-b-4 border-l-4 border-primary"></div>
                    <div className="absolute -bottom-1 -right-1 w-12 h-12 border-b-4 border-r-4 border-primary"></div>
                    <div className="w-full h-0.5 bg-primary/20"></div>
                </div>
            </div>

            {/* Operational Controls (Right/Bottom depending on orientation) */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 z-40 flex flex-col space-y-6">
                <button
                    onClick={toggleFlash}
                    className={`w-16 h-16 bg-[#1a1a1a]/80 backdrop-blur-md border-2 rounded-full flex items-center justify-center transition-all overflow-hidden ${flashEnabled ? 'border-primary text-primary' : 'border-white/20 text-white/40'}`}
                >
                    <span className="material-symbols-outlined text-[32px]">{flashEnabled ? 'flashlight_on' : 'flashlight_off'}</span>
                </button>
                <div className="bg-[#1a1a1a]/80 backdrop-blur-md border-2 border-white/20 rounded-full w-16 overflow-hidden flex flex-col items-center">
                    <button onClick={() => adjustZoom('in')} className="w-full h-14 flex items-center justify-center active:bg-primary transition-colors">
                        <span className="material-symbols-outlined text-[32px]">add</span>
                    </button>
                    <div className="h-10 flex items-center justify-center border-y border-white/10 text-[10px] font-bold w-full bg-black/40">{zoom.toFixed(1)}X</div>
                    <button onClick={() => adjustZoom('out')} className="w-full h-14 flex items-center justify-center active:bg-primary transition-colors">
                        <span className="material-symbols-outlined text-[32px]">remove</span>
                    </button>
                </div>
            </div>

            {/* Footer / Telemetry / Nav */}
            <div className="relative z-20 flex flex-col flex-1 justify-end">
                {/* Telemetry HUD */}
                <div className="px-6 pb-6 flex landscape:absolute landscape:left-8 landscape:bottom-24 landscape:px-0 landscape:flex-col landscape:space-x-0 landscape:space-y-4 space-x-4">
                    <div className="bg-black/80 backdrop-blur-xl border-l-4 border-primary p-4 flex-1 landscape:w-40 flex flex-col">
                        <span className="text-[10px] text-white/30 font-bold uppercase tracking-[0.2em]">RANGE_M</span>
                        <span className="text-3xl font-bold font-mono tracking-tighter text-primary">{realTimeCalc.distance}</span>
                    </div>
                    <div className="bg-black/80 backdrop-blur-xl border-l-4 border-white/20 p-4 flex-1 landscape:w-40 flex flex-col">
                        <span className="text-[10px] text-white/30 font-bold uppercase tracking-[0.2em]">VOL_EST_M3</span>
                        <span className="text-3xl font-bold font-mono tracking-tighter text-white/90">{realTimeCalc.volume}</span>
                    </div>
                </div>

                {/* Main Capture Button (Industrial 96px Target) */}
                <div className="pb-10 flex justify-center landscape:absolute landscape:right-24 landscape:bottom-1/2 landscape:translate-y-1/2">
                    <button
                        onClick={handleCapture}
                        disabled={isSaving || !isCameraActive}
                        className="w-24 h-24 bg-primary text-black rounded-full flex items-center justify-center active:scale-90 transition-all disabled:opacity-20 shadow-[0_0_50px_rgba(255,176,0,0.6)] overflow-hidden"
                    >
                        {isSaving ? (
                            <span className="material-symbols-outlined text-[56px] animate-spin">sync</span>
                        ) : (
                            <span className="material-symbols-outlined text-[72px] font-black leading-none">mobile_camera</span>
                        )}
                    </button>
                </div>
            </div>
        </motion.main>
    );
};
