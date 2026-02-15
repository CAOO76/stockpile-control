import React, { useState, useEffect } from 'react';
import { dataService } from '../services/DataService';
import type { StockpileMeasurement } from '../types/StockpileAsset';

interface MeasurementDetailProps {
    measurementId: string;
    onBack: () => void;
}

const DIMENSION_LABELS: Record<string, string> = {
    a: 'EJE MAYOR',
    b: 'EJE MENOR',
    h: 'ALTURA',
    ap: 'EJE MAYOR SUPERIOR',
    bp: 'EJE MENOR SUPERIOR',
    p: 'PERÍMETRO INFERIOR',
    pp: 'PERÍMETRO SUPERIOR',
    base_m: 'EJE MAYOR',
    height_m: 'ALTURA'
};

const GEOMETRY_NAMES: Record<string, string> = {
    'CONO_ELIPTICO': 'CONO ELÍPTICO',
    'CONO_ELIPTICO_TRUNCADO': 'CONO ELÍPTICO TRUNCADO',
    'CONO_TRUNCADO_PERIMETRO': 'CONO ELÍPTICO TRUNCADO POR PERÍMETRO'
};

/**
 * MeasurementDetail - Vista de Detalle (Solo Lectura)
 * Muestra el respaldo técnico completo de una cubicación.
 */
