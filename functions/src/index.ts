import { onDocumentCreated } from "firebase-functions/v2/firestore";
// import * as logger from "firebase-functions/logger";

/**
 * Trigger que se ejecuta cuando se crea una nueva medición de acopio.
 * Simula el procesamiento de IA/Fotogrametría para calcular el volumen.
 * 
 * En producción, esta función enviaría las fotos a un motor como OpenDroneMap o Pix4D.
 */
export const processStockpileVolume = onDocumentCreated("stockpile_measurements/{docId}", async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
        return;
    }

    const measurement = snapshot.data();

    // Solo procesar mediciones digitales pendientes
    if (measurement.method !== 'digital' || (measurement.status && measurement.status !== 'pending')) {
        return;
    }

    console.log(`[AI Engine] Procesando medición ${event.params.docId}...`);

    // 1. Marcar estado como 'processing'
    await snapshot.ref.update({ status: 'processing' });

    // 2. Simular tiempo de procesamiento de IA (ej: 5-8 segundos)
    // En producción: Descargar fotos, ejecutar SfM, generar nube de puntos
    await new Promise(resolve => setTimeout(resolve, 6000));

    // 3. Simular cálculo de volumen SENSIBLE AL CONTEXTO (Basado en Beta/Inclinación)
    // Usamos el ángulo Beta para estimar si estamos mirando un objeto pequeño en el suelo o un acopio gigante al frente.

    // Beta viene en grados (-180 a 180).
    const imuData = measurement.imu_data || {};
    // Tomamos beta absoluto para simplificar (suponiendo portrait mode)
    const beta = Math.abs(imuData.beta || 45);

    let estimatedVolume = 0;

    // Lógica de Estimación de Escala:
    // Si Beta < 60° (celular inclinado mirando al suelo) -> Objeto cercano/pequeño (Caja/Muestra)
    // Si Beta > 60° (celular vertical mirando al horizonte) -> Acopio lejano/gigante (Mina)

    if (beta < 60) {
        // Mirando hacia abajo (Caja en el suelo, escritorio)
        // Rango: 0.05 m3 - 1.5 m3
        // Más fotos = objeto más complejo -> un poco más volumen
        const complexity = (measurement.scan_photo_count || 5) * 0.02;
        estimatedVolume = 0.05 + (Math.random() * 0.5) + complexity;
        console.log(`[AI Engine] Detectado objeto PEQUEÑO/CERCANO (Beta: ${beta.toFixed(1)}°). Vol: ${estimatedVolume.toFixed(2)} m3`);
    } else {
        // Mirando al horizonte (Acopio real)
        // Rango: 100 m3 - 5000 m3
        const scaleFactor = Math.random() * 4000;
        estimatedVolume = 100 + scaleFactor;
        console.log(`[AI Engine] Detectado objeto INDUSTRIAL/LEJANO (Beta: ${beta.toFixed(1)}°). Vol: ${estimatedVolume.toFixed(2)} m3`);
    }

    const calculatedVolume = estimatedVolume;
    const density = measurement.operator_density || 1.6;
    const calculatedWeight = calculatedVolume * density;

    console.log(`[AI Engine] Volumen calculado: ${calculatedVolume.toFixed(2)} m3`);

    // 4. Actualizar documento con resultado final
    await snapshot.ref.update({
        status: 'completed',
        volumen_m3: parseFloat(calculatedVolume.toFixed(2)),
        peso_t: parseFloat(calculatedWeight.toFixed(2)),
        ai_metadata: {
            confidence: 0.92 + (Math.random() * 0.07), // 0.92 - 0.99
            processed_at: Date.now(),
            engine_version: 'v1.0.0-mock'
        }
    });

    console.log(`[AI Engine] Medición ${event.params.docId} completada.`);
});
