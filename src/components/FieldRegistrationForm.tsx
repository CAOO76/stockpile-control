/**
 * Field Registration Form Component
 * Formulario de Registro de Terreno para captura de datos de stockpile
 * Todos los campos con autocomplete='off' obligatorio
 */

import React, { useState } from 'react';
import { M3TextField } from './M3TextField';
import { M3Switch } from './M3Switch';
import { SDKButton } from './SDKButton';
import stockpileControlPlugin from '../plugin';
import type { StockpileData } from '../services/DataService';
// Los estilos se gestionan ahora vía Tailwind CSS en index.css

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

            const volume_m3 = Number(formData.volume);
            const density_factor = 1.8; // Valor por defecto (t/m³)
            const weight_t = volume_m3 * density_factor;

            const stockpileData: StockpileData = {
                name: formData.siteName,
                geometry_type: 'CONO_ELIPTICO', // Por defecto para este flujo
                volumen: volume_m3, // Cambiado de volume_m3
                density_factor,
                weight_t,
                dimensions: { base_m: 10, height_m: 5 }, // Valores simulados
                location: coordinates || { lat: 0, lng: 0 },
                timestamp: Date.now(),
                metadata: {
                    timestamp: Date.now(),
                    geo: 'southamerica-west1',
                    precision: 0.95,
                    operatorId: formData.operator || 'anonymous',
                    notes: formData.notes,
                },
            };

            // Guardar usando el plugin (vía SecureContext.storage inyectado en plugin.ts -> dataService)
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
        <div className="field-registration-form bg-antigravity-light-bg dark:bg-antigravity-dark-bg text-antigravity-light-text dark:text-antigravity-dark-text min-h-screen p-6 transition-colors duration-200">
            <div className="form-header mb-8 text-center">
                <h2 className="form-title text-2xl font-bold flex items-center justify-center gap-2 mb-2">
                    <span className="material-symbols-rounded">content_paste</span> Registro de Terreno
                </h2>
                <p className="form-subtitle text-antigravity-light-muted dark:text-antigravity-dark-muted">Complete los datos del acopio para iniciar el escaneo de volumen</p>
            </div>

            <form autoComplete="off" className="space-y-4 max-w-lg mx-auto" onSubmit={(e) => e.preventDefault()}>
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

                <div className="bg-antigravity-light-surface dark:bg-antigravity-dark-surface p-4 rounded-lg border border-antigravity-light-border dark:border-antigravity-dark-border">
                    <M3Switch
                        label="Habilitar Georeferenciación"
                        checked={geoEnabled}
                        onChange={handleGeoToggle}
                    />

                    {geoEnabled && coordinates && (
                        <div className="coordinates-display mt-3 flex items-center gap-2 text-sm font-mono text-antigravity-accent bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                            <span className="material-symbols-rounded text-lg">location_on</span>
                            <span>
                                {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
                            </span>
                        </div>
                    )}
                </div>

                {errors.geo && (
                    <div className="form-error text-red-500 text-xs mt-1 flex items-center gap-1">
                        <span className="material-symbols-rounded text-sm">error</span> {errors.geo}
                    </div>
                )}

                {errors.scan && (
                    <div className="form-error text-red-500 text-xs mt-1 flex items-center gap-1">
                        <span className="material-symbols-rounded text-sm">error</span> {errors.scan}
                    </div>
                )}

                <div className="form-actions mt-8">
                    <SDKButton
                        variant="primary"
                        onClick={handleStartScan}
                        disabled={isScanning}
                        fullWidth
                    >
                        <div className="flex items-center justify-center gap-2">
                            {isScanning ? (
                                <span className="material-symbols-rounded animate-spin">refresh</span>
                            ) : (
                                <span className="material-symbols-rounded">search</span>
                            )}
                            {isScanning ? 'Escaneando...' : 'Iniciar Escaneo de Volumen'}
                        </div>
                    </SDKButton>
                </div>
            </form>
        </div>
    );
};
