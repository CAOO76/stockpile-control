import type { Granulometry } from '@minreport/sdk';

export interface AssetCalculation {
    volume_m3: number;
    factor_applied: number;
    weight_t: number;
    confidence_level: number; // 0.0 to 1.0
    source: 'manual' | 'inference' | 'default';
}

export interface SuggestionIA {
    density: number;
    confidence: number;
    reasoning: string;
}

export interface ValidationIA {
    isValid: boolean;
    warnings: string[];
    details: string;
}

export class CalculationEngine {
    // Matriz de Granulometría (Referencial Dinámica)
    private readonly GRANULOMETRY_MATRIX: Record<Granulometry, { min: number, max: number, default: number }> = {
        'COLPAS': { min: 1.60, default: 1.66, max: 1.69 }, // Alta porosidad (>12'')
        'GRANSA': { min: 1.70, default: 1.78, max: 1.85 },
        'MIXTO': { min: 1.80, default: 1.88, max: 1.95 },
        'FINOS': { min: 1.90, default: 2.00, max: 2.15 } // Baja porosidad
    };

    /**
     * Sugiere un factor de densidad basado en el tipo de granulometría.
     */
    public getFactorByGranulometry(type: Granulometry): number {
        return this.GRANULOMETRY_MATRIX[type].default;
    }

    /**
     * Lógica de Inferencia: Sugiere el factor basado en el histórico guardado.
     * Escanea el storage blindado buscando registros previos del mismo identificador.
     */
    public async inferDensity(
        materialId: string,
        secureContext: any // Reemplazo por SecureContext real en runtime
    ): Promise<{ factor: number, confidence: number }> {
        console.log(`[CalculationEngine] Inferiendo densidad para: ${materialId}`);

        try {
            // En SDK 2.0.0, el storage es clave-valor. 
            // Para una inferencia real, necesitaríamos un índice o listar claves (si el SDK lo permite).
            // Como el SDK actual es read/write por key, simulamos la búsqueda de un "snapshot" de histórico.
            const history = await secureContext.storage.read(`history_${materialId}`);

            if (history && history.last_factors) {
                const avg = history.last_factors.reduce((a: number, b: number) => a + b, 0) / history.last_factors.length;
                return { factor: avg, confidence: 0.85 };
            }
        } catch (e) {
            console.warn('[CalculationEngine] Error en inferencia, usando valor por defecto.');
        }

        return { factor: 1.66, confidence: 0.5 };
    }

    /**
     * Cálculo de Activo: Retorna el resultado unificado con nivel de confianza.
     */
    public calculateAsset(
        volume: number,
        factor: number,
        isManual: boolean,
        inferenceConfidence?: number
    ): AssetCalculation {
        return {
            volume_m3: volume,
            factor_applied: factor,
            weight_t: volume * factor,
            confidence_level: isManual ? 1.0 : (inferenceConfidence || 0.5),
            source: isManual ? 'manual' : (inferenceConfidence ? 'inference' : 'default')
        };
    }

    /**
     * Cálculo Manual: Cono Elíptico
     * Fórmula: (1/3) * PI * a * b * h
     * @param a Semieje mayor de la base
     * @param b Semieje menor de la base
     * @param h Altura
     */
    public calculateEllipticCone(a: number, b: number, h: number): number {
        return (1 / 3) * Math.PI * a * b * h;
    }

    /**
     * Cálculo Manual: Cono Elíptico Truncado
     * Fórmula: (1/3) * PI * h * (ab + a'b' + sqrt(ab * a'b'))
     * @param a Semieje mayor base inferior
     * @param b Semieje menor base inferior
     * @param ap Semieje mayor base superior
     * @param bp Semieje menor base superior
     * @param h Altura
     */
    public calculateTruncatedEllipticCone(a: number, b: number, ap: number, bp: number, h: number): number {
        const baseArea = a * b;
        const topArea = ap * bp;
        return (1 / 3) * Math.PI * h * (baseArea + topArea + Math.sqrt(baseArea * topArea));
    }

    /**
     * Cálculo Manual: Cono Truncado con Perímetro
     * Convierte Perímetros (P, P') a radios (R = P/2PI) y aplica fórmula de tronco de cono.
     * @param P Perímetro base inferior
     * @param Pp Perímetro base superior
     * @param h Altura
     */
    public calculatePerimeterTruncatedCone(P: number, Pp: number, h: number): number {
        const R = P / (2 * Math.PI);
        const r = Pp / (2 * Math.PI);
        // Fórmula tronco de cono: (1/3) * PI * h * (R^2 + r^2 + R*r)
        return (1 / 3) * Math.PI * h * (Math.pow(R, 2) + Math.pow(r, 2) + R * r);
    }

