import React, { useState, useMemo } from 'react';
import { M3TextField } from './M3TextField';
import { M3Badge } from './M3Badge';
import { M3Select } from './M3Select';
import { SDKButton } from './SDKButton';
import { calculationEngine } from '../services/calculation-engine';
import { dataService, type StockpileData } from '../services/DataService';
import { visionIAService, type VisionSuggestion } from '../services/vision-ia';
import type { Granulometry, GeometryType } from '@minreport/sdk';

type TabType = 'scan' | 'manual';

export const MobileScanner: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabType>('manual');
    const [geometria, setGeometria] = useState<GeometryType>('CONO_ELIPTICO');
    const [tipoGranulometria, setTipoGranulometria] = useState<Granulometry>('COLPAS');
    const [name, setName] = useState('');
    const [density, setDensity] = useState('1.66');
    const [dimensions, setDimensions] = useState<Record<string, string>>({
        a: '', b: '', h: '', ap: '', bp: '', P: '', Pp: ''
    });
    const [isSaving, setIsSaving] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiSuggestion, setAiSuggestion] = useState<VisionSuggestion | null>(null);
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    const handleDimensionChange = (key: string, value: string) => {
        setDimensions(prev => ({ ...prev, [key]: value }));
    };

    const handleGranulometryChange = (val: string) => {
        const type = val as Granulometry;
        setTipoGranulometria(type);
        const suggested = calculationEngine.getFactorByGranulometry(type);
        setDensity(suggested.toString());

        // Si hay una sugerencia activa y el usuario cambia a otra cosa, registramos el rechazo
        if (aiSuggestion && aiSuggestion.granulometry !== type) {
            // Feedback loop asíncrono
            const context = (dataService as any).secureContext;
            if (context) visionIAService.recordOperatorFeedback(aiSuggestion, false, type, context);
            setAiSuggestion(null);
        }
    };

    const handleAnalyzeTexture = async () => {
        setIsAnalyzing(true);
        setAiSuggestion(null);
        try {
            const suggestion = await visionIAService.analyzeTexture(null);
            setAiSuggestion(suggestion);
            setTipoGranulometria(suggestion.granulometry);
            setDensity(suggestion.suggestedFactor.toString());

            // Auto-aceptado inicial (se corrige si el usuario toca el M3Select)
            const context = (dataService as any).secureContext;
            if (context) visionIAService.recordOperatorFeedback(suggestion, true, suggestion.granulometry, context);
        } catch (e) {
            console.error('Error en análisis IA:', e);
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Cálculo automático de volumen
    const volume = useMemo(() => {
        const d = Object.fromEntries(
            Object.entries(dimensions).map(([k, v]) => [k, parseFloat(v) || 0])
        );

        switch (geometria) {
            case 'CONO_ELIPTICO':
                return calculationEngine.calculateEllipticCone(d.a, d.b, d.h);
            case 'CONO_ELIPTICO_TRUNCADO':
                return calculationEngine.calculateTruncatedEllipticCone(d.a, d.b, d.ap, d.bp, d.h);
            case 'CONO_PERIMETRO':
                return calculationEngine.calculatePerimeterTruncatedCone(d.P, d.Pp, d.h);
            default:
                return 0;
        }
    }, [geometria, dimensions]);

    // Cálculo automático de peso
    const weight = useMemo(() => {
        return calculationEngine.computeTotalMass(volume, parseFloat(density) || 0);
    }, [volume, density]);

    const handleSave = async () => {
        if (!name.trim()) {
            setMessage({ text: 'El nombre del acopio es obligatorio', type: 'error' });
            return;
        }

        setIsSaving(true);
        setMessage(null);

        try {
            const numericDimensions = Object.fromEntries(
                Object.entries(dimensions)
                    .filter(([_, v]) => v !== '')
                    .map(([k, v]) => [k, parseFloat(v)])
            );

            const stockpileData: StockpileData = {
                name,
                geometria,
                medidas_crudas: numericDimensions,
                volumen: volume,
                tipo_granulometria: tipoGranulometria,
                factor_densidad_usado: parseFloat(density) || 1.66,
                peso_final_toneladas: weight,
                location: { lat: 0, lng: 0 },
                timestamp: Date.now(),
                metadata: {
                    timestamp: Date.now(),
                    geo: 'southamerica-west1',
                    precision: activeTab === 'manual' ? 0.9 : 0.98,
                    operatorId: 'operator-terrain-01',
                    metodo: activeTab === 'manual' ? 'manual' : 'foto',
                    factor_utilizado: parseFloat(density) || 1.66,
                    ai_assisted: !!aiSuggestion
                }
            };

            await dataService.saveStockpileData(stockpileData);
            setMessage({ text: 'Registro blindado correctamente', type: 'success' });

            if (activeTab === 'manual') {
                setName('');
                setDimensions({ a: '', b: '', h: '', ap: '', bp: '', P: '', Pp: '' });
                setAiSuggestion(null);
            }
        } catch (error) {
            setMessage({ text: 'Error persistiendo en extensions.stockpile-control', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const granulometryOptions = [
        { id: 'COLPAS', label: 'Colpas (>12")' },
        { id: 'GRANSA', label: 'Gransa / Mixto' },
        { id: 'FINOS', label: 'Finos / Tierras' },
        { id: 'MIXTO', label: 'Mixto (Combinado)' }
    ];

    const geometryOptions = [
        { id: 'CONO_ELIPTICO', label: 'Cono Elíptico', icon: 'filter_vintage' },
        { id: 'CONO_ELIPTICO_TRUNCADO', label: 'Cono Truncado', icon: 'layers' },
        { id: 'CONO_PERIMETRO', label: 'Por Perímetros', icon: 'straighten' }
    ];

    return (
        <div className="mobile-scanner flex flex-col min-h-screen bg-antigravity-light-bg dark:bg-antigravity-dark-bg p-4 font-atkinson antialiased">
            {/* Header / Tabs Estilo M3 */}
            <div className="flex bg-antigravity-light-surface dark:bg-antigravity-dark-surface rounded-2xl p-1 mb-6 shadow-sm border border-antigravity-light-border dark:border-antigravity-dark-border">
                <button
                    onClick={() => setActiveTab('scan')}
                    className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${activeTab === 'scan' ? 'bg-antigravity-accent text-white shadow-md' : 'text-antigravity-light-muted dark:text-antigravity-dark-muted'}`}
                >
                    <span className="material-symbols-rounded">photo_camera</span> Escanear
                </button>
                <button
                    onClick={() => setActiveTab('manual')}
                    className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${activeTab === 'manual' ? 'bg-antigravity-accent text-white shadow-md' : 'text-antigravity-light-muted dark:text-antigravity-dark-muted'}`}
                >
                    <span className="material-symbols-rounded">calculate</span> Cálculo Manual
                </button>
            </div>

            <div className="flex-1 space-y-6 flex flex-col overflow-y-auto pb-32 scrollbar-none">
                {activeTab === 'scan' ? (
                    <div className="scan-content flex-1 flex flex-col items-center justify-center text-center p-8 bg-antigravity-light-surface dark:bg-antigravity-dark-surface rounded-3xl border-2 border-dashed border-antigravity-light-border dark:border-antigravity-dark-border shadow-inner">
                        <div className="w-20 h-20 bg-antigravity-accent/10 rounded-full flex items-center justify-center mb-4 text-antigravity-accent">
                            <span className="material-symbols-rounded text-4xl">linked_camera</span>
                        </div>
                        <h3 className="text-xl font-bold mb-2">Captura Fotogramétrica</h3>
                        <p className="text-sm text-antigravity-light-muted dark:text-antigravity-dark-muted mb-6">Inicie la secuencia de captura para modelado 3D con conciencia espacial.</p>
                        <SDKButton onClick={() => { }} fullWidth>Abrir Cámara</SDKButton>
                    </div>
                ) : (
                    <div className="manual-form space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <M3TextField
                            label="Identificador de Acopio"
                            value={name}
                            onChange={setName}
                            placeholder="Ej: Stockpile Cobre #01"
                        />

                        {/* Inteligencia AI - Sugerencia de Textura */}
                        <div className="ai-vision-module p-1 bg-antigravity-accent/5 rounded-3xl border border-antigravity-accent/20">
                            <SDKButton
                                variant="tertiary"
                                onClick={handleAnalyzeTexture}
                                fullWidth
                                disabled={isAnalyzing}
                            >
                                <div className="flex items-center gap-2 py-1">
                                    <span className={`material-symbols-rounded ${isAnalyzing ? 'animate-spin' : ''}`}>
                                        {isAnalyzing ? 'psychology' : 'center_focus_strong'}
                                    </span>
                                    {isAnalyzing ? 'Analizando Textura...' : 'Analizar Textura con IA'}
                                </div>
                            </SDKButton>

                            {aiSuggestion && (
                                <div className="p-4 pt-1 animate-in fade-in slide-in-from-top-2">
                                    <div className="flex items-start gap-3 mt-2">
                                        <div className="p-2 bg-antigravity-accent/10 rounded-full text-antigravity-accent">
                                            <span className="material-symbols-rounded text-sm">auto_awesome</span>
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-xs font-bold text-antigravity-accent uppercase tracking-wider flex justify-between">
                                                IA Sugiere: {aiSuggestion.granulometry}
                                                <span>{Math.round(aiSuggestion.confidence * 100)}% Confianza</span>
                                            </div>
                                            <p className="text-[11px] opacity-70 mt-1 leading-relaxed">{aiSuggestion.reasoning}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Selector de Textura / Granulometría */}
                        <M3Select
                            label="Granulometría del Material"
                            value={tipoGranulometria}
                            options={granulometryOptions}
                            onChange={handleGranulometryChange}
                            helperText="Define el factor de densidad sugerido"
                        />

                        {/* Selector de Geometría */}
                        <div className="geometry-selector space-y-3">
                            <label className="text-xs font-bold uppercase tracking-wider opacity-60 ml-4 flex items-center gap-2">
                                <span className="material-symbols-rounded text-base">square_foot</span>
                                Tipo de Geometría
                            </label>
                            <div className="grid grid-cols-1 gap-2">
                                {geometryOptions.map(geo => (
                                    <button
                                        key={geo.id}
                                        onClick={() => setGeometria(geo.id as GeometryType)}
                                        className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-200 text-left ${geometria === geo.id ? 'border-antigravity-accent bg-antigravity-accent/5 font-bold shadow-sm' : 'border-antigravity-light-border dark:border-antigravity-dark-border'}`}
                                    >
                                        <span className="material-symbols-rounded opacity-70">{geo.icon}</span>
                                        <span className="flex-1">{geo.label}</span>
                                        {geometria === geo.id && <span className="material-symbols-rounded text-antigravity-accent text-lg">check_circle</span>}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Campos Dinámicos */}
                        <div className="dynamic-inputs bg-antigravity-light-surface dark:bg-antigravity-dark-surface p-5 rounded-3xl border border-antigravity-light-border dark:border-antigravity-dark-border space-y-1 shadow-sm">
                            <h4 className="text-sm font-bold flex items-center gap-2 mb-4 opacity-70">
                                <span className="material-symbols-rounded text-base">straighten</span>
                                Dimensiones Físicas (m)
                            </h4>

                            {geometria === 'CONO_ELIPTICO' && (
                                <>
                                    <M3TextField label="Semieje Mayor (a)" type="number" value={dimensions.a} onChange={(v) => handleDimensionChange('a', v)} />
                                    <M3TextField label="Semieje Menor (b)" type="number" value={dimensions.b} onChange={(v) => handleDimensionChange('b', v)} />
                                </>
                            )}

                            {geometria === 'CONO_ELIPTICO_TRUNCADO' && (
                                <>
                                    <M3TextField label="Base Mayor (a)" type="number" value={dimensions.a} onChange={(v) => handleDimensionChange('a', v)} />
                                    <M3TextField label="Base Menor (b)" type="number" value={dimensions.b} onChange={(v) => handleDimensionChange('b', v)} />
                                    <M3TextField label="Cima Mayor (a')" type="number" value={dimensions.ap} onChange={(v) => handleDimensionChange('ap', v)} />
                                    <M3TextField label="Cima Menor (b')" type="number" value={dimensions.bp} onChange={(v) => handleDimensionChange('bp', v)} />
                                </>
                            )}

                            {geometria === 'CONO_PERIMETRO' && (
                                <>
                                    <M3TextField label="Perímetro Base (P)" type="number" value={dimensions.P} onChange={(v) => handleDimensionChange('P', v)} />
                                    <M3TextField label="Perímetro Cima (P')" type="number" value={dimensions.Pp} onChange={(v) => handleDimensionChange('Pp', v)} />
                                </>
                            )}

                            <M3TextField label="Altura Efectiva (h)" type="number" value={dimensions.h} onChange={(v) => handleDimensionChange('h', v)} />
                        </div>

                        {/* Factor Manual y Resultados Críticos */}
                        <div className="results-section space-y-4 pt-4 border-t border-antigravity-light-border dark:border-antigravity-dark-border opacity-90">
                            <M3TextField
                                label="Factor de Densidad Manual (t/m³)"
                                type="number"
                                value={density}
                                onChange={setDensity}
                                helperText="Sugerido por inteligencia de granulometría"
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <M3Badge label="Volumen Total" value={volume.toFixed(2)} unit="m³" />
                                <M3Badge label="Peso Estimado" value={weight.toFixed(1)} unit="ton" variant="primary" />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Acciones de Terreno (Sticky Footer) */}
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-antigravity-light-bg dark:from-antigravity-dark-bg via-antigravity-light-bg/95 dark:via-antigravity-dark-bg/95 to-transparent z-50">
                {message && (
                    <div className={`mb-4 p-4 rounded-2xl text-sm font-bold flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 shadow-2xl ${message.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                        <span className="material-symbols-rounded">{message.type === 'success' ? 'verified' : 'report'}</span>
                        {message.text}
                    </div>
                )}
                <SDKButton
                    onClick={handleSave}
                    fullWidth
                    variant="primary"
                    disabled={isSaving || (activeTab === 'manual' && volume <= 0)}
                >
                    <div className="flex items-center gap-3 py-1 font-atkinson tracking-wide">
                        {isSaving ? (
                            <span className="material-symbols-rounded animate-spin">sync</span>
                        ) : (
                            <span className="material-symbols-rounded">security</span>
                        )}
                        {isSaving ? 'Blindando Datos...' : 'Guardar y Blindar'}
                    </div>
                </SDKButton>
            </div>
        </div>
    );
};
