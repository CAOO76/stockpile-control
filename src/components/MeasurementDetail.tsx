import React, { useState, useEffect } from 'react';
import type { StockpileMeasurement } from '../types/StockpileAsset';
import { dataService } from '../services/DataService';

interface MeasurementDetailProps {
    measurement?: StockpileMeasurement;
    measurementId?: string;
}

/**
 * MeasurementDetail - DOSSIER TÉCNICO DE TRAZABILIDAD
 * Estándar: Elite Industrial Minimalism (Blueprint Mode)
 * Soporta carga directa via objeto (Desktop) o diferida via ID (Mobile).
 */
export const MeasurementDetail: React.FC<MeasurementDetailProps> = ({ measurement: initialMeasurement, measurementId }) => {
    const [measurement, setMeasurement] = useState<StockpileMeasurement | null>(initialMeasurement || null);
    const [loading, setLoading] = useState(!initialMeasurement && !!measurementId);
    
    const apiKey = (import.meta as any).env.VITE_GOOGLE_MAPS_API_KEY;

    useEffect(() => {
        if (initialMeasurement) {
            setMeasurement(initialMeasurement);
            setLoading(false);
        }
    }, [initialMeasurement]);

    useEffect(() => {
        if (!initialMeasurement && measurementId) {
            setLoading(true);
            dataService.getMeasurement(measurementId).then(m => {
                setMeasurement(m);
                setLoading(false);
            });
        }
    }, [measurementId, initialMeasurement]);

    if (loading) {
        return (
            <div className="flex-1 bg-black flex items-center justify-center">
                <div className="text-[10px] font-black opacity-20 uppercase animate-pulse">CARGANDO_DOSSIER...</div>
            </div>
        );
    }

    if (!measurement) return null;

    const date = new Date(measurement.timestamp);

    return (
        <div className="flex-1 bg-black flex flex-col select-none antialiased animate-in fade-in slide-in-from-left-4 duration-200 overflow-y-auto scrollbar-none">
            {/* TOP BAR: TECHNICAL IDENTIFIER */}
            <div className="h-14 border-b border-white/10 flex items-center justify-between px-6 bg-zinc-950 sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <span className="text-[12px] font-black opacity-30 uppercase tracking-widest mr-2">ID_DOSSIER</span>
                    <span className="text-sm font-mono font-bold text-[#C68346] tracking-tighter">
                        {measurement.id.toUpperCase()}
                    </span>
                </div>
            </div>

            <div className="flex-1 flex flex-col">
                
                {/* SECTION A: VISUAL EVIDENCE (BINARIA - HORIZONTAL) */}
                <div className="border-b border-white/10 grid grid-cols-2 h-48 bg-zinc-950">
                    <div className="border-r border-white/10 relative overflow-hidden group">
                        <img 
                            src={measurement.photo_url} 
                            className="w-full h-full object-cover grayscale brightness-75 hover:grayscale-0 hover:brightness-100 transition-all duration-300" 
                            alt=""
                        />
                        <div className="absolute bottom-2 left-3 z-10">
                            <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em] bg-black/60 px-2 py-0.5">VISTA_TERRENO</span>
                        </div>
                    </div>
                    <div className="relative overflow-hidden group bg-black">
                        {apiKey && measurement.location_metadata ? (
                            <img 
                                src={`https://maps.googleapis.com/maps/api/staticmap?center=${measurement.location_metadata.lat},${measurement.location_metadata.lng}&zoom=18&size=400x400&maptype=satellite&scale=2&markers=color:0xC68346%7C${measurement.location_metadata.lat},${measurement.location_metadata.lng}&key=${apiKey}`}
                                className="w-full h-full object-cover opacity-60 grayscale hover:opacity-100 transition-all duration-300"
                                alt=""
                            />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900/50">
                                <span className="text-[8px] font-mono opacity-20 text-white">GPS_OFFLINE</span>
                            </div>
                        )}
                        <div className="absolute bottom-2 right-3 z-10 text-right">
                            <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em] bg-black/60 px-2 py-0.5">GEORREFERENCIA</span>
                        </div>
                    </div>
                </div>
                
                {/* GPS COORDINATES STRIP (CONTEXTO INMEDIATO) */}
                <div className="bg-zinc-950 border-b border-white/10 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <div className="flex flex-col">
                            <span className="text-[11px] font-black opacity-30 uppercase tracking-[0.2em] leading-none mb-2">LATITUD</span>
                            <span className="text-[14px] font-bold font-mono text-white/90 tabular-nums">
                                {measurement.location_metadata?.lat.toFixed(6) || '0.000000'}
                            </span>
                        </div>
                        <div className="w-px h-8 bg-white/10"></div>
                        <div className="flex flex-col">
                            <span className="text-[11px] font-black opacity-30 uppercase tracking-[0.2em] leading-none mb-2">LONGITUD</span>
                            <span className="text-[14px] font-bold font-mono text-white/90 tabular-nums">
                                {measurement.location_metadata?.lng.toFixed(6) || '0.000000'}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 bg-[#C68346]/10 px-4 py-2 border border-[#C68346]/20">
                        <span className="material-symbols-outlined text-[18px] text-[#C68346]">satellite_alt</span>
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] font-black opacity-30 uppercase tracking-[0.1em] leading-none mb-1">PRECISIÓN_H</span>
                            <span className="text-[14px] font-bold font-mono text-[#C68346]">
                                ±{measurement.location_metadata?.accuracy.toFixed(1)}M
                            </span>
                        </div>
                    </div>
                </div>

                {/* SECTION B: ANALYTICAL DATA */}
                <div className="flex flex-col bg-black">
                    
                    {/* VOLUMETRY BLOCK (DUAL KPI) */}
                    <div className="p-6 border-b border-white/10 bg-gradient-to-br from-white/[0.02] to-transparent grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[12px] font-black text-[#C68346]/60 block mb-2 tracking-[0.3em] uppercase">VOLUMEN_M3</label>
                            <div className="text-4xl font-black font-mono tracking-tighter text-white leading-none">
                                {measurement.volumen_m3.toLocaleString('es-CL', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} <span className="text-sm opacity-20 font-sans tracking-normal">m³</span>
                            </div>
                        </div>
                        <div className="border-l border-white/5 pl-4">
                            <label className="text-[12px] font-black text-[#C68346]/60 block mb-2 tracking-[0.3em] uppercase">PESO_TON</label>
                            <div className="text-4xl font-black font-mono tracking-tighter text-white leading-none">
                                {measurement.peso_t.toLocaleString('es-CL', { maximumFractionDigits: 0 })} <span className="text-sm opacity-20 font-sans tracking-normal">t</span>
                            </div>
                        </div>
                    </div>

                    {/* METADATA BLOCK (COMPACT) */}
                    <div className="p-6 grid grid-cols-2 gap-x-6 gap-y-6">
                        <div>
                            <label className="text-[12px] font-black opacity-30 block mb-1 tracking-[0.2em] uppercase">FECHA</label>
                            <div className="text-base font-black font-mono uppercase text-white/90">
                                {date.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                            </div>
                        </div>
                        <div>
                            <label className="text-[12px] font-black opacity-30 block mb-1 tracking-[0.2em] uppercase">HORA</label>
                            <div className="text-base font-black font-mono uppercase text-white/90">
                                {date.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </div>
                        </div>
                        <div>
                            <label className="text-[12px] font-black opacity-30 block mb-1 tracking-[0.2em] uppercase">OPERADOR</label>
                            <div className="text-base font-black font-mono uppercase text-[#C68346]">
                                @{measurement.user_id?.toUpperCase() || 'SYS_ENGINE'}
                            </div>
                        </div>
                        <div>
                            <label className="text-[12px] font-black opacity-30 block mb-1 tracking-[0.2em] uppercase">MÉTODO</label>
                            <div className="text-sm font-black font-mono uppercase opacity-50">
                                [{measurement.method}]
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
