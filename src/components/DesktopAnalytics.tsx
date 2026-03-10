import React, { useState, useEffect, useMemo } from 'react';
import { dataService } from '../services/DataService';
import type { StockpileAsset, StockpileMeasurement } from '../types/StockpileAsset';
import { StockpileSummary } from './StockpileSummary';
import { downloadPDF } from '../utils/pdfHelper';
import { MeasurementDetail } from './MeasurementDetail';
import { 
    ResponsiveContainer, 
    AreaChart, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    Area,
    ReferenceDot
} from 'recharts';

/**
 * DesktopAnalytics v3.0.0 - STOCKPILE CONTROL CENTER
 * Reemplaza la funcionalidad decorativa por un dashboard técnico de ingeniería de minas.
 */
export const DesktopAnalytics: React.FC = () => {
    const [assets, setAssets] = useState<StockpileAsset[]>([]);
    const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
    const [selectedMeasurement, setSelectedMeasurement] = useState<StockpileMeasurement | null>(null);
    const [measurements, setMeasurements] = useState<Record<string, StockpileMeasurement[]>>({});
    const [generatingPdf, setGeneratingPdf] = useState(false);

    // Suscripción reactiva a todos los activos en tiempo real
    useEffect(() => {
        let mounted = true;
        const unsubscribeAssets = dataService.subscribeToAllAssets((data: StockpileAsset[]) => {
            if (mounted) setAssets(data);
        });

        // Suscripción a mediciones para historial y KPIs globales
        const unsubscribeMeasurements = dataService.subscribeToMeasurementsAll((data: StockpileMeasurement[]) => {
            if (mounted) {
                // Agrupar mediciones por assetId
                const grouped = data.reduce((acc, m) => {
                    if (!acc[m.assetId]) acc[m.assetId] = [];
                    acc[m.assetId].push(m);
                    return acc;
                }, {} as Record<string, StockpileMeasurement[]>);
                
                // Ordenar por timestamp descendente
                Object.keys(grouped).forEach(id => {
                    grouped[id].sort((a, b) => b.timestamp - a.timestamp);
                });
                
                setMeasurements(grouped);
            }
        });

        return () => {
            mounted = false;
            unsubscribeAssets();
            unsubscribeMeasurements();
        };
    }, []);

    // KPIs Globales (Agregados Reales)
    const stats = useMemo(() => {
        try {
            const totalVolume = assets.reduce((acc, a) => acc + (a?.last_volume_m3 || 0), 0);
            const totalWeight = assets.reduce((acc, a) => acc + (a?.last_weight_t || 0), 0);
            const avgDensity = totalVolume > 0 ? totalWeight / totalVolume : 0;
            const mineralCount = assets.filter(a => a?.clase === 'mineral').length;
            const wasteCount = assets.filter(a => a?.clase === 'esteril').length;
            return { totalVolume, totalWeight, avgDensity, mineralCount, wasteCount };
        } catch (e) {
            console.error('[DesktopAnalytics] Error parseando KPIs:', e);
            return { totalVolume: 0, totalWeight: 0, avgDensity: 0, mineralCount: 0, wasteCount: 0 };
        }
    }, [assets]);

    // Selección automática del último acopio registrado al cargar
    useEffect(() => {
        if (assets.length > 0 && !selectedAssetId) {
            // Asumimos que el primero es el más reciente o el principal
            setSelectedAssetId(assets[0].id!);
        }
    }, [assets, selectedAssetId]);

    const selectedAsset = useMemo(() => 
        assets.find(a => a.id === selectedAssetId) || null
    , [assets, selectedAssetId]);

    const selectedHistory = useMemo(() => 
        selectedAssetId ? (measurements[selectedAssetId] || []) : []
    , [measurements, selectedAssetId]);

    const chartData = useMemo(() => {
        return [...selectedHistory].reverse().map(m => ({
            timestamp: m.timestamp,
            date: new Date(m.timestamp).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' }),
            volumen: m.volumen_m3,
            peso: m.peso_t,
            id: m.id
        }));
    }, [selectedHistory]);

    const selectedPoint = useMemo(() => {
        if (!selectedMeasurement) return null;
        return chartData.find(p => p.id === selectedMeasurement.id) || null;
    }, [chartData, selectedMeasurement]);

    const handleDownloadPDF = async () => {
        if (!selectedAsset) return;
        setGeneratingPdf(true);
        try {
            await downloadPDF('stockpile-report', `Reporte_${selectedAsset.name}`);
        } catch (error) {
            console.error('PDF Error:', error);
        } finally {
            setGeneratingPdf(false);
        }
    };

    const currentMeasurement = selectedMeasurement || (selectedAssetId ? (measurements[selectedAssetId] || [])[0] : null);

    return (
        <div className="h-screen bg-[#0a0a0a] text-white font-atkinson flex flex-col antialiased overflow-hidden select-none">
            
            {/* PLUGIN HEADER */}
            <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-black/40 backdrop-blur-md z-20">
                <div className="flex items-center gap-4">
                <div className="flex items-center gap-4">
                    <div>
                        <h1 className="text-sm font-black uppercase tracking-[0.3em] leading-none">STOCKPILE CONTROL CENTER</h1>
                    </div>
                </div>
                </div>
                
                <div className="flex gap-8">
                </div>
            </header>

            {/* MAIN LAYOUT */}
            <main className="flex-1 flex flex-col overflow-hidden">
                
                {/* TOP HUD: GLOBAL KPIs - COMPACT VERSION */}
                <section className="h-20 border-b border-white/5 bg-white/[0.02] flex items-center px-4 overflow-hidden">
                    <div className="flex items-center h-full px-10 border-r border-white/5 group">
                        <span className="text-[12px] font-black opacity-30 uppercase tracking-[0.3em] mr-8">ACTIVOS</span>
                        <div className="text-4xl font-black font-mono text-white tracking-tighter">{assets.length}</div>
                    </div>
                    <div className="flex items-center h-full px-10 border-r border-white/5 group">
                        <span className="text-[12px] font-black opacity-30 uppercase tracking-[0.3em] mr-8">VOLUMEN_TOTAL</span>
                        <div className="text-4xl font-black font-mono text-[#C68346] tracking-tighter">
                            {stats.totalVolume.toLocaleString('es-CL', { maximumFractionDigits: 1 })} <span className="text-sm opacity-20 text-white font-sans">m³</span>
                        </div>
                    </div>
                    <div className="flex items-center h-full px-10 border-r border-white/5 group">
                        <span className="text-[12px] font-black opacity-30 uppercase tracking-[0.3em] mr-8">PESO_TOTAL</span>
                        <div className="text-4xl font-black font-mono text-[#C68346] tracking-tighter">
                            {stats.totalWeight.toLocaleString('es-CL', { maximumFractionDigits: 0 })} <span className="text-sm opacity-20 text-white font-sans">t</span>
                        </div>
                    </div>
                    <div className="flex-1 flex items-center justify-end px-6 gap-4">
                         <div className="w-32 h-1 bg-white/5 overflow-hidden">
                            <div className="h-full bg-[#C68346]" style={{ width: `${(stats.mineralCount / (assets.length || 1)) * 100}%` }}></div>
                        </div>
                        <div className="w-32 h-1 bg-white/5 overflow-hidden">
                            <div className="h-full bg-white/20" style={{ width: `${(stats.wasteCount / (assets.length || 1)) * 100}%` }}></div>
                        </div>
                    </div>
                </section>
                <div className="flex-1 flex overflow-hidden">
                    
                    {/* PILLAR 1: ASSET MASTER LIST (MASTER) - w-96 */}
                    <section className="w-96 border-r border-white/10 flex flex-col bg-black z-10">
                        <div className="flex-1 overflow-y-auto scrollbar-none">
                            {assets.map(asset => {
                                const isSelected = selectedAssetId === asset.id;
                                const assetMeas = measurements[asset.id!] || [];
                                const lastMeas = assetMeas[0];
                                const firstMeas = assetMeas[assetMeas.length - 1];

                                const daysSince = lastMeas ? Math.floor((Date.now() - lastMeas.timestamp) / (1000 * 60 * 60 * 24)) : 99;
                                const isStale = daysSince > 7;

                                return (
                                    <div 
                                        key={asset.id} 
                                        onClick={() => {
                                            setSelectedAssetId(asset.id!);
                                            const assetMeas = measurements[asset.id!] || [];
                                            setSelectedMeasurement(assetMeas[0] || null);
                                        }}
                                        className={`p-6 border-b border-white/[0.05] cursor-pointer transition-all hover:bg-white/[0.03] flex flex-col gap-4 relative ${isSelected ? 'bg-[#C68346]/10' : ''}`}
                                    >
                                        {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C68346]"></div>}
                                        <div className="flex justify-between items-start">
                                            <div className="font-black uppercase tracking-tight text-base text-white">{asset.name}</div>
                                            <span className={`text-[11px] font-black uppercase px-2.5 py-1 rounded-sm ${asset.clase === 'mineral' ? 'bg-[#C68346] text-black' : 'bg-white/10 text-white/40'}`}>
                                                {asset.clase.toUpperCase()}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-6 bg-white/[0.02] p-3 border border-white/5">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black opacity-30 uppercase tracking-[0.2em] mb-1">INICIO</span>
                                                <span className="text-xs font-mono font-bold opacity-80">
                                                    {firstMeas ? new Date(firstMeas.timestamp).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '---'}
                                                </span>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-[10px] font-black opacity-30 uppercase tracking-[0.2em] mb-1 text-[#C68346]">ÚLTIMO</span>
                                                <span className="text-xs font-mono font-bold text-white">
                                                    {lastMeas ? new Date(lastMeas.timestamp).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '---'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-end pt-2 border-t border-white/5">
                                            <div className="text-2xl font-black font-mono text-white">
                                                {asset.last_volume_m3?.toFixed(1) || '0.0'} <span className="opacity-20 text-xs font-sans">m³</span>
                                            </div>
                                            <div className={`text-[10px] font-black uppercase tracking-[0.1em] px-2 py-0.5 border ${isStale ? 'text-red-500/60 border-red-500/20' : 'text-green-500/60 border-green-500/20'}`}>
                                                {daysSince === 0 ? 'STATUS: ACTIVO' : `VENCIDO: ${daysSince}D`}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    {/* PILLAR 2: ANALYTICAL WORKSPACE (WORKSPACE) - flex-1 */}
                    <section className="flex-1 bg-[#0a0a0a] flex flex-col overflow-hidden border-r border-white/5">
                        {selectedAsset ? (
                            <div className="flex-1 flex flex-col animate-in fade-in duration-500 overflow-hidden">
                                
                                <div className="p-8 border-b border-white/5 flex justify-between items-center bg-black/20">
                                    <div>
                                        <div className="text-[10px] font-black text-[#C68346] opacity-40 uppercase tracking-[0.4em] mb-1">UNIT_WORKSPACE</div>
                                        <h2 className="text-3xl font-black uppercase tracking-tight leading-none text-white">{selectedAsset.name}</h2>
                                    </div>
                                    <button 
                                        onClick={handleDownloadPDF}
                                        disabled={generatingPdf}
                                        className={`flex items-center justify-center transition-all active:scale-95 disabled:opacity-50 ${generatingPdf ? 'animate-pulse text-[#C68346]' : 'text-white/20 hover:text-[#C68346]'}`}
                                    >
                                        <span className="material-symbols-outlined text-4xl">picture_as_pdf</span>
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-none text-white">
                                    
                                    {/* ANALYTICAL GRAPH SECTION */}
                                    <div className="h-72 w-full bg-black/40 border border-white/5 p-6 relative group">
                                        <div className="absolute top-4 left-6 z-10">
                                            <span className="text-[9px] font-black opacity-20 uppercase tracking-widest">VOLUMETRIC_EVOLUTION_M3</span>
                                        </div>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id="volGradient" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#C68346" stopOpacity={0.3}/>
                                                        <stop offset="95%" stopColor="#C68346" stopOpacity={0}/>
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                                <XAxis 
                                                    dataKey="timestamp" 
                                                    axisLine={false} 
                                                    tickLine={false} 
                                                    tick={{ fontSize: 9, fill: '#ffffff20', fontWeight: 'bold' }}
                                                    tickFormatter={(t) => new Date(t).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })}
                                                />
                                                <YAxis 
                                                    axisLine={false} 
                                                    tickLine={false} 
                                                    tick={{ fontSize: 9, fill: '#ffffff20', fontWeight: 'bold' }} 
                                                />
                                                <Tooltip 
                                                    contentStyle={{ backgroundColor: '#000', border: '1px solid #ffffff10', fontSize: '10px', borderRadius: '0' }}
                                                    itemStyle={{ color: '#C68346', fontWeight: 'black' }}
                                                    labelStyle={{ color: '#ffffff40', marginBottom: '4px' }}
                                                    labelFormatter={(t) => new Date(t).toLocaleString('es-CL', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                />
                                                <Area 
                                                    type="monotone" 
                                                    dataKey="volumen" 
                                                    stroke="#C68346" 
                                                    strokeWidth={2}
                                                    fillOpacity={1} 
                                                    fill="url(#volGradient)" 
                                                    animationDuration={1000}
                                                />
                                                {selectedPoint && (
                                                    <ReferenceDot 
                                                        x={selectedPoint.timestamp} 
                                                        y={selectedPoint.volumen} 
                                                        r={8} 
                                                        fill="#C68346" 
                                                        stroke="#fff" 
                                                        strokeWidth={3} 
                                                        className="drop-shadow-[0_0_8px_rgba(198,131,70,1)]"
                                                    />
                                                )}
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>

                                    {/* UPDATED TOTALS / KPIs */}
                                    <div className="grid grid-cols-3 gap-6">
                                        <div className="bg-white/[0.02] border border-white/5 p-8 group hover:border-[#C68346]/20 transition-all">
                                            <label className="text-[12px] font-black opacity-30 uppercase tracking-[0.3em] block mb-3">TOTAL_VOLUMEN</label>
                                            <div className="text-5xl font-black font-mono text-white tracking-tighter leading-none">
                                                {selectedAsset.last_volume_m3?.toFixed(1) || '0.0'} <span className="text-sm opacity-20 font-sans">m³</span>
                                            </div>
                                        </div>
                                        <div className="bg-white/[0.02] border border-white/5 p-8 group hover:border-[#C68346]/20 transition-all">
                                            <label className="text-[12px] font-black opacity-30 uppercase tracking-[0.3em] block mb-3">TOTAL_PESO</label>
                                            <div className="text-5xl font-black font-mono text-white tracking-tighter leading-none">
                                                {selectedAsset.last_weight_t?.toFixed(0) || '0'} <span className="text-sm opacity-20 font-sans">t</span>
                                            </div>
                                        </div>
                                        <div className="bg-white/[0.02] border border-white/5 p-8 group hover:border-[#C68346]/20 transition-all">
                                            <label className="text-[12px] font-black opacity-30 uppercase tracking-[0.3em] block mb-3 text-[#C68346]">DENSIDAD_CALC</label>
                                            <div className="text-5xl font-black font-mono text-[#C68346] tracking-tighter leading-none">
                                                {(selectedAsset.last_weight_t && selectedAsset.last_volume_m3 ? selectedAsset.last_weight_t / selectedAsset.last_volume_m3 : 0.0).toFixed(2)} <span className="text-sm opacity-20 text-white font-sans">t/m³</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* TECHNICAL EVIDENCE PAIR (BOTTOM) */}
                                    <div className="grid grid-cols-2 gap-6 h-64">
                                        {/* LAST CAPTURE PHOTO */}
                                        <div className="border border-white/10 bg-black relative group overflow-hidden flex flex-col">
                                            <div className="absolute top-3 left-4 z-10 flex items-center gap-2">
                                                <span className="w-1 h-1 rounded-full bg-green-500 animate-pulse"></span>
                                                <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em]">ULTIMA_CAPTURA_FOTO</span>
                                            </div>
                                            {selectedAsset.last_photo_url ? (
                                                <img src={selectedAsset.last_photo_url} className="w-full h-full object-cover grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700" />
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center opacity-5">
                                                    <span className="material-symbols-outlined text-4xl">no_photography</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* GEORREFF MAP */}
                                        <div className="border border-white/10 bg-zinc-950 flex flex-col items-center justify-center relative overflow-hidden group">
                                             <div className="absolute top-3 left-4 z-10 flex items-center gap-2">
                                                <span className="w-1 h-1 rounded-full bg-[#C68346]"></span>
                                                <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em]">MAPA_GEORREFERENCIADO</span>
                                            </div>
                                            {(() => {
                                                const apiKey = (import.meta as any).env.VITE_GOOGLE_MAPS_API_KEY;
                                                const lat = selectedAsset.geo_point?.latitude;
                                                const lng = selectedAsset.geo_point?.longitude;

                                                if (apiKey && lat !== undefined && lng !== undefined) {
                                                    const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=18&size=600x600&maptype=satellite&scale=2&markers=color:0xC68346%7C${lat},${lng}&key=${apiKey}`;
                                                    return (
                                                        <img 
                                                            src={mapUrl} 
                                                            className="w-full h-full object-cover opacity-40 group-hover:opacity-100 transition-opacity duration-700" 
                                                            alt="" 
                                                        />
                                                    );
                                                }
                                                return <div className="opacity-5 font-mono text-[9px]">SAT_LINK_FAILED</div>;
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center opacity-5">
                                <span className="text-[10px] font-black tracking-[1em] uppercase">WAITING_FOR_ASSET_SELECTION</span>
                            </div>
                        )}
                    </section>

                    {/* PILLAR 3: MEASUREMENT HISTORY (TRAZABILIDAD) - w-64 */}
                    <section className="w-64 border-r border-white/10 flex flex-col bg-black overflow-hidden relative">
                        {selectedAsset && (
                            <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in duration-300">
                                <div className="h-10 border-b border-white/5 flex items-center px-4 bg-white/[0.02]">
                                        <span className="text-[10px] font-black opacity-20 uppercase tracking-[0.2em]">HISTORIAL_CRONO</span>
                                </div>
                                <div className="flex-1 overflow-y-auto p-3 space-y-1.5 scrollbar-none">
                                    {selectedHistory.map((m, i) => {
                                        const prev = selectedHistory[i + 1];
                                        const diff = prev ? m.volumen_m3 - prev.volumen_m3 : 0;
                                        const isSelected = selectedMeasurement?.id === m.id;
                                        return (
                                            <div 
                                                key={m.id} 
                                                onClick={() => setSelectedMeasurement(m)}
                                                className={`bg-white/[0.02] border border-white/5 p-4 flex flex-col gap-2 transition-all cursor-pointer active:scale-[0.98] ${isSelected ? 'border-[#C68346]/40 bg-[#C68346]/5' : 'hover:border-white/20'}`}
                                            >
                                                <div className="flex justify-between items-center">
                                                    <div className="text-[12px] font-black uppercase tracking-tight">{new Date(m.timestamp).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })}</div>
                                                    <div className="text-base font-black font-mono leading-none text-[#C68346]">{m.volumen_m3.toFixed(1)} <span className="text-[10px] opacity-20 text-white font-sans">m³</span></div>
                                                </div>
                                                {diff !== 0 && (
                                                    <div className={`text-[11px] font-black text-right ${diff > 0 ? 'text-green-500/50' : 'text-red-500/50'}`}>
                                                        {diff > 0 ? '▲' : '▼'} {Math.abs(diff).toFixed(1)}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </section>

                    {/* PILLAR 4: MEASUREMENT DETAIL (DOSSIER PERSISTENTE) - w-[400px] */}
                    <section className="w-[400px] flex flex-col bg-[#050505] overflow-hidden relative border-l border-white/5">
                        {currentMeasurement ? (
                            <div className="flex-1 overflow-hidden animate-in fade-in duration-300">
                                <MeasurementDetail 
                                    measurement={currentMeasurement} 
                                />
                            </div>
                        ) : (
                            <div className="flex-1 flex items-center justify-center opacity-5 grayscale">
                                <span className="material-symbols-outlined text-6xl">inventory_2</span>
                            </div>
                        )}
                    </section>

                    {/* Hidden PDF component for background capture */}
                    <div className="fixed top-[5000px] left-0 pointer-events-none opacity-0">
                        {selectedAsset && (
                            <StockpileSummary asset={selectedAsset} history={selectedHistory} />
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};