    /**
     * Cálculo por Foto: Interface para el motor de fotogrametría.
     * @param photoData Datos o referencias de las imágenes procesadas.
     * @returns Volumen base calculado por el motor externo.
     */
    public async computePhotogrammetryVolume(photoData: any[]): Promise<number> {
        console.log('[CalculationEngine] Procesando fotogrametría para', photoData.length, 'imágenes');
        // Simulación: En producción llama a un servicio de visión computacional
        return 2450.75; // Valor simulado
    }

    /**
     * Lógica de Peso: Genera el tonelaje basado en volumen y densidad.
     * @param volume Volumen en m³
     * @param density Factor de densidad en t/m³
     */
    public computeTotalMass(volume: number, density: number): number {
        return volume * density;
    }

    /**
     * Asistente IA: Sugiere el factor de densidad basado en el tipo de mineral.
     * @param mineralType Nombre del mineral (e.g., 'COBRE', 'HIERRO')
     * @returns Sugerencia con factor de densidad y razonamiento técnico.
     */
    public suggestDensity(mineralType: string): SuggestionIA {
        const normalized = mineralType.toUpperCase().trim();

        const database: Record<string, { d: number, r: string }> = {
            'COBRE': { d: 2.1, r: 'Basado en densidad promedio de calcopirita fragmentada con humedad del 4%.' },
            'HIERRO': { d: 2.8, r: 'Densidad estándar para hematita de alta ley con factor de esponjamiento de 1.4.' },
            'ORO': { d: 1.9, r: 'Mineral aurífero de cuarzo primario; densidad corregida por fragmentación media.' },
            'LITIO': { d: 1.6, r: 'Espodumena concentrada; baja gravedad específica característica del litio.' }
        };

        if (database[normalized]) {
            return {
                density: database[normalized].d,
                confidence: 0.92,
                reasoning: database[normalized].r
            };
        }

        return {
            density: 2.0,
            confidence: 0.5,
            reasoning: 'Tipo de mineral no reconocido. Se sugiere densidad estándar de seguridad (2.0 t/m³).'
        };
    }

    /**
     * Asistente IA: Valida si la geometría es consistente con la relación radio/altura detectada.
     * @param type Tipo de geometría seleccionada
     * @param dimensions Medidas físicas registradas
     */
    /**
     * Módulo de Cierre: Calcula la desviación real.
     * Factor Real = Peso Romana / Volumen Medido
     */
    /**
     * Compara el Tonelaje Estimado (Terreno) vs Real (Romana).
     * @param estimatedWeight Peso calculado en terreno (V * Factor Terreno)
     * @param realWeight Peso pesado en romana
     */
    public compareTonnage(estimatedWeight: number, realWeight: number) {
        return {
            difference: realWeight - estimatedWeight,
            differencePercent: ((realWeight - estimatedWeight) / estimatedWeight) * 100,
            isWithinTolerance: Math.abs(((realWeight - estimatedWeight) / estimatedWeight) * 100) < 5
        };
    }

    /**
     * Calcula el factor calibrado basado en el peso real de romana.
     * Factor Calibrado = Peso Romana / Volumen Medido
     */
    public computeRealTonnage(volume: number, realWeight: number): number {
        if (volume <= 0) return 0;
        return realWeight / volume;
    }

    /**
     * Inteligencia Adm: Sugiere una calibración global basada en el promedio histórico de romana.
     */
    public getSuggestedCalibration(history: { realFactor: number }[]): number | null {
        if (!history || history.length < 3) return null; // Mínimo 3 registros para calibrar
        const sum = history.reduce((acc, curr) => acc + curr.realFactor, 0);
        return parseFloat((sum / history.length).toFixed(3));
    }
    public calculateDeviation(measuredVolume: number, realWeight: number): { realFactor: number, deviationPercent: number } {
        if (measuredVolume <= 0) return { realFactor: 0, deviationPercent: 0 };

        const realFactor = realWeight / measuredVolume;
        // Supongamos un factor teórico base de 1.66
        const theoreticalFactor = 1.66;
        const deviationPercent = ((realFactor - theoreticalFactor) / theoreticalFactor) * 100;

        return {
            realFactor,
            deviationPercent
        };
    }

    /**
     * Inteligencia de Datos: Sugiere un nuevo valor basado en el historial.
     * Si los últimos 5 embarques promedian distinto, sugiere ese nuevo valor.
     */
    public suggestValidatedFactor(history: { factor: number }[]): number | null {
        if (!history || history.length < 5) return null;

        const lastFive = history.slice(-5);
        const average = lastFive.reduce((sum, item) => sum + item.factor, 0) / 5;

        return parseFloat(average.toFixed(2));
    }
}

export const calculationEngine = new CalculationEngine();
