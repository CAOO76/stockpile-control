import React, { useState, useMemo, useEffect } from 'react';
import { calculationEngine } from '../services/calculation-engine';
import { dataService } from '../services/DataService';
import { storageService } from '../services/StorageService';
import { Geolocation } from '@capacitor/geolocation';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import type { GeometryType } from './GeometrySelection';

interface ManualCaptureProps {
    assetId: string;
    initialGeometry: GeometryType;
    onSuccess: (measurementId: string) => void;
    onBack: () => void;
}

const GEOMETRY_NAMES: Record<string, string> = {
    'CONO_ELIPTICO': 'CONO ELÍPTICO',
    'CONO_ELIPTICO_TRUNCADO': 'CONO ELÍPTICO TRUNCADO',
    'CONO_TRUNCADO_PERIMETRO': 'CONO ELÍPTICO TRUNCADO POR PERÍMETRO'
};

/**
 * ManualCapture - VERSIÓN ULTRA-MINIMALISTA
 * Solución: Sin footer fijo para evitar solapamientos. 
 * Inputs masivos y limpios para máxima compatibilidad táctil.
 */
export const ManualCapture: React.FC<ManualCaptureProps> = ({ assetId, initialGeometry, onSuccess, onBack }) => {
    const [geometria] = useState<GeometryType>(initialGeometry);
    const [dimensions, setDimensions] = useState({ a: '', b: '', h: '', ap: '', bp: '', p: '', pp: '' });
    const [density, setDensity] = useState('1.66');
    const [photo, setPhoto] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [gps, setGps] = useState<{ lat: number; lng: number; acc: number } | null>(null);

    // Init GPS for trace
    useEffect(() => {
        const initGps = async () => {
            try {
                const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 5000 });
                setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude, acc: pos.coords.accuracy });
            } catch (err) { console.warn('[ManualCapture] GPS Error:', err); }
        };
        initGps();
    }, []);

    const takePhoto = async () => {
        try {
            const image = await Camera.getPhoto({
                quality: 80,
                allowEditing: false,
                resultType: CameraResultType.DataUrl,
                source: CameraSource.Camera,
                correctOrientation: true,
                saveToGallery: false
            });
            if (image.dataUrl) setPhoto(image.dataUrl);
        } catch (err) { console.warn('[ManualCapture] Camera Canceled'); }
    };

    // Cálculo de Estimación en Vivo
    const liveEstimation = useMemo(() => {
        const a = parseFloat(dimensions.a) || 0;
        const b = parseFloat(dimensions.b) || 0;
        const h = parseFloat(dimensions.h) || 0;
        const ap = parseFloat(dimensions.ap) || 0;
        const bp = parseFloat(dimensions.bp) || 0;
        const p = parseFloat(dimensions.p) || 0;
        const pp = parseFloat(dimensions.pp) || 0;

        if (geometria === 'CONO_ELIPTICO') {
            return calculationEngine.calculateEllipticCone(a, b, h);
        } else if (geometria === 'CONO_ELIPTICO_TRUNCADO') {
            return calculationEngine.calculateTruncatedEllipticCone(a, b, ap, bp, h);
        } else if (geometria === 'CONO_TRUNCADO_PERIMETRO') {
            return calculationEngine.calculatePerimeterTruncatedCone(p, pp, h);
        }
        return 0;
    }, [dimensions, geometria]);

    const handleSave = async () => {
        if (isSaving || liveEstimation <= 0 || !photo) {
            if (!photo) alert('Capturar foto de evidencia es obligatorio');
            return;
        }
        setIsSaving(true);
        try {
            console.log('[ManualCapture] Optimizing and uploading photo evidence...');

            // 1. Convert DataURL to Blob
            const response = await fetch(photo);
            const blob = await response.blob();

            // 2. Upload to Cloud Storage
            const uploadResult = await storageService.uploadStockpileImage(blob, assetId, {
                quality: 0.8,
                format: 'jpeg',
                maxWidth: 1600 // Slightly smaller for performance
            });

            const densityNum = parseFloat(density) || 0;
            const weight = calculationEngine.computeTotalMass(liveEstimation, densityNum);

            // 3. Save to Firestore using the URL from Storage
            const measurementId = await dataService.addMeasurement({
                assetId,
                timestamp: Date.now(),
                volumen_m3: liveEstimation,
                peso_t: weight,
                density_factor: densityNum || undefined,
                method: 'manual',
                photo_url: uploadResult.url,
                geometry: {
                    type: geometria,
                    dimensions: {
                        a: parseFloat(dimensions.a) || 0,
                        b: parseFloat(dimensions.b) || 0,
                        h: parseFloat(dimensions.h) || 0,
                        ap: parseFloat(dimensions.ap) || 0,
                        bp: parseFloat(dimensions.bp) || 0,
                        p: parseFloat(dimensions.p) || 0,
                        pp: parseFloat(dimensions.pp) || 0
                    }
                },
                location_metadata: gps ? {
                    lat: gps.lat,
                    lng: gps.lng,
                    accuracy: gps.acc
                } : undefined
            });

            onSuccess(measurementId);
        } catch (error: any) {
            console.error('[ManualCapture] Error:', error);
            alert(`Error al guardar: ${error.message || 'Falla de conexión'}`);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="h-screen w-screen bg-black flex flex-col font-atkinson text-white overflow-hidden relative">

            {/* Header Técnico (Fijo) */}
            <header className="flex-none pt-14 pb-4 px-6 flex items-center justify-between bg-black z-50">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center active:scale-95 transition-transform">
                        <span className="material-symbols-outlined text-3xl text-primary font-bold">arrow_back</span>
                    </button>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black tracking-[0.4em] uppercase text-white/20">MEDICIÓN</span>
                        <span className="text-xl font-black tracking-tight text-white/90 uppercase">
                            {GEOMETRY_NAMES[geometria] || geometria.replace(/_/g, ' ')}
                        </span>
                    </div>
                </div>
                <span className="material-symbols-outlined text-3xl opacity-20">landscape</span>
            </header>

            {/* Area de Trabajo (Scrollable) */}
            <main className="flex-1 overflow-y-auto px-6 py-8 relative">
                {/* Background Grid sutil */}
                <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
                    style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '30px 30px' }}>
                </div>

                <div className="max-w-sm mx-auto space-y-12 relative z-10">

                    {/* Captura de Evidencia Fotográfica */}
                    <div className="space-y-4">
                        <span className="text-[10px] font-black tracking-[0.4em] text-white/20 uppercase">EVIDENCIA TÉCNICA</span>
                        <div
                            onClick={takePhoto}
                            className={`relative w-full aspect-video rounded-3xl border-2 border-dashed transition-all overflow-hidden flex flex-col items-center justify-center
                                ${photo ? 'border-primary/40 bg-black' : 'border-white/10 bg-white/5 active:bg-white/10'}`}
                        >
                            {photo ? (
                                <>
                                    <img src={photo} className="w-full h-full object-cover" alt="Evidencia" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                    <div className="absolute bottom-4 left-4 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary text-xl">check_circle</span>
                                        <span className="text-[10px] font-black uppercase tracking-widest">CAPTURA OK</span>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setPhoto(null); }}
                                        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center border border-white/10"
                                    >
                                        <span className="material-symbols-outlined text-white/60">delete</span>
                                    </button>
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-5xl text-white/10 mb-2 font-light">add_a_photo</span>
                                    <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">TOUCH PARA CAPTURAR</span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Formulario de Medidas */}
                    <div className="grid grid-cols-1 gap-10">
                        {geometria === 'CONO_ELIPTICO' && (
                            <>
                                <Field label="DIÁMETRO MAYOR BASE (m)" value={dimensions.a} onChange={(v) => setDimensions({ ...dimensions, a: v })} />
                                <Field label="DIÁMETRO MENOR BASE (m)" value={dimensions.b} onChange={(v) => setDimensions({ ...dimensions, b: v })} />
                            </>
                        )}
                        {geometria === 'CONO_ELIPTICO_TRUNCADO' && (
                            <>
                                <Field label="DIÁMETRO A BASE (m)" value={dimensions.a} onChange={(v) => setDimensions({ ...dimensions, a: v })} />
                                <Field label="DIÁMETRO B BASE (m)" value={dimensions.b} onChange={(v) => setDimensions({ ...dimensions, b: v })} />
                                <Field label="DIÁMETRO A SUP (m)" value={dimensions.ap} onChange={(v) => setDimensions({ ...dimensions, ap: v })} />
                                <Field label="DIÁMETRO B SUP (m)" value={dimensions.bp} onChange={(v) => setDimensions({ ...dimensions, bp: v })} />
                            </>
                        )}
                        {geometria === 'CONO_TRUNCADO_PERIMETRO' && (
                            <>
                                <Field label="PERÍMETRO BASE (m)" value={dimensions.p} onChange={(v) => setDimensions({ ...dimensions, p: v })} />
                                <Field label="PERÍMETRO SUPERIOR (m)" value={dimensions.pp} onChange={(v) => setDimensions({ ...dimensions, pp: v })} />
                            </>
                        )}
                        <Field label="ALTURA TOTAL (m)" value={dimensions.h} onChange={(v) => setDimensions({ ...dimensions, h: v })} />
                        <Field label="FACTOR DENSIDAD (T/m3)" value={density} onChange={setDensity} />
                    </div>

                    {/* Dashboard de Resultados en Vivo */}
                    <div className="bg-[#111] border border-white/5 rounded-3xl p-8 flex flex-col items-center gap-2">
                        <span className="text-[11px] font-black text-white/30 tracking-[0.4em] uppercase">VOLUMEN ESTIMADO</span>
                        <div className="flex items-baseline gap-3">
                            <span className="text-6xl font-black text-primary tracking-tighter">
                                {liveEstimation.toFixed(1)}
                            </span>
                            <span className="text-lg font-black text-primary/40 uppercase">m³</span>
                        </div>
                    </div>

                    {/* Botón de Guardado (Dentro del flujo de scroll) */}
                    <div className="pt-8 pb-12 flex justify-center">
                        <button
                            onClick={handleSave}
                            disabled={isSaving || liveEstimation <= 0}
                            className={`w-full max-w-xs h-20 rounded-2xl flex items-center justify-center gap-4 transition-all
                                ${isSaving || liveEstimation <= 0
                                    ? 'bg-white/5 text-white/20'
                                    : 'bg-primary text-black font-black shadow-[0_0_30px_rgba(255,176,0,0.1)] active:scale-95'
                                }`}
                        >
                            {isSaving ? (
                                <span className="material-symbols-outlined text-4xl animate-spin">sync</span>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-4xl">measuring_tape</span>
                                    <span className="text-xl tracking-tight">GUARDAR MEDICIÓN</span>
                                </>
                            )}
                        </button>
                    </div>

                </div>
            </main>
        </div>
    );
};

/* Sub-componente de Campo Industrial */
const Field: React.FC<{ label: string, value: string, onChange: (v: string) => void }> = ({ label, value, onChange }) => (
    <div className="flex flex-col gap-3 group">
        <label className="text-[10px] font-black text-white/30 tracking-widest pl-1 uppercase group-focus-within:text-primary transition-colors">
            {label}
        </label>
        <div className="relative">
            <input
                type="text"
                inputMode="decimal"
                value={value}
                onChange={(e) => {
                    const val = e.target.value.replace(/,/g, '.').replace(/[^0-9.]/g, '');
                    onChange(val);
                }}
                className="w-full !bg-[#1a1a1a] border-2 border-white/10 rounded-2xl h-16 px-6 text-3xl font-black !text-white outline-none focus:border-primary transition-all text-center tracking-tight"
                placeholder="0.00"
                autoComplete="off"
            />
        </div>
    </div>
);
