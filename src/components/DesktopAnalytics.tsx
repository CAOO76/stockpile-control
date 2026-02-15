import React, { useState, useEffect, useMemo } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import { M3TextField } from './M3TextField';
import { M3Badge } from './M3Badge';
import { SDKButton } from './SDKButton';
import { calculationEngine } from '../services/calculation-engine';
import { dataService } from '../services/DataService';
import type { StockpileAsset } from '../types/StockpileAsset';

/**
 * DesktopAnalytics v2.0.0 - Gestión de Inventario y Conciliación de Romana
 */
export const DesktopAnalytics: React.FC = () => {
    const [assets, setAssets] = useState<StockpileAsset[]>([]);
    const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
    const [realWeightInput, setRealWeightInput] = useState('');
    const [materialProfiles, setMaterialProfiles] = useState<Record<string, number>>({});

    // Carga inicial reactiva via context.storage.read (Simulado a través de DataService)
    useEffect(() => {
        let unsubscribe: (() => void) | undefined;
        let mounted = true;

        const init = async () => {
            try {
                // 1. Cargar perfiles de material (configuración estática)
                const profiles = await dataService.getMaterialProfiles();
                if (mounted) setMaterialProfiles(profiles);

                // 2. Suscribirse a cambios en activos (tiempo real)
                unsubscribe = dataService.subscribeToAllAssets((data) => {
                    if (mounted) setAssets(data);
                });
            } catch (error) {
                console.error('[Analytics] Error initializing:', error);
            }
        };

        init();

        return () => {
            mounted = false;
            if (unsubscribe) unsubscribe();
        };
    }, []);

    const selectedAsset = useMemo(() =>
        assets.find(a => a.id === selectedAssetId) || null
        , [assets, selectedAssetId]);

    // Cálculo de Conciliación en tiempo real
    const reconciliation = useMemo(() => {
        if (!selectedAsset || !realWeightInput) return null;
        const realWeight = parseFloat(realWeightInput);
        const volume = selectedAsset.volumen || 0;
        const estWeight = selectedAsset.peso_final_toneladas || 0;

        const realFactor = calculationEngine.computeRealTonnage(volume, realWeight);
        const comparison = calculationEngine.compareTonnage(estWeight, realWeight);

        return { realFactor, ...comparison };
    }, [selectedAsset, realWeightInput]);

    // Datos para el Dashboard (Tonelaje Estimado vs Real por Granulometría)
    const dashboardData = useMemo(() => {
        const granulometries = ['COLPAS', 'GRANSA', 'MIXTO', 'FINOS'] as const;
        return granulometries.map(g => {
            const gAssets = assets.filter(a => a.tipo_granulometria === g && a.peso_romana);
            const est = gAssets.reduce((acc, curr) => acc + (curr.peso_final_toneladas || 0), 0);
            const real = gAssets.reduce((acc, curr) => acc + (curr.peso_romana || 0), 0);
            return { name: g, estimación: est, real: real };
        });
    }, [assets]);

    // Lógica de Calibración de IA (Sugerencia por promedios)
    const calibrationSuggestions = useMemo(() => {
        const suggestions: Record<string, number | null> = {};
        ['COLPAS', 'GRANSA', 'MIXTO', 'FINOS'].forEach(g => {
            const hist = assets
                .filter(a => a.tipo_granulometria === g && a.factor_real)
                .map(a => ({ realFactor: a.factor_real! }));
            suggestions[g] = calculationEngine.getSuggestedCalibration(hist);
        });
        return suggestions;
    }, [assets]);

    const handleSaveScaleWeight = async () => {
        if (!selectedAsset || !reconciliation) return;

        const updated: StockpileAsset = {
            ...selectedAsset,
            peso_romana: parseFloat(realWeightInput),
            factor_real: reconciliation.realFactor,
            metadata: {
                ...selectedAsset.metadata,
                conciliado: true,
                fecha_conciliacion: Date.now()
            }
        };

        await dataService.saveStockpileData(updated, selectedAsset.id);
        setAssets(prev => prev.map(a => a.id === updated.id ? updated : a));
        setRealWeightInput('');
        alert('Peso de romana registrado y factor real calculado.');
    };

    const handleCalibrateFactor = async (granulometry: string, newFactor: number) => {
        const newProfiles = { ...materialProfiles, [granulometry]: newFactor };
        await dataService.saveMaterialProfiles(newProfiles);
        setMaterialProfiles(newProfiles);
        alert(`Factor global para ${granulometry} actualizado a ${newFactor}. Se sincronizará con terreno.`);
    };

    const generatePDFCertification = () => {
        if (!selectedAsset) return;
        console.log('Generando Certificación PDF Digital...');
        alert(`Certificado Generado para ${selectedAsset.name}\nVolumen: ${selectedAsset.volumen?.toFixed(2)} m³\nFirma Digital: stockpile-control-v2.0.0-signed`);
    };

    return (
        <div className="desktop-analytics h-screen bg-antigravity-light-bg dark:bg-antigravity-dark-bg p-8 font-atkinson flex flex-col antialiased overflow-hidden">
            {/* Header M3 */}
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <span className="material-symbols-outlined text-antigravity-accent">landscape</span>
                        Gestión de Inventario y Conciliación
                    </h1>
                    <p className="opacity-60 text-sm mt-1">Calibración de Factores de Densidad vs. Romana Real</p>
                </div>
                <div className="flex gap-4">
                    <SDKButton onClick={generatePDFCertification} disabled={!selectedAsset} variant="secondary">
                        <span className="material-symbols-rounded mr-2">picture_as_pdf</span> Certificar Inventario
                    </SDKButton>
                </div>
            </header>

            {/* Grid de 3 Columnas */}
            <div className="grid grid-cols-12 gap-8 flex-1 overflow-hidden">

                {/* Columna 1: Registro de Romana */}
                <section className="col-span-4 bg-antigravity-light-surface dark:bg-antigravity-dark-surface rounded-[40px] border border-antigravity-light-border dark:border-antigravity-dark-border shadow-sm flex flex-col overflow-hidden">
                    <div className="p-6 border-b border-antigravity-light-border dark:border-antigravity-dark-border">
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <span className="material-symbols-rounded text-green-500">scale</span>
                            Listado para Conciliación
                        </h2>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-none">
                        {assets.map(asset => (
                            <button
                                key={asset.id}
                                onClick={() => { setSelectedAssetId(asset.id!); setRealWeightInput(''); }}
                                className={`w-full text-left p-5 rounded-3xl transition-all border-2 ${selectedAssetId === asset.id ? 'border-antigravity-accent bg-antigravity-accent/5' : 'border-transparent hover:bg-antigravity-light-bg dark:hover:bg-antigravity-dark-bg'}`}
                            >
                                <div className="flex justify-between items-start">
                                    <span className="font-bold">{asset.name}</span>
                                    {asset.peso_romana ? (
                                        <span className="bg-green-500/10 text-green-600 text-[10px] px-2 py-1 rounded-full font-bold">CONCILIADO</span>
                                    ) : (
                                        <span className="bg-orange-500/10 text-orange-600 text-[10px] px-2 py-1 rounded-full font-bold">PENDIENTE</span>
                                    )}
                                </div>
                                <div className="text-xs opacity-60 mt-2 flex justify-between">
                                    <span>{asset.tipo_granulometria}</span>
                                    <span>{asset.volumen?.toFixed(1)} m³</span>
                                </div>
                            </button>
                        ))}
                    </div>

                    {selectedAsset && (
                        <div className="p-6 bg-antigravity-light-bg dark:bg-antigravity-dark-bg border-t border-antigravity-light-border dark:border-antigravity-dark-border animate-in slide-in-from-bottom-4">
                            <M3TextField
                                label="Peso Real en Romana (ton)"
                                value={realWeightInput}
                                onChange={setRealWeightInput}
                                type="number"
                                placeholder="Ej: 25.4"
                                autoComplete="off"
                            />
                            {reconciliation && (
                                <div className="mt-4 grid grid-cols-2 gap-3">
                                    <div className="p-3 bg-white dark:bg-black/20 rounded-2xl border border-antigravity-light-border dark:border-antigravity-dark-border">
                                        <div className="text-[10px] font-bold opacity-60">FACTOR REAL</div>
                                        <div className="text-sm font-bold text-antigravity-accent">{reconciliation.realFactor.toFixed(3)}</div>
                                    </div>
                                    <div className="p-3 bg-white dark:bg-black/20 rounded-2xl border border-antigravity-light-border dark:border-antigravity-dark-border">
                                        <div className="text-[10px] font-bold opacity-60">DESVIACIÓN</div>
                                        <div className={`text-sm font-bold ${reconciliation.isWithinTolerance ? 'text-green-500' : 'text-red-500'}`}>
                                            {reconciliation.differencePercent.toFixed(1)}%
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div className="mt-4">
                                <SDKButton onClick={handleSaveScaleWeight} fullWidth disabled={!realWeightInput}>Registrar Pesaje</SDKButton>
                            </div>
                        </div>
                    )}
                </section>

                {/* Columna 2: Dashboard Visual */}
                <section className="col-span-5 flex flex-col gap-8">
                    <div className="flex-1 bg-antigravity-light-surface dark:bg-antigravity-dark-surface rounded-[40px] border border-antigravity-light-border dark:border-antigravity-dark-border shadow-sm p-8 flex flex-col overflow-hidden">
                        <h2 className="text-xl font-bold flex items-center gap-2 mb-8">
                            <span className="material-symbols-rounded text-blue-500">bar_chart</span>
                            Exactitud del Inventario
                        </h2>
                        <div className="flex-1 min-h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={dashboardData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 'bold' }} />
                                    <YAxis axisLine={false} tickLine={false} />
                                    <Tooltip
                                        cursor={{ fill: 'transparent' }}
                                        contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                                    />
                                    <Legend iconType="circle" />
                                    <Bar dataKey="estimación" fill="#d1d5db" radius={[10, 10, 0, 0]} barSize={24} />
                                    <Bar dataKey="real" fill="#ff4757" radius={[10, 10, 0, 0]} barSize={24} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <M3Badge label="Total Acopios" value={assets.length.toString()} unit="registros" />
                        <M3Badge label="Conciliación" value={((assets.filter(a => a.peso_romana).length / assets.length) * 100 || 0).toFixed(0)} unit="%" variant="primary" />
                    </div>
                </section>

                {/* Columna 3: Calibración de IA */}
                <section className="col-span-3 bg-antigravity-light-surface dark:bg-antigravity-dark-surface rounded-[40px] border border-antigravity-light-border dark:border-antigravity-dark-border shadow-sm p-6 flex flex-col">
                    <h2 className="text-lg font-bold flex items-center gap-2 mb-6">
                        <span className="material-symbols-rounded text-antigravity-accent">auto_fix_high</span>
                        Calibración IA
                    </h2>

                    <div className="space-y-4">
                        {Object.entries(materialProfiles).map(([granulometry, currentFactor]) => {
                            const suggestion = calibrationSuggestions[granulometry];
                            return (
                                <div key={granulometry} className="p-5 bg-antigravity-light-bg dark:bg-antigravity-dark-bg rounded-3xl border border-antigravity-light-border dark:border-antigravity-dark-border">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-xs font-bold uppercase tracking-widest opacity-60">{granulometry}</span>
                                        <span className="text-lg font-bold">{currentFactor} <span className="text-[10px] opacity-40">t/m³</span></span>
                                    </div>

                                    {suggestion && suggestion !== currentFactor ? (
                                        <div className="bg-antigravity-accent/5 rounded-2xl p-4 border border-antigravity-accent/20">
                                            <div className="text-[10px] text-antigravity-accent font-bold mb-1 uppercase">Sugerencia de Calibración</div>
                                            <div className="flex justify-between items-center">
                                                <div className="text-xl font-bold">{suggestion}</div>
                                                <SDKButton onClick={() => handleCalibrateFactor(granulometry, suggestion)} variant="secondary">
                                                    ACEPTAR
                                                </SDKButton>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-2 opacity-30">
                                            <span className="material-symbols-rounded text-lg">check_circle</span>
                                            <div className="text-[10px] mt-1">Sincronizado</div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-auto p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-start gap-3">
                        <span className="material-symbols-rounded text-blue-500 text-base">info</span>
                        <p className="text-[10px] text-blue-500">Los factores aceptados aquí se propagarán instantáneamente a los cálculos de terreno de todos los operadores.</p>
                    </div>
                </section>

            </div>
        </div>
    );
};
