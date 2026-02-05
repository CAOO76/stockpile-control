/**
 * Results Dashboard Component
 * Dashboard para visualizar datos del stockpile escaneado
 */

import React from 'react';
import type { StockpileData } from '../services/DataService';
import { SDKButton } from './SDKButton';
import './ResultsDashboard.css';

interface ResultsDashboardProps {
    stockpileData: StockpileData | null;
    onNewScan: () => void;
}

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({ stockpileData, onNewScan }) => {
    if (!stockpileData) {
        return null;
    }

    return (
        <div className="results-dashboard">
            <div className="dashboard-header">
                <h2 className="dashboard-title">📊 Resultados del Escaneo</h2>
                <SDKButton variant="tertiary" onClick={onNewScan}>
                    ← Nuevo Escaneo
                </SDKButton>
            </div>

            <div className="metrics-grid">
                <div className="metric-card">
                    <div className="metric-icon">📦</div>
                    <div className="metric-label">Volumen</div>
                    <div className="metric-value">{stockpileData.volume.toLocaleString()} m³</div>
                </div>

                <div className="metric-card">
                    <div className="metric-icon">📍</div>
                    <div className="metric-label">Ubicación</div>
                    <div className="metric-value">
                        {stockpileData.location.lat.toFixed(4)}°<br />
                        {stockpileData.location.lng.toFixed(4)}°
                    </div>
                </div>

                <div className="metric-card">
                    <div className="metric-icon">✅</div>
                    <div className="metric-label">Estado</div>
                    <div className="metric-value status-success">Guardado</div>
                </div>
            </div>

            <div className="info-section">
                <h3 className="section-title">Detalles del Acopio</h3>
                <div className="info-grid">
                    <div className="info-item">
                        <span className="info-label">Nombre:</span>
                        <span className="info-value">{stockpileData.name}</span>
                    </div>

                    {stockpileData.metadata?.operator && (
                        <div className="info-item">
                            <span className="info-label">Operador:</span>
                            <span className="info-value">{stockpileData.metadata.operator}</span>
                        </div>
                    )}

                    {stockpileData.metadata?.date && (
                        <div className="info-item">
                            <span className="info-label">Fecha:</span>
                            <span className="info-value">{stockpileData.metadata.date}</span>
                        </div>
                    )}

                    <div className="info-item">
                        <span className="info-label">Timestamp:</span>
                        <span className="info-value">
                            {new Date(stockpileData.timestamp).toLocaleString()}
                        </span>
                    </div>

                    {stockpileData.metadata?.notes && (
                        <div className="info-item full-width">
                            <span className="info-label">Notas:</span>
                            <span className="info-value">{stockpileData.metadata.notes}</span>
                        </div>
                    )}
                </div>
            </div>

            {stockpileData.imageUrls && stockpileData.imageUrls.length > 0 && (
                <div className="images-section">
                    <h3 className="section-title">🖼️ Galería de Imágenes</h3>
                    <div className="image-gallery">
                        {stockpileData.imageUrls.map((url, index) => (
                            <img
                                key={index}
                                src={url}
                                alt={`Stockpile ${index + 1}`}
                                className="gallery-image"
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
