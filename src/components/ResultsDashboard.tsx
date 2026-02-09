/**
 * Results Dashboard Component
 * Dashboard para visualizar datos del stockpile escaneado
 */

import React from 'react';
import type { StockpileData } from '../services/DataService';
import { SDKButton } from './SDKButton';
// Los estilos se gestionan ahora vía Tailwind CSS en index.css

interface ResultsDashboardProps {
    stockpileData: StockpileData | null;
    onNewScan: () => void;
}

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({ stockpileData, onNewScan }) => {
    if (!stockpileData) {
        return null;
    }

    return (
        <div className="results-dashboard max-w-[900px] mx-auto p-6">
            <div className="dashboard-header flex justify-between items-center mb-8">
                <h2 className="dashboard-title text-2xl font-bold flex items-center gap-2">
                    <span className="material-symbols-rounded text-antigravity-accent">analytics</span> Resultados del Escaneo
                </h2>
                <SDKButton variant="tertiary" onClick={onNewScan}>
                    <span className="material-symbols-rounded">arrow_back</span> Nuevo Escaneo
                </SDKButton>
            </div>

            <div className="metrics-grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8">
                <div className="metric-card bg-antigravity-light-surface dark:bg-antigravity-dark-surface border border-antigravity-light-border dark:border-antigravity-dark-border rounded-xl p-6 text-center transition-all duration-200 hover:shadow-md">
                    <div className="metric-icon text-4xl mb-2 text-antigravity-accent drop-shadow-sm">
                        <span className="material-symbols-rounded text-4xl">inventory_2</span>
                    </div>
                    <div className="metric-label text-[10px] font-bold uppercase tracking-widest text-antigravity-light-muted dark:text-antigravity-dark-muted mb-1">Volumen</div>
                    <div className="metric-value text-2xl font-bold text-antigravity-light-text dark:text-antigravity-dark-text">{stockpileData.volumen?.toLocaleString() || 'N/A'} m³</div>
                </div>

                <div className="metric-card bg-antigravity-light-surface dark:bg-antigravity-dark-surface border border-antigravity-light-border dark:border-antigravity-dark-border rounded-xl p-6 text-center transition-all duration-200 hover:shadow-md">
                    <div className="metric-icon text-4xl mb-2 text-antigravity-accent drop-shadow-sm">
                        <span className="material-symbols-rounded text-4xl">location_on</span>
                    </div>
                    <div className="metric-label text-[10px] font-bold uppercase tracking-widest text-antigravity-light-muted dark:text-antigravity-dark-muted mb-1">Ubicación</div>
                    <div className="metric-value text-base font-mono text-antigravity-light-text dark:text-antigravity-dark-text">
                        {stockpileData.location.lat.toFixed(4)}°, {stockpileData.location.lng.toFixed(4)}°
                    </div>
                </div>

                <div className="metric-card bg-antigravity-light-surface dark:bg-antigravity-dark-surface border border-antigravity-light-border dark:border-antigravity-dark-border rounded-xl p-6 text-center transition-all duration-200 hover:shadow-md">
                    <div className="metric-icon text-4xl mb-2 text-green-500 drop-shadow-sm">
                        <span className="material-symbols-rounded text-4xl">check_circle</span>
                    </div>
                    <div className="metric-label text-[10px] font-bold uppercase tracking-widest text-antigravity-light-muted dark:text-antigravity-dark-muted mb-1">Estado</div>
                    <div className="metric-value text-2xl font-bold text-green-600 dark:text-green-400">Guardado</div>
                </div>
            </div>

            <div className="info-section mb-8">
                <h3 className="section-title text-lg font-bold mb-4 flex items-center gap-2">
                    <span className="material-symbols-rounded">info</span> Detalles del Acopio
                </h3>
                <div className="info-grid grid grid-cols-1 sm:grid-cols-2 gap-4 bg-antigravity-light-surface dark:bg-antigravity-dark-surface border border-antigravity-light-border dark:border-antigravity-dark-border rounded-xl p-6">
                    <div className="info-item flex flex-col gap-0.5">
                        <span className="info-label text-[10px] font-bold uppercase tracking-wider text-antigravity-light-muted dark:text-antigravity-dark-muted">Nombre:</span>
                        <span className="info-value text-sm font-medium">{stockpileData.name}</span>
                    </div>

                    {stockpileData.metadata?.operator && (
                        <div className="info-item flex flex-col gap-0.5">
                            <span className="info-label text-[10px] font-bold uppercase tracking-wider text-antigravity-light-muted dark:text-antigravity-dark-muted">Operador:</span>
                            <span className="info-value text-sm font-medium">{stockpileData.metadata.operator}</span>
                        </div>
                    )}

                    {stockpileData.metadata?.date && (
                        <div className="info-item flex flex-col gap-0.5">
                            <span className="info-label text-[10px] font-bold uppercase tracking-wider text-antigravity-light-muted dark:text-antigravity-dark-muted">Fecha:</span>
                            <span className="info-value text-sm font-medium">{stockpileData.metadata.date}</span>
                        </div>
                    )}

                    <div className="info-item flex flex-col gap-0.5">
                        <span className="info-label text-[10px] font-bold uppercase tracking-wider text-antigravity-light-muted dark:text-antigravity-dark-muted">Timestamp:</span>
                        <span className="info-value text-sm font-medium">
                            {new Date(stockpileData.timestamp).toLocaleString()}
                        </span>
                    </div>

                    {stockpileData.metadata?.notes && (
                        <div className="info-item col-span-full mt-2 flex flex-col gap-0.5">
                            <span className="info-label text-[10px] font-bold uppercase tracking-wider text-antigravity-light-muted dark:text-antigravity-dark-muted">Notas:</span>
                            <span className="info-value text-sm bg-antigravity-light-bg dark:bg-antigravity-dark-bg p-3 rounded-lg border border-antigravity-light-border dark:border-antigravity-dark-border whitespace-pre-wrap">
                                {stockpileData.metadata.notes}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {stockpileData.imageUrls && stockpileData.imageUrls.length > 0 && (
                <div className="images-section mt-10">
                    <h3 className="section-title text-lg font-bold mb-4 flex items-center gap-2">
                        <span className="material-symbols-rounded">image</span> Galería de Imágenes
                    </h3>
                    <div className="image-gallery grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {stockpileData.imageUrls.map((url, index) => (
                            <img
                                key={index}
                                src={url}
                                alt={`Stockpile ${index + 1}`}
                                className="gallery-image w-full h-48 object-cover rounded-xl border border-antigravity-light-border dark:border-antigravity-dark-border transition-transform duration-200 hover:scale-[1.03] hover:shadow-lg cursor-zoom-in"
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
