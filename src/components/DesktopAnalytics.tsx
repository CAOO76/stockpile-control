import React, { useState, useEffect, useMemo } from 'react';
import { dataService } from '../services/DataService';
import { useTheme } from '../hooks/useTheme';
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
    
    // Estado para flujo de eliminación
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');

    const { theme } = useTheme();

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

    const handleConfirmDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (deleteConfirmText.trim().toUpperCase() === 'ELIMINAR') {
            await dataService.deleteAsset(id);
            setDeletingId(null);
            setDeleteConfirmText('');
            if (selectedAssetId === id) {
                setSelectedAssetId(null);
                setSelectedMeasurement(null);
            }
        }
    };

    return (
        <div className="h-screen bg-antigravity-light-bg dark:bg-antigravity-dark-bg text-antigravity-light-text dark:text-antigravity-dark-text font-atkinson flex flex-col antialiased overflow-hidden select-none transition-colors duration-200">
            
            {/* PLUGIN HEADER */}
            <header className="h-16 border-b border-antigravity-light-border dark:border-antigravity-dark-border flex items-center justify-between px-8 bg-antigravity-light-surface/40 dark:bg-antigravity-dark-surface/40 backdrop-blur-md z-20">
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
                <section className="h-20 border-b border-antigravity-light-border dark:border-antigravity-dark-border bg-antigravity-light-surface/20 dark:bg-antigravity-dark-surface/20 flex items-center px-4 overflow-hidden">
                    <div className="flex items-center h-full px-10 border-r border-antigravity-light-border dark:border-antigravity-dark-border group">
                        <span className="text-[12px] font-black opacity-30 uppercase tracking-[0.3em] mr-8">ACTIVOS</span>
                        <div className="text-4xl font-black font-mono text-antigravity-light-text dark:text-antigravity-dark-text tracking-tighter">{assets.length}</div>
                    </div>
                    <div className="flex items-center h-full px-10 border-r border-antigravity-light-border dark:border-antigravity-dark-border group">
                        <span className="text-[12px] font-black opacity-30 uppercase tracking-[0.3em] mr-8">VOLUMEN_TOTAL</span>
                        <div className="text-4xl font-black font-mono text-antigravity-accent tracking-tighter">
                            {stats.totalVolume.toLocaleString('es-CL', { maximumFractionDigits: 1 })} <span className="text-sm text-antigravity-light-text/60 dark:text-antigravity-dark-text/40 font-sans ml-1">m³</span>
                        </div>
                    </div>
                    <div className="flex items-center h-full px-10 border-r border-antigravity-light-border dark:border-antigravity-dark-border group">
                        <span className="text-[12px] font-black opacity-30 uppercase tracking-[0.3em] mr-8">PESO_TOTAL</span>
                        <div className="text-4xl font-black font-mono text-antigravity-accent tracking-tighter">
                            {stats.totalWeight.toLocaleString('es-CL', { maximumFractionDigits: 0 })} <span className="text-sm text-antigravity-light-text/60 dark:text-antigravity-dark-text/40 font-sans ml-1">t</span>
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
                    
                    {/* PILLAR 1: ASSET MASTER LIST (MASTER) - w-fit min-w */}
                    <section className="w-fit min-w-[280px] max-w-[400px] border-r border-antigravity-light-border dark:border-antigravity-dark-border flex flex-col bg-antigravity-light-bg dark:bg-antigravity-dark-bg z-10 transition-colors">
                        <div className="flex-1 overflow-y-auto scrollbar-none">
                            {assets.map(asset => {
                                const isSelected = selectedAssetId === asset.id;
                                const assetMeas = measurements[asset.id!] || [];
                                const lastMeas = assetMeas[0];

                                const daysSince = lastMeas ? Math.floor((Date.now() - lastMeas.timestamp) / (1000 * 60 * 60 * 24)) : 99;
                                const isStale = daysSince > 7;
                                const isDeleting = deletingId === asset.id;

                                if (isDeleting) {
                                    return (
                                        <div key={asset.id} className="w-full bg-red-50 dark:bg-red-950/20 border-b border-red-200 dark:border-red-900/40 p-4 flex flex-col gap-3 relative">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-red-600 dark:text-red-500">Para eliminar "{asset.name}", escriba ELIMINAR</p>
                                            <input
                                                type="text"
                                                value={deleteConfirmText}
                                                onChange={e => setDeleteConfirmText(e.target.value)}
                                                placeholder="ELIMINAR"
                                                className="w-full bg-white dark:bg-black/40 border border-red-300 dark:border-red-900/50 h-8 px-3 text-xs text-red-900 dark:text-red-100 font-bold uppercase outline-none focus:border-red-500 transition-colors shadow-inner"
                                                autoFocus
                                            />
                                            <div className="flex gap-2 justify-end mt-1">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); setDeletingId(null); setDeleteConfirmText(''); }}
                                                    className="h-7 px-3 text-[9px] font-black bg-black/5 dark:bg-white/10 text-antigravity-light-text/60 dark:text-white/60 hover:bg-black/10 dark:hover:bg-white/20 transition-colors uppercase cursor-pointer"
                                                >
                                                    Cancelar
                                                </button>
                                                <button
                                                    onClick={(e) => handleConfirmDelete(e, asset.id!)}
                                                    disabled={deleteConfirmText.trim().toUpperCase() !== 'ELIMINAR'}
                                                    className="h-7 px-3 text-[9px] font-black bg-red-600 text-white hover:bg-red-500 disabled:opacity-30 disabled:hover:bg-red-600 transition-colors uppercase tracking-wider cursor-pointer"
                                                >
                                                    Confirmar
                                                </button>
                                            </div>
                                        </div>
                                    );
                                }

                                return (
                                    <div 
                                        key={asset.id} 
                                        onClick={() => {
                                            setSelectedAssetId(asset.id!);
                                            const assetMeas = measurements[asset.id!] || [];
                                            setSelectedMeasurement(assetMeas[0] || null);
                                        }}
                                        className={`p-3.5 border-b border-antigravity-light-border dark:border-antigravity-dark-border cursor-pointer transition-all hover:bg-antigravity-accent/5 flex flex-col gap-2 relative group ${isSelected ? 'bg-antigravity-accent/10 border-l-[3px] border-l-antigravity-accent pl-[11px]' : ''}`}
                                    >
                                        <div className="flex justify-between items-center pr-8">
                                            <div className="font-black uppercase tracking-tight text-xs text-antigravity-light-text dark:text-antigravity-dark-text truncate pr-2">{asset.name}</div>
                                            <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 whitespace-nowrap border ${asset.clase === 'mineral' ? 'bg-[#C68346] text-black border-transparent' : 'bg-antigravity-light-surface/50 dark:bg-white/10 text-antigravity-light-text/60 dark:text-white/40 border-antigravity-light-border dark:border-transparent'}`}>
                                                {asset.clase.substring(0, 3)}
                                            </span>
                                        </div>

                                        <div className="flex justify-between items-end">
                                            <div className="flex gap-5">
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-black opacity-40 uppercase tracking-[0.2em] mb-0.5">VOL</span>
                                                    <span className="text-sm font-black font-mono text-antigravity-light-text dark:text-antigravity-dark-text leading-none mt-0.5">
                                                        {asset.last_volume_m3?.toFixed(0) || '0'} <span className="text-antigravity-light-text/60 dark:text-antigravity-dark-text/30 text-[9px] font-sans">m³</span>
                                                    </span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-black opacity-40 uppercase tracking-[0.2em] mb-0.5">{lastMeas ? new Date(lastMeas.timestamp).toLocaleDateString('es-CL', { month: 'short', day: '2-digit' }) : '---'}</span>
                                                    <span className={`text-[9px] font-black uppercase tracking-[0.1em] mt-0.5 px-1.5 py-0.5 border shadow-sm ${isStale ? 'text-red-600 border-red-200 bg-red-50 dark:text-red-400 dark:border-red-900/30 dark:bg-red-950/20' : 'text-green-600 border-green-200 bg-green-50 dark:text-green-400 dark:border-green-900/30 dark:bg-green-950/20'}`}>
                                                        {daysSince === 0 ? 'ACTIVO' : `${daysSince}D`}
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            {/* Botón Eliminar Desktop */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setDeletingId(asset.id!);
                                                    setDeleteConfirmText('');
                                                }}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-500/20 text-red-500/50 hover:text-red-600 transition-all border border-transparent hover:border-red-200 dark:hover:border-red-500/30 rounded-sm"
                                                title="Eliminar activo"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">delete</span>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    {/* PILLAR 2: ANALYTICAL WORKSPACE (WORKSPACE) - flex-1 */}
                    <section className="flex-1 bg-antigravity-light-bg dark:bg-antigravity-dark-bg flex flex-col overflow-hidden border-r border-antigravity-light-border dark:border-antigravity-dark-border transition-colors">
                        {selectedAsset ? (
                            <div className="flex-1 flex flex-col animate-in fade-in duration-500 overflow-hidden">
                                
                                <div className="p-8 border-b border-antigravity-light-border dark:border-antigravity-dark-border flex justify-between items-center bg-antigravity-light-surface/20 dark:bg-antigravity-dark-surface/20">
                                    <div>
                                        <div className="text-[10px] font-black text-antigravity-accent opacity-40 uppercase tracking-[0.4em] mb-1">UNIT_WORKSPACE</div>
                                        <h2 className="text-3xl font-black uppercase tracking-tight leading-none text-antigravity-light-text dark:text-antigravity-dark-text">{selectedAsset.name}</h2>
                                    </div>
                                    <button 
                                        onClick={handleDownloadPDF}
                                        disabled={generatingPdf}
                                        className={`flex items-center justify-center transition-all active:scale-95 disabled:opacity-50 ${generatingPdf ? 'animate-pulse text-antigravity-accent' : 'text-antigravity-light-text/20 dark:text-antigravity-dark-text/20 hover:text-antigravity-accent'}`}
                                    >
                                        <span className="material-symbols-outlined text-4xl">picture_as_pdf</span>
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-none text-antigravity-light-text dark:text-antigravity-dark-text">
                                    
                                    {/* ANALYTICAL GRAPH SECTION */}
                                    <div className="h-72 w-full bg-antigravity-light-surface/40 dark:bg-antigravity-dark-surface/40 border border-antigravity-light-border dark:border-antigravity-dark-border p-6 relative group transition-colors">
                                        <div className="absolute top-4 left-6 z-10">
                                            <span className="text-[9px] font-black text-antigravity-light-text/30 dark:text-antigravity-dark-text/30 uppercase tracking-widest">VOLUMETRIC_EVOLUTION_M3</span>
                                        </div>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id="volGradient" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#C68346" stopOpacity={0.3}/>
                                                        <stop offset="95%" stopColor="#C68346" stopOpacity={0}/>
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                                                <XAxis 
                                                    dataKey="timestamp" 
                                                    axisLine={false} 
                                                    tickLine={false} 
                                                    tick={{ fontSize: 9, fill: 'var(--chart-tick)', fontWeight: 'bold' }}
                                                    tickFormatter={(t) => new Date(t).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })}
                                                />
                                                <YAxis 
                                                    axisLine={false} 
                                                    tickLine={false} 
                                                    tick={{ fontSize: 9, fill: 'var(--chart-tick)', fontWeight: 'bold' }} 
                                                />
                                                <Tooltip 
                                                    contentStyle={{ 
                                                        backgroundColor: theme === 'dark' ? '#000' : '#fff', 
                                                        border: '1px solid var(--antigravity-light-border)', 
                                                        fontSize: '10px', 
                                                        borderRadius: '0',
                                                        color: 'var(--chart-text)'
                                                    }}
                                                    itemStyle={{ color: '#C68346', fontWeight: 'black' }}
                                                    labelStyle={{ color: 'var(--chart-tick)', marginBottom: '4px' }}
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
                                                        stroke={theme === 'dark' ? '#fff' : '#000'} 
                                                        strokeWidth={3} 
                                                        className="drop-shadow-[0_0_8px_rgba(198,131,70,1)]"
                                                    />
                                                )}
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>

                                    {/* UPDATED TOTALS / KPIs */}
                                    <div className="grid grid-cols-3 gap-6">
                                        <div className="bg-antigravity-light-surface dark:bg-antigravity-dark-surface border border-antigravity-light-border dark:border-antigravity-dark-border p-8 group hover:border-antigravity-accent/20 transition-all">
                                            <label className="text-[12px] font-black opacity-30 uppercase tracking-[0.3em] block mb-3">TOTAL_VOLUMEN</label>
                                            <div className="text-5xl font-black font-mono text-antigravity-light-text dark:text-antigravity-dark-text tracking-tighter leading-none">
                                                {selectedAsset.last_volume_m3?.toFixed(1) || '0.0'} <span className="text-sm text-antigravity-light-text/40 dark:text-antigravity-dark-text/20 font-sans ml-1">m³</span>
                                            </div>
                                        </div>
                                        <div className="bg-antigravity-light-surface dark:bg-antigravity-dark-surface border border-antigravity-light-border dark:border-antigravity-dark-border p-8 group hover:border-antigravity-accent/20 transition-all">
                                            <label className="text-[12px] font-black opacity-30 uppercase tracking-[0.3em] block mb-3">TOTAL_PESO</label>
                                            <div className="text-5xl font-black font-mono text-antigravity-light-text dark:text-antigravity-dark-text tracking-tighter leading-none">
                                                {selectedAsset.last_weight_t?.toFixed(0) || '0'} <span className="text-sm text-antigravity-light-text/40 dark:text-antigravity-dark-text/20 font-sans ml-1">t</span>
                                            </div>
                                        </div>
                                        <div className="bg-antigravity-light-surface dark:bg-antigravity-dark-surface border border-antigravity-light-border dark:border-antigravity-dark-border p-8 group hover:border-antigravity-accent/20 transition-all">
                                            <label className="text-[12px] font-black opacity-30 uppercase tracking-[0.3em] block mb-3 text-antigravity-accent">DENSIDAD_CALC</label>
                                            <div className="text-5xl font-black font-mono text-antigravity-accent tracking-tighter leading-none">
                                                {(selectedAsset.last_weight_t && selectedAsset.last_volume_m3 ? selectedAsset.last_weight_t / selectedAsset.last_volume_m3 : 0.0).toFixed(2)} <span className="text-sm text-antigravity-accent/50 dark:text-antigravity-dark-text/20 font-sans ml-1">t/m³</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* GPS TRACEABILITY STRIP (ESTANDARIZADO - GRID) */}
                                    <div className="bg-antigravity-light-surface/20 dark:bg-antigravity-dark-surface/20 border border-antigravity-light-border dark:border-antigravity-dark-border px-8 py-5 mb-6 grid grid-cols-3 gap-8">
                                        <div className="flex flex-col">
                                            <span className="text-[12px] font-black opacity-30 uppercase tracking-[0.3em] leading-none mb-2 text-antigravity-accent">LATITUD</span>
                                            <span className="text-[18px] font-bold font-mono text-antigravity-light-text/90 dark:text-antigravity-dark-text/90 tabular-nums">
                                                {selectedAsset.geo_point?.latitude.toFixed(6) || '0.000000'}
                                            </span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[12px] font-black opacity-30 uppercase tracking-[0.3em] leading-none mb-2 text-antigravity-accent">LONGITUD</span>
                                            <span className="text-[18px] font-bold font-mono text-antigravity-light-text/90 dark:text-antigravity-dark-text/90 tabular-nums">
                                                {selectedAsset.geo_point?.longitude.toFixed(6) || '0.000000'}
                                            </span>
                                        </div>
                                        <div className="flex flex-col text-right">
                                            <span className="text-[12px] font-black opacity-30 uppercase tracking-[0.3em] leading-none mb-2 text-antigravity-accent">PRECISIÓN_H</span>
                                            <span className="text-[18px] font-bold font-mono text-antigravity-accent tabular-nums">
                                                ±{(currentMeasurement?.location_metadata?.accuracy || 0).toFixed(1)}M
                                            </span>
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
                    <section className="w-64 border-r border-antigravity-light-border dark:border-antigravity-dark-border flex flex-col bg-antigravity-light-bg dark:bg-antigravity-dark-bg overflow-hidden relative transition-colors">
                        {selectedAsset && (
                            <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in duration-300">
                                <div className="h-10 border-b border-antigravity-light-border dark:border-antigravity-dark-border flex items-center px-4 bg-antigravity-light-surface/20 dark:bg-antigravity-dark-surface/20">
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
                                                className={`bg-antigravity-light-surface/20 dark:bg-antigravity-dark-surface/20 border border-antigravity-light-border dark:border-antigravity-dark-border p-4 flex flex-col gap-2 transition-all cursor-pointer active:scale-[0.98] ${isSelected ? 'border-antigravity-accent/40 bg-antigravity-accent/5' : 'hover:border-antigravity-accent/10'}`}
                                            >
                                                <div className="flex justify-between items-center">
                                                    <div className="text-[12px] font-black uppercase tracking-tight text-antigravity-light-text dark:text-antigravity-dark-text">{new Date(m.timestamp).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })}</div>
                                                    <div className="text-base font-black font-mono leading-none text-antigravity-accent">{m.volumen_m3.toFixed(1)} <span className="text-[10px] text-antigravity-light-text/50 dark:text-antigravity-dark-text/20 font-sans">m³</span></div>
                                                </div>
                                                {diff !== 0 && (
                                                    <div className={`text-[11px] font-black text-right ${diff > 0 ? 'text-green-600' : 'text-red-600'}`}>
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
                    <section className="w-[400px] flex flex-col bg-antigravity-light-surface/10 dark:bg-antigravity-dark-surface/10 overflow-hidden relative border-l border-antigravity-light-border dark:border-antigravity-dark-border transition-colors">
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
