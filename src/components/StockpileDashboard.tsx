import React, { useState, useEffect } from 'react';
import { dataService } from '../services/DataService';
import { M3Chip } from './M3Chip';
import { StockpileStitchSummary } from './StockpileStitchSummary';
import type { StockpileAsset, StockpileMeasurement } from '../types/StockpileAsset';

interface StockpileDashboardProps {
    assetId: string;
    onAddMeasurement: () => void;
    onSelectMeasurement: (measurementId: string) => void;
    onBack: () => void;
}

/**
 * StockpileDashboard (La Portada)
 * Pantalla central de gestión del ciclo de vida del acopio.
 * Ajustada a STITCH Minimalismo Extremo.
 */
export const StockpileDashboard: React.FC<StockpileDashboardProps> = ({ assetId, onAddMeasurement, onSelectMeasurement, onBack }) => {
    const [asset, setAsset] = useState<StockpileAsset | null>(null);
    const [history, setHistory] = useState<StockpileMeasurement[]>([]);
    const [loading, setLoading] = useState(true);
    const [generatingPdf, setGeneratingPdf] = useState(false);
    const [manualPdfUrl, setManualPdfUrl] = useState<string | null>(null);
    const [showOriginal, setShowOriginal] = useState(false);
    const [shareImmediately, setShareImmediately] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            try {
                const assetData = await dataService.getAsset(assetId);
                setAsset(assetData);
                // Initial fetch removed, now handled by subscription
            } catch (error) {
                console.error('[Dashboard] Error loading data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();

        const unsubAsset = dataService.subscribeToAsset(assetId, (updated) => {
            if (updated) setAsset(updated);
        });

        const unsubHistory = dataService.subscribeToMeasurements(assetId, (updatedHistory) => {
            setHistory(updatedHistory);
        });

        return () => {
            unsubAsset();
            unsubHistory();
        };
    }, [assetId]);

    // Handle Direct Sharing logic
    useEffect(() => {
        if (generatingPdf && shareImmediately && asset) {
            const performShare = async () => {
                try {
                    console.log('[Dashboard] Starting direct share process...');
                    // Increased delay to ensure rendering completion
                    await new Promise(resolve => setTimeout(resolve, 1500));

                    const now = new Date();
                    const dateStr = now.toISOString().split('T')[0];
                    const timeStr = now.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false }).replace(':', '');
                    const fileName = `Ficha_${asset.name}_${dateStr}_${timeStr}hrs`;

                    const { sharePDF } = await import('../utils/pdfHelper');
                    await sharePDF(
                        'stitch-pdf-summary',
                        fileName,
                        `Reporte: ${asset.name}`
                    );
                    console.log('[Dashboard] Direct share completed');
                } catch (err: any) {
                    console.error('[Dashboard] Direct share error:', err);
                    alert('Error al compartir: ' + err.message);
                } finally {
                    setGeneratingPdf(false);
                    setShareImmediately(false);
                }
            };
            performShare();
        }
    }, [generatingPdf, shareImmediately, asset]);

    if (loading || !asset) {
        return (
            <div className="h-screen w-screen bg-black flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const lastM = history[0];
    const prevM = history[1];
    const deltaVol = lastM && prevM ? lastM.volumen_m3 - prevM.volumen_m3 : 0;

    return (
        <main className="h-screen w-screen bg-[#0a0a0a] flex flex-col font-atkinson text-white overflow-hidden">

            {/* Ultra Minimal Header */}
            <header className="shrink-0 pt-14 pb-4 px-6 flex items-center justify-between bg-black/40 backdrop-blur-xl border-b border-white/5 z-50">
                <button onClick={onBack} className="w-10 h-10 flex items-center justify-center active:scale-90 transition-transform">
                    <span className="material-symbols-outlined text-3xl">arrow_back</span>
                </button>
                <div className="flex flex-col items-center">
                    <h1 className="text-[9px] font-bold tracking-[0.4em] uppercase text-white/20">ACTIVO</h1>
                    <span className="text-sm font-black tracking-widest uppercase text-white/90">{asset.name}</span>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            console.log('[Dashboard] Share clicked (Direct native flow)');
                            setGeneratingPdf(true);
                            setShareImmediately(true);
                        }}
                        className="w-10 h-10 flex items-center justify-center text-white/30 active:text-white transition-colors bg-white/5 rounded-xl hover:bg-white/10"
                        title="Ver Reporte"
                    >
                        <span className="material-symbols-outlined text-xl">share</span>
                    </button>
                    <button className="w-10 h-10 flex items-center justify-center bg-primary text-black rounded-xl active:scale-90 transition-transform shadow-[0_0_15px_rgba(255,176,0,0.2)]">
                        <span className="material-symbols-outlined text-xl font-bold">edit</span>
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <section className="flex-1 overflow-y-auto hide-scrollbar">

                {/* Photo Hero */}
                <div className="relative w-full aspect-[16/10] bg-black group overflow-hidden">
                    <img
                        src={showOriginal ? asset.initial_photo_url : (asset.last_photo_url || asset.initial_photo_url)}
                        className={`w-full h-full object-cover transition-all duration-700 ${showOriginal ? 'scale-110 sepia-[.3]' : ''}`}
                        alt="Vista Acopio"
                    />

                    {/* Traceability Toggle (Original) */}
                    <button
                        onClick={() => setShowOriginal(!showOriginal)}
                        className={`absolute top-4 right-4 z-20 px-3 py-2 rounded-full backdrop-blur-md border flex items-center gap-2 transition-all active:scale-95 ${showOriginal ? 'bg-primary border-primary text-black' : 'bg-black/40 border-white/10 text-white/60'}`}
                    >
                        <span className="material-symbols-outlined text-lg">history</span>
                        <span className="text-[9px] font-black uppercase tracking-widest">{showOriginal ? 'Viendo Original' : 'Ver Original'}</span>
                    </button>

                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent pointer-events-none"></div>

                    {/* Status Badge in Hero */}
                    {!showOriginal && (
                        <div className="absolute bottom-10 left-6">
                            <span className="text-[8px] font-black uppercase tracking-[.4em] text-white/30 block mb-1">
                                {asset.last_measured_at ? 'ÚLTIMO ESTADO TÉCNICO' : 'FICHA DE ALTA (HD)'}
                            </span>
                        </div>
                    )}
                </div>

                {/* Content Details */}
                <div className="px-6 -mt-8 relative z-10 space-y-6 pb-28">
                    <div>
                        <h2 className="text-xl font-black tracking-tight text-white/95 uppercase">{asset.name}</h2>
                        <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">{asset.location_ref || 'Localización no definida'}</p>
                    </div>

                    {/* Metrics Layout (Standardized) */}
                    <div className="flex items-baseline gap-2 py-2">
                        <span className="text-5xl font-black text-primary tracking-tighter">
                            {asset.last_volume_m3?.toFixed(1) || '0.0'}
                        </span>
                        <span className="text-xs font-bold text-primary/40 uppercase tracking-widest">m³</span>
                        <span className="text-3xl font-light text-white/10 px-1 select-none">/</span>
                        <span className="text-4xl font-black text-white/90 tracking-tighter">
                            {asset.last_weight_t?.toFixed(1) || '0.0'}
                        </span>
                        <span className="text-xs font-bold text-white/20 uppercase tracking-widest">t</span>
                    </div>

                    {/* Deltas Grid */}
                    <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/5">
                        <div className="p-4 bg-white/5 rounded-3xl border border-white/10 flex flex-col gap-2">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">Anterior</span>
                            <p className="text-2xl font-black text-primary tracking-tight">
                                {prevM ? `${prevM.volumen_m3.toFixed(1)}` : '---'}
                                {prevM && <span className="text-[10px] ml-1 opacity-40">m³</span>}
                            </p>
                        </div>
                        <div className="p-4 bg-white/5 rounded-3xl border border-white/10 flex flex-col gap-2">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">Variación</span>
                            <div className={`flex items-baseline gap-1 text-2xl font-black ${deltaVol >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                <span className="material-symbols-outlined text-xl font-black translate-y-0.5">
                                    {deltaVol >= 0 ? 'north_east' : 'south_east'}
                                </span>
                                {deltaVol >= 0 ? '+' : ''}{deltaVol.toFixed(1)}
                                <span className="text-[10px] ml-0.5 opacity-40 font-bold">m³</span>
                            </div>
                        </div>
                    </div>

                    {/* GPS Map Section: Embedded Satellite Map (Last Measurement Location) */}
                    <div className="space-y-3 pt-6">
                        {(() => {
                            const apiKey = (import.meta as any).env.VITE_GOOGLE_MAPS_API_KEY;

                            // Debugging logs (minimized for prod)
                            console.log('[Dashboard] Map Config Check:', { hasApiKey: !!apiKey });

                            if (!lastM?.location_metadata) {
                                return (
                                    <div className="p-4 rounded-[20px] border border-white/10 bg-white/5 flex items-center justify-center">
                                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest text-center">
                                            SIN DATOS DE GPS EN EL HISTORIAL ({lastM.id})
                                        </p>
                                    </div>
                                );
                            }

                            if (!apiKey) {
                                return (
                                    <div className="p-4 rounded-[20px] bg-red-900/20 border border-red-500/50 flex flex-col items-center justify-center">
                                        <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest text-center">
                                            MISSING GOOGLE MAPS API KEY
                                        </p>
                                    </div>
                                );
                            }

                            const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${lastM.location_metadata.lat},${lastM.location_metadata.lng}&zoom=19&size=640x360&maptype=satellite&scale=2&markers=color:0xff6b00%7C${lastM.location_metadata.lat},${lastM.location_metadata.lng}&key=${apiKey}`;

                            return (
                                <>
                                    <div className="flex flex-col gap-1 px-1">
                                        <div className="flex justify-between items-end">
                                            <span className="text-[9px] font-bold text-primary italic uppercase tracking-widest">LOCALIZACIÓN SATELITAL (ÚLTIMA MEDICIÓN)</span>
                                            <span className="text-[9px] font-bold text-white/20 italic">±{lastM.location_metadata.accuracy.toFixed(1)}m</span>
                                        </div>
                                        <p className="text-xs font-black text-white/40 font-mono tracking-tighter">
                                            {lastM.location_metadata.lat.toFixed(6)} / {lastM.location_metadata.lng.toFixed(6)}
                                        </p>
                                    </div>

                                    <div className="w-full aspect-video rounded-[40px] overflow-hidden border border-white/10 bg-black shadow-2xl relative group">
                                        <img
                                            src={mapUrl}
                                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500"
                                            alt="Ubicación Satelital"
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                                const parent = e.currentTarget.parentElement;
                                                if (parent) {
                                                    const errorDiv = document.createElement('div');
                                                    errorDiv.className = "absolute inset-0 flex flex-col items-center justify-center bg-gray-900";
                                                    errorDiv.innerHTML = `
                                                        <span class="material-symbols-outlined text-4xl text-white/20 mb-2">satellite_alt</span>
                                                        <span class="text-[10px] text-white/40 font-bold uppercase tracking-widest">Imagen No Disponible</span>
                                                    `;
                                                    parent.appendChild(errorDiv);
                                                }
                                            }}
                                        />
                                        <div className="absolute inset-0 pointer-events-none border-[12px] border-black/20 rounded-[40px]" />
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <div className="w-4 h-4 bg-primary rounded-full shadow-[0_0_20px_rgba(255,255,255,0.5)] animate-pulse"></div>
                                        </div>
                                    </div>
                                </>
                            );
                        })()}
                    </div>

                    {/* History Selection */}
                    <div className="space-y-4 pt-2">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/20">HISTORIAL</h3>
                            <M3Chip label={history.length.toString()} className="h-4 px-2 text-[8px] bg-white/5 border-white/5 font-black" />
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                            {history.slice(0, 10).map((m, idx) => (
                                <div
                                    key={m.id}
                                    onClick={() => onSelectMeasurement(m.id)}
                                    className="flex items-center gap-4 p-3 bg-white/3 rounded-2xl border border-white/5 active:bg-white/10 transition-all cursor-pointer"
                                >
                                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-black shrink-0 border border-white/10">
                                        <img src={m.photo_url} className="w-full h-full object-cover grayscale opacity-40" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-black text-white/80">{m.volumen_m3.toFixed(1)} m³</span>
                                            <span className="text-[8px] font-bold text-white/20 uppercase tracking-tighter">
                                                {new Date(m.timestamp).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[9px] font-bold text-white/15 uppercase tracking-widest">
                                                {m.method}
                                            </span>
                                            {idx < history.length - 1 && (
                                                <span className={`text-[9px] font-black ${m.volumen_m3 >= history[idx + 1].volumen_m3 ? 'text-green-500/40' : 'text-red-500/40'}`}>
                                                    {m.volumen_m3 >= history[idx + 1].volumen_m3 ? '▲' : '▼'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Extreme Minimal Action Button */}
            <footer className="shrink-0 p-6 absolute bottom-0 left-0 w-full pointer-events-none z-[100]">
                <button
                    onClick={() => {
                        console.log('[Dashboard] CUBICAR clicked');
                        onAddMeasurement();
                    }}
                    className="w-full h-18 bg-primary text-black rounded-3xl font-black uppercase tracking-[0.3em] text-xs flex items-center justify-center gap-4 active:scale-95 transition-all pointer-events-auto border-t border-white/10"
                >
                    <span className="material-symbols-outlined text-3xl font-black">straighten</span>
                    CUBICAR
                </button>
            </footer>

            {/* Loading Overlay for PDF */}
            {generatingPdf && !manualPdfUrl && (
                <div className="fixed inset-0 z-[9999] bg-black/90 flex flex-col items-center justify-center backdrop-blur-md">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                    <h2 className="text-xl font-black text-white uppercase tracking-widest">Generando Reporte PDF</h2>
                    <p className="text-xs text-white/50 uppercase tracking-wider mt-2">Por favor espere...</p>
                </div>
            )}

            {/* Success/Download Overlay (Manual Fallback) */}
            {manualPdfUrl && (
                <div className="fixed inset-0 z-[10000] bg-black/95 flex flex-col items-center justify-center backdrop-blur-md p-8 animate-in fade-in duration-300">
                    <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-6">
                        <span className="material-symbols-outlined text-5xl text-green-500">check</span>
                    </div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-widest text-center mb-2">Reporte Listo</h2>
                    <p className="text-xs text-white/50 font-bold uppercase tracking-wider text-center mb-10 max-w-[200px]">
                        El documento se ha generado correctamente.
                    </p>

                    <a
                        href={manualPdfUrl}
                        download={`Ficha_${asset.name}.pdf`}
                        className="w-full max-w-xs h-16 bg-primary text-black rounded-2xl font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 text-sm shadow-[0_0_30px_rgba(255,176,0,0.3)] active:scale-95 transition-transform"
                        onClick={() => {
                            // Optional: Close after download if preferred, or let user close manually
                            setTimeout(() => setManualPdfUrl(null), 2000);
                        }}
                    >
                        <span className="material-symbols-outlined text-2xl">download</span>
                        Descargar PDF
                    </a>

                    <button
                        onClick={() => setManualPdfUrl(null)}
                        className="mt-8 px-6 py-4 text-white/30 text-[10px] font-black uppercase tracking-[0.2em] hover:text-white transition-colors"
                    >
                        Cerrar
                    </button>
                </div>
            )}

            {/* Enhanced Report View with Photos & Charts */}
            {asset && generatingPdf && (
                <div
                    className={`fixed z-[9000] bg-white overflow-auto ${shareImmediately ? 'pointer-events-none' : 'inset-0'}`}
                    style={shareImmediately ? { left: '-10000px', top: '0', width: '210mm', height: 'auto' } : {}}
                >
                    {/* Floating Action Buttons */}
                    <div className="fixed top-4 right-4 z-[10001] flex flex-col gap-2">
                        {/* Download PDF Button */}
                        <button
                            onClick={async () => {
                                try {
                                    console.log('[Dashboard] Download PDF clicked');
                                    const { downloadPDF } = await import('../utils/pdfHelper');

                                    await downloadPDF(
                                        'stitch-pdf-summary',
                                        `Ficha_${asset.name}_${new Date().toISOString().split('T')[0]}`
                                    );
                                } catch (err: any) {
                                    console.error('[Dashboard] Download error:', err);
                                    alert('Error al descargar: ' + err.message);
                                }
                            }}
                            className="w-14 h-14 rounded-full bg-primary text-black flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                            title="Descargar PDF"
                        >
                            <span className="material-symbols-outlined text-2xl font-black">download</span>
                        </button>



                        {/* Close Button */}
                        <button
                            onClick={() => setGeneratingPdf(false)}
                            className="w-14 h-14 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                            title="Cerrar"
                        >
                            <span className="material-symbols-outlined text-2xl">close</span>
                        </button>
                    </div>

                    <StockpileStitchSummary
                        asset={asset}
                        history={history}
                    />
                </div>
            )}
        </main>
    );
};
