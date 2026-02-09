import React, { useState, useRef, useEffect, useCallback } from 'react';
import clsx from 'clsx'; // Importar clsx para manejar clases condicionales

// --- Mock de M3Chip y SDK Context para desarrollo ---
// Se ha modificado para mejorar la legibilidad sobre la cámara
const M3Chip = ({ label }: { label: string }) => (
  <div className="bg-[rgba(28,27,31,0.8)] text-white rounded-full px-4 py-2 text-sm font-medium shadow-lg backdrop-blur-sm">
    {label}
  </div>
);

// Asumimos que un objeto 'context' con esta forma es pasado por props.
interface MockSDKContext {
  storage: {
    write: (key: string, value: any) => Promise<void>;
  };
}

// --- Props del Componente ---
interface VisionAnalyzerProps {
  context: MockSDKContext;
  onAnalysisComplete: (result: { factor: number; image: string }) => void;
}

/**
 * VisionAnalyzer: Componente de Visión Computacional para analizar la granulometría de acopios.
 * Utiliza la cámara del dispositivo y simula un análisis de IA para determinar
 * la densidad del material (Fino vs. Colpa).
 * Refactorizado para UI/UX Mobile Senior.
 */
const VisionAnalyzer: React.FC<VisionAnalyzerProps> = ({ context, onAnalysisComplete }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [analysisState, setAnalysisState] = useState<'idle' | 'analyzing' | 'complete'>('idle');
  const [analysisResult, setAnalysisResult] = useState<{ type: 'Fino' | 'Colpa'; factor: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Refs para stream y timeoutId para que persistan y sean accesibles en el cleanup del useEffect
  const streamRef = useRef<MediaStream | null>(null);
  const timeoutIdRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Función para inicializar la cámara, envuelta en useCallback
  const enableCamera = useCallback(async () => {
    setError(null); // Limpiar errores previos
    setIsCameraActive(false); // Resetear estado de cámara activa

    try {
      // Limpiar cualquier timeout o stream existente antes de iniciar uno nuevo
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = undefined;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      timeoutIdRef.current = setTimeout(async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
          });
          streamRef.current = stream; // Almacenar stream en ref
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            setIsCameraActive(true);
          }
        } catch (err) {
          console.error("Error al acceder a la cámara:", err);
          setError('No se pudo acceder a la cámara. Por favor, revisa los permisos o inténtalo de nuevo.');
        } finally {
          timeoutIdRef.current = undefined; // Marcar timeout como completado
        }
      }, 500); // Delay
    } catch (err) {
      console.error("Error general en enableCamera:", err);
      setError('Ocurrió un error al intentar iniciar la cámara.');
    }
  }, []); // Dependencias vacías para que la función no cambie entre renders

  // Hook para iniciar y limpiar la cámara
  useEffect(() => {
    enableCamera(); // Iniciar la cámara

    return () => {
      // Función de limpieza que usa los refs
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = undefined;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, [enableCamera]); // enableCamera es una dependencia para el useEffect (envuelta en useCallback)

  // Simulación de análisis de granulometría
  const analyzeGranulometry = () => {
    if (!videoRef.current || !canvasRef.current) return;
    setAnalysisState('analyzing');
    setAnalysisResult(null);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    
    setTimeout(() => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const sampleSize = 5000;
        const luminances: number[] = [];
        for (let i = 0; i < sampleSize; i++) {
            const index = Math.floor(Math.random() * (data.length / 4)) * 4;
            const luminance = 0.2126 * data[index] + 0.7152 * data[index+1] + 0.0722 * data[index+2];
            luminances.push(luminance);
        }
        const meanLuminance = luminances.reduce((a, b) => a + b, 0) / luminances.length;
        const stdDev = Math.sqrt(luminances.map(l => (l - meanLuminance) ** 2).reduce((a, b) => a + b, 0) / luminances.length);
        
        const complexityThreshold = 25;
        let result = stdDev > complexityThreshold 
            ? { type: 'Colpa' as 'Colpa', factor: 1.66 } 
            : { type: 'Fino' as 'Fino', factor: 1.90 };
        
        setAnalysisResult(result);
        setAnalysisState('complete');
    }, 500);
  };

  // Guardar resultado del análisis
  const handleAcceptAnalysis = async () => {
    if (!analysisResult || !canvasRef.current) return;
    const lowResImage = canvasRef.current.toDataURL('image/jpeg', 0.5);
    const payload = { factor: analysisResult.factor, image: lowResImage };
    try {
      await context.storage.write('extensions.stockpile-control', payload);
      onAnalysisComplete(payload);
    } catch (err) {
      console.error("Error al guardar en el storage del SDK:", err);
      setError("No se pudo guardar el análisis.");
    }
  };

  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <div className="font-sans w-full h-full bg-black relative">
      <canvas ref={canvasRef} className="hidden" />
      
      {isCameraActive ? (
        <>
          {/* Capa de Video (Fondo) - z-index: 0 */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="absolute inset-0 w-full h-full object-cover z-0"
          />
          
          {/* Capa de UI (Controles) - z-index: 10 */}
          {/* pointer-events: none en el contenedor para que el clic pase al video,
              luego pointer-events: auto en los botones individuales */}
          <div className="absolute inset-0 z-10 flex flex-col justify-between p-4 pointer-events-none">
            
            {/* Chip de estado en la parte superior */}
            <div className="w-full flex justify-center mt-4 pointer-events-auto">
              <div className="grid-overlay"></div>
              {analysisState === 'analyzing' && <M3Chip label="Analizando..." />}
              {analysisState === 'complete' && analysisResult && (
                <M3Chip label={`Resultado: ${analysisResult.type} (Factor: ${analysisResult.factor})`} />
              )}
            </div>

            {/* Controles flotantes en la parte inferior */}
            <div className="w-full flex justify-center items-center pb-8 pointer-events-auto">
              {analysisState !== 'complete' ? (
                <button
                  onClick={analyzeGranulometry}
                  disabled={analysisState === 'analyzing'}
                  className={clsx(
                    "w-20 h-20 bg-primary text-on-primary rounded-full flex items-center justify-center shadow-2xl transform active:scale-95 transition-transform pointer-events-auto",
                    { "border-2 border-red-500": isDevelopment }
                  )}
                  aria-label="Analizar granulometría"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-9 w-9" viewBox="0 0 24 24" fill="currentColor"><path d="M9.75 10.5a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-1.5 0v-2.25a.75.75 0 0 1 .75-.75Zm3 0a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-1.5 0v-2.25a.75.75 0 0 1 .75-.75Zm3 0a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-1.5 0v-2.25a.75.75 0 0 1 .75-.75ZM4.5 9a3 3 0 0 0-3 3v6a3 3 0 0 0 3 3h15a3 3 0 0 0 3-3v-6a3 3 0 0 0-3-3h-15Z" clipRule="evenodd" /><path fillRule="evenodd" d="M8.25 3.75A2.25 2.25 0 0 1 10.5 1.5h3A2.25 2.25 0 0 1 15.75 3.75v.75h-7.5v-.75Z" clipRule="evenodd" /></svg>
                </button>
              ) : (
                <div className="flex items-center gap-4 bg-[rgba(28,27,31,0.8)] p-4 rounded-2xl backdrop-blur-sm pointer-events-auto"> {/* Contenedor para botones secundarios */}
                  <button onClick={() => setAnalysisState('idle')} className={clsx("bg-secondary-container text-on-secondary-container px-6 rounded-full font-bold min-h-[48px] flex items-center justify-center pointer-events-auto", { "border-2 border-red-500": isDevelopment })}>Reintentar</button>
                  <button onClick={handleAcceptAnalysis} className={clsx("bg-primary text-on-primary px-8 rounded-full font-bold min-h-[48px] flex items-center justify-center pointer-events-auto", { "border-2 border-red-500": isDevelopment })}>Aceptar</button>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center h-full relative z-[999]"> {/* Contenedor del mensaje de error con z-index: 999 */}
          {error ? (
            <div className="flex flex-col items-center gap-4 p-8 bg-[rgba(28,27,31,0.8)] rounded-lg backdrop-blur-sm text-center">
              <p className="text-white text-lg font-bold">{error}</p>
              <button
                onClick={enableCamera}
                className={clsx(
                  "bg-primary text-on-primary px-8 py-4 rounded-full font-bold min-h-[48px] flex items-center justify-center text-lg",
                  { "border-2 border-red-500": isDevelopment }
                )}
              >
                REINTENTAR ACCESO A CÁMARA
              </button>
            </div>
          ) : (
            <p className="text-white">{error || 'Iniciando cámara...'}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default VisionAnalyzer;