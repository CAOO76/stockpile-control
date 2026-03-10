import React, { useState, useEffect } from 'react';
import type { StockpileMeasurement } from '../types/StockpileAsset';
import { dataService } from '../services/DataService';

interface MeasurementDetailProps {
    measurement?: StockpileMeasurement;
    measurementId?: string;
    onClose?: () => void;
    onBack?: () => void;
}

/**
 * MeasurementDetail - DOSSIER TÉCNICO DE TRAZABILIDAD
 * Estándar: Elite Industrial Minimalism (Blueprint Mode)
 * Soporta carga directa via objeto (Desktop) o diferida via ID (Mobile).
 */
export const MeasurementDetail: React.FC<MeasurementDetailProps> = ({ measurement: initialMeasurement, measurementId, onClose, onBack }) => {
    const [measurement, setMeasurement] = useState<StockpileMeasurement | null>(initialMeasurement || null);
    const [loading, setLoading] = useState(!initialMeasurement && !!measurementId);
    
    const apiKey = (import.meta as any).env.VITE_GOOGLE_MAPS_API_KEY;
    const handleClose = onClose || onBack;

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
                    <span className="text-[10px] font-black opacity-20 uppercase tracking-widest mr-2">ID_REGISTRO</span>
                    <span className="text-xs font-mono font-bold text-[#C68346] tracking-tighter">
                        {measurement.id.toUpperCase()}
                    </span>
                </div>
                <button 
                    onClick={handleClose}
                    className="h-14 w-14 border-l border-white/10 flex items-center justify-center hover:bg-white/5 transition-colors group"
                >
                    <span className="material-symbols-outlined text-xl opacity-20 group-hover:opacity-100">close</span>
                </button>
            </div>

            <div className="flex-1 flex flex-col">
                
                {/* SECTION A: VISUAL EVIDENCE (STACKED) */}
                <div className="border-b border-white/10 flex flex-col bg-zinc-950">
                    <div className="aspect-video border-b border-white/5 relative p-4">
                        <div className="w-full h-full border border-white/5 overflow-hidden">
                            <img 
                                src={measurement.photo_url} 
                                className="w-full h-full object-cover grayscale brightness-75 hover:grayscale-0 hover:brightness-100 transition-all duration-300" 
                                alt=""
                            />
                        </div>
                    </div>
                    <div className="aspect-video relative p-4 bg-black">
                        <div className="w-full h-full border border-white/5 overflow-hidden">
                            {apiKey && measurement.location_metadata ? (
                                <img 
                                    src={`https://maps.googleapis.com/maps/api/staticmap?center=${measurement.location_metadata.lat},${measurement.location_metadata.lng}&zoom=18&size=800x400&maptype=satellite&scale=2&markers=color:0xC68346%7C${measurement.location_metadata.lat},${measurement.location_metadata.lng}&key=${apiKey}`}
                                    className="w-full h-full object-cover opacity-60 grayscale"
                                    alt=""
                                />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900/50">
                                    <span className="text-[8px] font-mono opacity-20">GPS_DATA_UNAVAILABLE</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* SECTION B: ANALYTICAL DATA */}
                <div className="flex flex-col bg-black">
                    
                    {/* VOLUMETRY BLOCK */}
                    <div className="p-8 border-b border-white/10 bg-gradient-to-br from-white/[0.02] to-transparent">
                        <div className="space-y-6">
                            <div>
                                <label className="text-[9px] font-black text-[#C68346]/40 block mb-1 tracking-widest uppercase">VOLUMEN_M3</label>
                                <div className="text-5xl font-black font-mono tracking-tighter text-white">
                                    {measurement.volumen_m3.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs opacity-20">m³</span>
                                </div>
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-[#C68346]/40 block mb-1 tracking-widest uppercase">PESO_TON</label>
                                <div className="text-5xl font-black font-mono tracking-tighter text-white">
                                    {measurement.peso_t.toLocaleString('es-CL', { maximumFractionDigits: 0 })} <span className="text-xs opacity-20">t</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* METADATA BLOCK */}
                    <div className="p-8 grid grid-cols-2 gap-x-6 gap-y-8">
                        <div>
                            <label className="text-[9px] font-bold opacity-20 block mb-1 tracking-widest uppercase">FECHA</label>
                            <div className="text-[11px] font-black font-mono uppercase">
                                {date.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                            </div>
                        </div>
                        <div>
                            <label className="text-[9px] font-bold opacity-20 block mb-1 tracking-widest uppercase">HORA</label>
                            <div className="text-[11px] font-black font-mono uppercase">
                                {date.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </div>
                        </div>
                        <div>
                            <label className="text-[9px] font-bold opacity-20 block mb-1 tracking-widest uppercase">OPERADOR</label>
                            <div className="text-[11px] font-black font-mono uppercase text-[#C68346]">
                                @{measurement.user_id?.toUpperCase() || 'SYS_ENGINE'}
                            </div>
                        </div>
                        <div>
                            <label className="text-[9px] font-bold opacity-20 block mb-1 tracking-widest uppercase">MÉTODO</label>
                            <div className="text-[11px] font-black font-mono uppercase opacity-40">
                                [{measurement.method}]
                            </div>
                        </div>

                        <div className="col-span-2 pt-4">
                            <div className="bg-zinc-950 border border-white/10 p-4 font-mono text-[10px] space-y-2">
                                <div className="flex justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-[7px] opacity-20 uppercase mb-0.5">LAT</span>
                                        <span className="font-bold">{measurement.location_metadata?.lat || '0.000000'}</span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-[7px] opacity-20 uppercase mb-0.5">LNG</span>
                                        <span className="font-bold">{measurement.location_metadata?.lng || '0.000000'}</span>
                                    </div>
                                </div>
                                <div className="flex justify-center text-[#C68346] pt-1.5 border-t border-white/5">
                                    <span className="text-[7px] opacity-20 uppercase mr-2 tracking-widest">PRECISIÓN_GPS</span>
                                    <span className="font-bold text-[9px]">{measurement.location_metadata?.accuracy.toFixed(2)}M</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
