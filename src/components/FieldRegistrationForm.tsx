/**
 * Field Registration Form Component
 * Formulario de Registro de Terreno para captura de datos de stockpile
 * Todos los campos con autocomplete='off' obligatorio
 */

import React, { useState } from 'react';
import { M3TextField } from './M3TextField';
import { M3Switch } from './M3Switch';
import { SDKButton } from './SDKButton';
import { stockpileControlPlugin } from '../plugin';
import type { StockpileData } from '../services/DataService';
import './FieldRegistrationForm.css';

interface FieldRegistrationFormProps {
    onSuccess: (stockpileId: string) => void;
}

export const FieldRegistrationForm: React.FC<FieldRegistrationFormProps> = ({ onSuccess }) => {
    const [formData, setFormData] = useState({
        siteName: '',
        operator: '',
        date: new Date().toISOString().split('T')[0],
        volume: '',
        notes: '',
    });

    const [geoEnabled, setGeoEnabled] = useState(false);
    const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Obtener geolocalización cuando se habilita
    const handleGeoToggle = (enabled: boolean) => {
        setGeoEnabled(enabled);

        if (enabled && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setCoordinates({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    });
                },
                (error) => {
                    console.error('Error obteniendo geolocalización:', error);
                    setErrors({ ...errors, geo: 'No se pudo obtener la ubicación' });
                    setGeoEnabled(false);
                }
            );
        } else if (!enabled) {
            setCoordinates(null);
        }
    };

    // Validar formulario
    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.siteName.trim()) {
            newErrors.siteName = 'Nombre del sitio es requerido';
        }

        if (!formData.operator.trim()) {
            newErrors.operator = 'Operador es requerido';
        }

        if (!formData.date) {
            newErrors.date = 'Fecha es requerida';
        }

        if (!formData.volume.trim()) {
            newErrors.volume = 'Volumen estimado es requerido';
        } else if (isNaN(Number(formData.volume)) || Number(formData.volume) <= 0) {
            newErrors.volume = 'Volumen debe ser un número positivo';
        }

        if (geoEnabled && !coordinates) {
            newErrors.geo = 'Esperando geolocalización...';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Iniciar escaneo de volumen
    const handleStartScan = async () => {
        if (!validateForm()) {
            return;
        }

        setIsScanning(true);

        try {
            // Simular escaneo (en producción se integraría con hardware/sensores)
            await new Promise(resolve => setTimeout(resolve, 2000));

            const stockpileData: StockpileData = {
                name: formData.siteName,
                volume: Number(formData.volume),
                location: coordinates || { lat: 0, lng: 0 },
                timestamp: Date.now(),
                metadata: {
                    operator: formData.operator,
                    date: formData.date,
                    notes: formData.notes,
                    geoEnabled,
                },
            };

            // Guardar usando el plugin (MinReport.Data.extendEntity)
            const stockpileId = await stockpileControlPlugin.saveStockpileData(stockpileData);

            console.log('✅ Stockpile guardado:', stockpileId);
            onSuccess(stockpileId);

            // Limpiar formulario
            setFormData({
                siteName: '',
                operator: '',
                date: new Date().toISOString().split('T')[0],
                volume: '',
                notes: '',
            });
            setGeoEnabled(false);
            setCoordinates(null);
        } catch (error) {
            console.error('Error iniciando escaneo:', error);
            setErrors({ scan: 'Error al iniciar el escaneo' });
        } finally {
            setIsScanning(false);
        }
    };

    return (
        <div className="field-registration-form">
            <div className="form-header">
                <h2 className="form-title">📋 Registro de Terreno</h2>
                <p className="form-subtitle">Complete los datos del acopio para iniciar el escaneo de volumen</p>
            </div>

            <form autoComplete="off" onSubmit={(e) => e.preventDefault()}>
                <M3TextField
                    label="Nombre del Sitio"
                    value={formData.siteName}
                    onChange={(value) => setFormData({ ...formData, siteName: value })}
                    required
                    error={errors.siteName}
                    helperText="Identificador del lugar de acopio"
                />

                <M3TextField
                    label="Operador"
                    value={formData.operator}
                    onChange={(value) => setFormData({ ...formData, operator: value })}
                    required
                    error={errors.operator}
                    helperText="Nombre del operador a cargo"
                />

                <M3TextField
                    label="Fecha"
                    type="date"
                    value={formData.date}
                    onChange={(value) => setFormData({ ...formData, date: value })}
                    required
                    error={errors.date}
                />

                <M3TextField
                    label="Volumen Estimado (m³)"
                    type="number"
                    value={formData.volume}
                    onChange={(value) => setFormData({ ...formData, volume: value })}
                    required
                    error={errors.volume}
                    helperText="Volumen aproximado del stockpile"
                />

                <M3TextField
                    label="Notas Adicionales"
                    value={formData.notes}
                    onChange={(value) => setFormData({ ...formData, notes: value })}
                    helperText="Observaciones o comentarios opcionales"
                />

                <M3Switch
                    label="Habilitar Georeferenciación"
                    checked={geoEnabled}
                    onChange={handleGeoToggle}
                />

                {geoEnabled && coordinates && (
                    <div className="coordinates-display">
                        <span className="coordinates-label">📍 Ubicación:</span>
                        <span className="coordinates-value">
                            {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
                        </span>
                    </div>
                )}

                {errors.geo && (
                    <div className="form-error">{errors.geo}</div>
                )}

                {errors.scan && (
                    <div className="form-error">{errors.scan}</div>
                )}

                <div className="form-actions">
                    <SDKButton
                        variant="primary"
                        onClick={handleStartScan}
                        disabled={isScanning}
                        fullWidth
                    >
                        {isScanning ? '🔄 Escaneando...' : '🔍 Iniciar Escaneo de Volumen'}
                    </SDKButton>
                </div>
            </form>
        </div>
    );
};
