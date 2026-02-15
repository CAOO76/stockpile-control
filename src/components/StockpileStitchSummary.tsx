import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { StockpileAsset, StockpileMeasurement } from '../types/StockpileAsset';

interface StockpileStitchSummaryProps {
    asset: StockpileAsset;
    history: StockpileMeasurement[];
}

/**
 * StockpileStitchSummary (ENHANCED)
 * Professional technical report with photos, charts, and comprehensive data visualization
 * Optimized for PDF sharing via Capacitor Share API
 */
export const StockpileStitchSummary: React.FC<StockpileStitchSummaryProps> = ({ asset, history }) => {

    // Calculate Deltas
    const lastM = history[0];
    const prevM = history[1];
    const deltaVol = lastM && prevM ? lastM.volumen_m3 - prevM.volumen_m3 : 0;
    const deltaWeight = lastM && prevM ? lastM.peso_t - prevM.peso_t : 0;

    // Calculate additional metrics
    const density = lastM ? (lastM.peso_t / lastM.volumen_m3) : 0;
    const totalMeasurements = history.length;
    const firstDate = history[history.length - 1]?.timestamp;
    const lastDate = history[0]?.timestamp;
    const digitalCount = history.filter(m => m.method === 'digital').length;
    const digitalPercentage = totalMeasurements > 0 ? (digitalCount / totalMeasurements * 100) : 0;

    // Prepare chart data (last 10 measurements, reversed for chronological order)
    const chartData = history.slice(0, 10).reverse().map(m => ({
        fecha: new Date(m.timestamp).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' }),
        volumen: parseFloat(m.volumen_m3.toFixed(1)),
        peso: parseFloat(m.peso_t.toFixed(1))
    }));

    // Photo URL (prefer last_photo_url, fallback to initial)
    const photoUrl = asset.last_photo_url || asset.initial_photo_url;

    return (
        <div
            id="stitch-pdf-summary"
            className="bg-white text-black font-atkinson p-12 w-[210mm] min-h-[297mm] relative flex flex-col"
            style={{ width: '210mm', minHeight: '297mm' }} // A4 Size strict
        >
            {/* Header: Brand & Identity */}
            <header className="border-b-4 border-black pb-6 mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-5xl font-black tracking-tighter uppercase mb-1">MINREPORT</h1>
                    <div className="text-xs font-bold tracking-[0.3em] uppercase opacity-40">Ficha Técnica de Acopio</div>
                </div>
                <div className="text-right">
                    <div className="text-xs font-bold uppercase tracking-wider opacity-60">
                        {new Date().toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </div>
                </div>
            </header>

            {/* Hero Photo Section */}
            {photoUrl && (
                <section className="mb-8 rounded-2xl overflow-hidden border-4 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)]">
                    <img
                        src={photoUrl}
                        alt={`Foto de ${asset.name}`}
                        className="w-full h-48 object-cover"
                        onError={(e) => {
                            // Fallback to placeholder if image fails to load
                            (e.target as HTMLImageElement).style.display = 'none';
                        }}
                    />
                </section>
            )}

            {/* Main Asset Identity */}
            <section className="bg-zinc-50 border-2 border-black rounded-2xl p-6 mb-8">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 block mb-2">IDENTIDAD DEL ACTIVO</span>
                        <h2 className="text-4xl font-black tracking-tight uppercase leading-none">{asset.name}</h2>
                    </div>
                    <div className="text-right">
                        <span className="bg-black text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                            {asset.clase.replace('_', ' ')}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div className="border-l-4 border-black pl-4">
                        <span className="text-[9px] font-black uppercase opacity-40 block mb-1">VOLUMEN</span>
                        <div className="text-3xl font-black tracking-tighter">
                            {asset.last_volume_m3?.toFixed(1) || '0.0'}
                            <span className="text-sm ml-1 font-bold opacity-40">m³</span>
                        </div>
                    </div>
                    <div className="border-l-4 border-zinc-300 pl-4">
                        <span className="text-[9px] font-black uppercase opacity-40 block mb-1">TONELAJE</span>
                        <div className="text-3xl font-black tracking-tighter text-zinc-600">
                            {asset.last_weight_t?.toFixed(1) || '0.0'}
                            <span className="text-sm ml-1 font-bold opacity-40">t</span>
                        </div>
                    </div>
                    <div className="border-l-4 border-zinc-300 pl-4">
                        <span className="text-[9px] font-black uppercase opacity-40 block mb-1">DENSIDAD</span>
                        <div className="text-3xl font-black tracking-tighter text-zinc-600">
                            {density.toFixed(2)}
                            <span className="text-sm ml-1 font-bold opacity-40">t/m³</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Enriched Metrics Grid */}
            <section className="grid grid-cols-4 gap-4 mb-8">
                <div className="p-4 border border-zinc-200 rounded-xl">
                    <span className="text-[8px] font-black uppercase tracking-wider opacity-40 block mb-2">VARIACIÓN</span>
                    <div className={`text-2xl font-black flex items-center gap-1 ${deltaVol >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        <span className="material-symbols-outlined text-xl font-black">
                            {deltaVol >= 0 ? 'trending_up' : 'trending_down'}
                        </span>
                        {deltaVol > 0 ? '+' : ''}{deltaVol.toFixed(1)}
                    </div>
                </div>
                <div className="p-4 border border-zinc-200 rounded-xl">
                    <span className="text-[8px] font-black uppercase tracking-wider opacity-40 block mb-2">MEDICIONES</span>
                    <div className="text-2xl font-black">{totalMeasurements}</div>
                </div>
                <div className="p-4 border border-zinc-200 rounded-xl">
                    <span className="text-[8px] font-black uppercase tracking-wider opacity-40 block mb-2">DIGITAL</span>
                    <div className="text-2xl font-black">{digitalPercentage.toFixed(0)}%</div>
                </div>
                <div className="p-4 border border-zinc-200 rounded-xl">
                    <span className="text-[8px] font-black uppercase tracking-wider opacity-40 block mb-2">ÚLTIMA ACT.</span>
                    <div className="text-xs font-bold">
                        {lastDate ? new Date(lastDate).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' }) : 'N/A'}
                    </div>
                </div>
            </section>

            {/* Volume Trend Chart */}
            <section className="mb-8 border-2 border-zinc-200 rounded-2xl p-6">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-4 opacity-60">TENDENCIA DE VOLUMEN (Últimas 10 Mediciones)</h3>
                <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                        <XAxis
                            dataKey="fecha"
                            tick={{ fontSize: 10, fontWeight: 'bold' }}
                            stroke="#999"
                        />
                        <YAxis
                            tick={{ fontSize: 10, fontWeight: 'bold' }}
                            stroke="#999"
                            label={{ value: 'm³', angle: -90, position: 'insideLeft', fontSize: 10, fontWeight: 'bold' }}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#000',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '12px',
                                fontWeight: 'bold'
                            }}
                        />
                        <Line
                            type="monotone"
                            dataKey="volumen"
                            stroke="#FFB000"
                            strokeWidth={3}
                            dot={{ fill: '#FFB000', r: 4 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </section>

            {/* Historical Data Table (Enhanced with Variations) */}
            <section className="flex-1">
                <div className="flex items-center gap-4 mb-4">
                    <div className="h-px bg-black flex-1"></div>
                    <h3 className="text-xs font-black uppercase tracking-[0.3em]">HISTORIAL TÉCNICO DETALLADO</h3>
                    <div className="h-px bg-black flex-1"></div>
                </div>

                <div className="w-full">
                    <div className="grid grid-cols-5 pb-2 border-b-2 border-black mb-2">
                        <div className="text-[9px] font-black uppercase tracking-wider opacity-40">FECHA</div>
                        <div className="text-[9px] font-black uppercase tracking-wider opacity-40 text-right">VOLUMEN (m³)</div>
                        <div className="text-[9px] font-black uppercase tracking-wider opacity-40 text-right">PESO (t)</div>
                        <div className="text-[9px] font-black uppercase tracking-wider opacity-40 text-right">VARIACIÓN</div>
                        <div className="text-[9px] font-black uppercase tracking-wider opacity-40 text-right">MÉTODO</div>
                    </div>
                    <div className="space-y-0">
                        {history.slice(0, 15).map((m, i) => {
                            const prevMeasurement = history[i + 1];
                            const variation = prevMeasurement ? (m.volumen_m3 - prevMeasurement.volumen_m3) : null;

                            return (
                                <div key={m.id} className={`grid grid-cols-5 py-2 items-center ${i % 2 === 0 ? 'bg-zinc-50' : 'bg-white'}`}>
                                    <div className="text-xs font-bold">
                                        {new Date(m.timestamp).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: '2-digit' })}
                                    </div>
                                    <div className="text-sm font-black text-right">{m.volumen_m3.toFixed(1)}</div>
                                    <div className="text-sm font-bold text-zinc-500 text-right">{m.peso_t.toFixed(1)}</div>
                                    <div className="text-sm font-black text-right">
                                        {variation !== null ? (
                                            <span className={variation >= 0 ? 'text-green-600' : 'text-red-600'}>
                                                {variation > 0 ? '+' : ''}{variation.toFixed(1)}
                                            </span>
                                        ) : (
                                            <span className="text-zinc-300">—</span>
                                        )}
                                    </div>
                                    <div className="text-[10px] font-black uppercase tracking-wider text-right flex justify-end">
                                        <span className={`px-2 py-0.5 rounded border ${m.method === 'digital' ? 'border-black text-black' : 'border-zinc-300 text-zinc-500'}`}>
                                            {m.method}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Footer / Signature */}
            <footer className="mt-auto pt-6 border-t border-zinc-200 flex justify-between items-center opacity-60">
                <div className="text-[9px] font-mono">
                    ID: {asset.id.split('_')[1] || 'Unknown'} <br />
                    GENERADO: {new Date().toISOString().split('T')[0]} {new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="text-right">
                    <div className="h-6 w-24 bg-zinc-100 mb-1"></div>
                    <span className="text-[9px] font-bold uppercase tracking-widest">FIRMA DIGITAL</span>
                </div>
            </footer>
        </div>
    );
};