export const MeasurementDetail: React.FC<MeasurementDetailProps> = ({ measurementId, onBack }) => {
    const [measurement, setMeasurement] = useState<StockpileMeasurement | null>(null);
    const [assetName, setAssetName] = useState<string>('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let unsubscribe: (() => void) | undefined;
        let mounted = true;

        const loadDetail = async () => {
            try {
                // 1. Suscribirse a la medición en tiempo real
                unsubscribe = dataService.subscribeToMeasurement(measurementId, async (data) => {
                    if (!mounted) return;

                    if (data) {
                        setMeasurement(data);
                        // Cargar nombre del activo si no lo tenemos
                        if (data.assetId && !assetName) {
                            try {
                                const asset = await dataService.getAsset(data.assetId);
                                if (asset && mounted) setAssetName(asset.name);
                            } catch (e) { console.warn('Error loading asset name', e); }
                        }
                    } else {
                        console.warn('[Detail] Measurement not found');
                    }
                    setLoading(false);
                });

            } catch (error) {
                console.error('[Detail] Error setting up subscription:', error);
                if (mounted) setLoading(false);
            }
        };

        loadDetail();

        return () => {
            mounted = false;
            if (unsubscribe) unsubscribe();
        };
    }, [measurementId]);

    const renderDimensionRow = (key: string, value: number) => (
        <div key={key} className="flex items-center justify-between p-4 bg-white/[0.01] border border-white/5 rounded-3xl active:bg-white/5 transition-colors">
            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-none">
                {DIMENSION_LABELS[key] || key.toUpperCase()}
            </span>
            <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-white/90 tracking-tighter italic">
                    {value.toFixed(2)}
                </span>
                <span className="text-[10px] font-black text-white/20 uppercase tracking-tighter">m</span>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="h-screen w-screen bg-black flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!measurement) return null;

    return (
        <main className="h-screen w-screen bg-[#0a0a0a] flex flex-col font-atkinson text-white overflow-hidden selection:bg-primary/30">
            {/* Header: User Priority 1 (Asset) & 2 (Date) */}
            <header className="shrink-0 pt-14 pb-4 px-6 flex items-center justify-between bg-black/40 backdrop-blur-2xl border-b border-white/5 z-50">
                <button
                    onClick={onBack}
                    className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center active:scale-90 transition-all"
                >
                    <span className="material-symbols-outlined text-4xl text-primary">arrow_back</span>
                </button>

                <div className="flex items-center gap-4">
                    {/* Botón Ignorar / Restaurar */}
                    <button
                        onClick={async () => {
                            if (!measurement) return;
                            const isIgnored = !!measurement.ignored;
                            const msg = isIgnored
                                ? '¿Restaurar esta medición? Volverá a contar para el inventario.'
                                : '¿Ignorar esta medición? Se excluirá de los cálculos pero NO se borrará.';

                            if (confirm(msg)) {
                                await dataService.toggleIgnoreMeasurement(measurement.id, measurementId, isIgnored);
                            }
                        }}
                        className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all active:scale-95
                            ${measurement.ignored
                                ? 'bg-red-500/20 border-red-500 text-red-500'
                                : 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/10'}`}
                        title={measurement.ignored ? "Restaurar Medición" : "Ignorar Medición"}
                    >
                        <span className="material-symbols-outlined text-2xl">
                            {measurement.ignored ? 'restore_from_trash' : 'remove_selection'}
                        </span>
                    </button>

                    <div className="flex flex-col items-end">
                        <h1 className="text-lg font-black tracking-tight text-white/95 uppercase">{assetName || 'ACTIVO'}</h1>
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] font-black tracking-[0.2em] text-white/40 uppercase">
                                {new Date(measurement.timestamp).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
                            </span>
                            <span className="text-[9px] font-black tracking-widest text-primary/60 uppercase mt-0.5">
                                {GEOMETRY_NAMES[measurement.geometry?.type || ''] || 'GEOMETRÍA NO DEFINIDA'}
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Content: High Contrast & Giant Metrics */}
            <div className="flex-1 overflow-y-auto hide-scrollbar relative">

                {/* Banner de Ignorado */}
                {measurement.ignored && (
                    <div className="sticky top-0 z-40 bg-red-600/90 backdrop-blur text-white py-2 px-6 flex items-center justify-center gap-3 shadow-2xl">
                        <span className="material-symbols-outlined text-xl">warning</span>
                        <span className="text-[10px] font-black tracking-[0.2em] uppercase">MEDICIÓN IGNORADA • NO CALCULA INVENTARIO</span>
                    </div>
                )}

                {/* Hero Evidence: Technical Cut */}
                <div className={`relative w-full aspect-[16/10] bg-black border-b border-white/10 group ${measurement.ignored ? 'grayscale opacity-50' : ''}`}>
                    <img
                        src={measurement.photo_url}
                        className="w-full h-full object-cover grayscale-[0.2] group-active:grayscale-0 transition-all duration-700"
                        alt="Evidencia"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent opacity-60"></div>
                </div>

                <div className={`px-6 -mt-10 relative z-10 space-y-10 pb-32 ${measurement.ignored ? 'opacity-50 pointer-events-none' : ''}`}>
                    {/* Primary Metrics: Ultra Visual Ergonomics */}
                    <div className="space-y-4">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-1">VOLUMEN CALCULADO</span>
                            <div className="flex items-baseline gap-3">
                                <span className={`text-7xl font-black tracking-tighter leading-none ${measurement.ignored ? 'text-white/20 decoration-line-through' : 'text-primary'}`}>
                                    {measurement.volumen_m3.toFixed(1)}
                                </span>
                                <span className="text-2xl font-black text-primary/40 uppercase tracking-tighter italic">m³</span>
                            </div>
                        </div>

                        <div className="flex flex-col pt-6 border-t border-white/5">
                            <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-1">PESO ESTIMADO</span>
                            <div className="flex items-baseline gap-3">
                                <span className="text-5xl font-black text-white/90 tracking-tighter leading-none">
                                    {measurement.peso_t.toFixed(1)}
                                </span>
                                <span className="text-xl font-black text-white/20 uppercase tracking-tighter italic">t</span>
                            </div>
                        </div>
                    </div>

                    {/* Technical Breakdown: Industrial List (User Priority 3: All measurements & Units) */}
                    <div className="space-y-6 border-t border-white/5 pt-8">
                        <div className="flex items-center gap-2 px-2">
                            <span className="material-symbols-outlined text-white/20 text-sm">database</span>
                            <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">DATOS TÉCNICOS DE TERRENO (HARD DATA)</span>
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                            {/* Explicit rendering based on Geometry Type */}
                            {(() => {
                                const type = measurement.geometry?.type;
                                const dims = measurement.geometry?.dimensions || {};

                                // Define strict field lists for each geometry
                                const fieldsToShow: string[] = [];

                                if (type === 'CONO_ELIPTICO') {
                                    fieldsToShow.push('a', 'b', 'h');
                                } else if (type === 'CONO_ELIPTICO_TRUNCADO') {
                                    fieldsToShow.push('a', 'b', 'ap', 'bp', 'h');
                                } else if (type === 'CONO_TRUNCADO_PERIMETRO') {
                                    fieldsToShow.push('p', 'pp', 'h');
                                } else {
                                    // Fallback for legacy or unknown types (e.g. digital scan with just base/height)
                                    // Try to show what we have if it's not one of the standard hard types
                                    if (dims.base_m || dims.height_m) {
                                        fieldsToShow.push('base_m', 'height_m');
                                    } else {
                                        // Ultimate fallback: show anything non-zero
                                        return Object.entries(dims)
                                            .filter(([_, v]) => v > 0)
                                            .map(([key, value]) => renderDimensionRow(key, value));
                                    }
                                }

                                return fieldsToShow.map(key => {
                                    // Get value, handle potential missing keys gracefully
                                    const val = dims[key] !== undefined ? dims[key] : 0;
                                    // Don't hide if 0, show it so user knows it's missing/zero? 
                                    // Actually user complained "FALTAN DATOS", so showing 0 is better than hiding.
                                    return renderDimensionRow(key, val);
                                });
                            })()}
                        </div>

                        <div className="grid grid-cols-1 gap-2 border-t border-white/5 pt-6">
                            <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-3xl">
                                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-none">DENSIDAD APLICADA</span>
                                <span className="text-lg font-black text-white/90">{measurement.density_factor?.toFixed(2) || '1.66'} <small className="text-[10px] opacity-30 italic">t/m³</small></span>
                            </div>
                        </div>

                        {/* GPS Section: Embedded Satellite Map (Priority 5) */}
                        {measurement.location_metadata && (
                            <div className="space-y-4 pt-4">
                                <div className="flex flex-col gap-1 px-2">
                                    <div className="flex justify-between items-end">
                                        <span className="text-[9px] font-bold text-primary italic uppercase tracking-widest">LOCALIZACIÓN SATELITAL (EARTH)</span>
                                        <span className="text-[9px] font-bold text-white/20 italic">±{measurement.location_metadata.accuracy.toFixed(1)}m</span>
                                    </div>
                                    <p className="text-sm font-black text-white/40 font-mono tracking-tighter">
                                        {measurement.location_metadata.lat.toFixed(6)} / {measurement.location_metadata.lng.toFixed(6)}
                                    </p>
                                </div>

                                <div className="w-full aspect-video rounded-[40px] overflow-hidden border border-white/10 bg-black shadow-2xl relative">
                                    <iframe
                                        title="Ubicación del Activo"
                                        width="100%"
                                        height="100%"
                                        frameBorder="0"
                                        src={`https://maps.google.com/maps?q=${measurement.location_metadata.lat},${measurement.location_metadata.lng}&z=19&t=k&output=embed`}
                                        className="opacity-100"
                                    ></iframe>
                                    <div className="absolute inset-0 pointer-events-none border-[12px] border-black/20 rounded-[40px]" />
                                </div>
                            </div>
                        )}

                        {/* Final Archival Disclaimer */}
                        <div className="py-10 flex flex-col items-center gap-3">
                            <span className="material-symbols-outlined text-white/5 text-4xl">inventory_2</span>
                            <p className="text-[9px] text-white/10 font-bold text-center uppercase tracking-[0.4em] leading-relaxed max-w-[240px]">
                                Registro Histórico Inmutable • Verificado por Sistema Central de Cubicaciones
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
};
