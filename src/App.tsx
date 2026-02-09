/**
 * Main App Component
 * Material Design 3 + Atkinson Hyperlegible + Framer Motion
 * Transiciones fluidas entre Captura y Dashboard
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FieldRegistrationForm } from './components/FieldRegistrationForm';
import { ResultsDashboard } from './components/ResultsDashboard';
import { DesktopAnalytics } from './components/DesktopAnalytics';
import VisionAnalyzer from './components/VisionAnalyzer'; // <-- 1. Importar componente
import { dataService, type StockpileData } from './services/DataService';
import { connectivityMonitor } from './utils/offline';
// Los estilos se gestionan ahora vía Tailwind CSS en index.css

type ViewState = 'capture' | 'dashboard' | 'management' | 'vision'; // <-- 2. Añadir nuevo estado de vista

function App() {
  const [view, setView] = useState<ViewState>('capture');
  const [currentStockpile, setCurrentStockpile] = useState<StockpileData | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // 5. Mock del SDK Context para VisionAnalyzer
  const mockSdk = {
    storage: {
      write: (key: string, value: any) => {
        console.log(`[SDK Mock] Writing to key '${key}':`, value);
        localStorage.setItem(key, JSON.stringify(value));
        return Promise.resolve();
      },
    },
  };

  const handleAnalysisComplete = (result: { factor: number; image: string }) => {
    console.log('[App] Analysis complete:', result);
    // Podrías usar este resultado para actualizar otro estado o navegar.
    // Por ahora, volvemos a la vista de captura.
    setView('capture');
  };

  useEffect(() => {
    // Suscribirse a cambios de conectividad
    const unsubscribe = connectivityMonitor.subscribe((state) => {
      setIsOnline(state.online);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleScanSuccess = async (stockpileId: string) => {
    // Obtener datos del stockpile guardado
    const data = await dataService.getStockpileData(stockpileId);

    if (data) {
      setCurrentStockpile(data);
      setView('dashboard');
    }
  };

  const handleNewScan = () => {
    setCurrentStockpile(null);
    setView('capture');
  };

  // Variantes de animación para Framer Motion
  const pageVariants = {
    initial: { opacity: 0, scale: 0.98 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.02 },
  };

  return (
    <div className="app bg-antigravity-light-bg dark:bg-antigravity-dark-bg text-antigravity-light-text dark:text-antigravity-dark-text min-h-screen flex flex-col transition-colors duration-200 font-sans">
      {/* Header con navegación */}
      <header className="app-header bg-antigravity-light-surface dark:bg-antigravity-dark-surface border-b border-antigravity-light-border dark:border-antigravity-dark-border sticky top-0 z-[100]">
        <div className="header-content max-w-[1240px] mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <h1 className="app-title text-2xl font-bold flex items-center gap-2">
            <span className="material-symbols-rounded text-antigravity-accent">precision_manufacturing</span> Stockpile Control
          </h1>

          <nav className="app-nav flex gap-2">
            <button
              className={`nav-button px-4 py-2 rounded-xl font-medium transition-all duration-200 border flex items-center gap-2
                                ${view === 'capture'
                  ? 'bg-antigravity-accent text-white border-antigravity-accent shadow-lg shadow-antigravity-accent/20'
                  : 'bg-transparent text-antigravity-light-text dark:text-antigravity-dark-text border-antigravity-light-border dark:border-antigravity-dark-border hover:bg-antigravity-accent/5'}`}
              onClick={() => setView('capture')}
            >
              <span className="material-symbols-rounded text-sm">qr_code_scanner</span> Captura
            </button>
            {/* <-- 3. Botón para nueva vista de Visión --> */}
            <button
              className={`nav-button px-4 py-2 rounded-xl font-medium transition-all duration-200 border flex items-center gap-2
                                ${view === 'vision'
                  ? 'bg-antigravity-accent text-white border-antigravity-accent shadow-lg shadow-antigravity-accent/20'
                  : 'bg-transparent text-antigravity-light-text dark:text-antigravity-dark-text border-antigravity-light-border dark:border-antigravity-dark-border hover:bg-antigravity-accent/5'}`}
              onClick={() => setView('vision')}
            >
              <span className="material-symbols-rounded text-sm">camera</span> Visión
            </button>
            <button
              className={`nav-button px-4 py-2 rounded-xl font-medium transition-all duration-200 border flex items-center gap-2
                                ${view === 'dashboard'
                  ? 'bg-antigravity-accent text-white border-antigravity-accent shadow-lg shadow-antigravity-accent/20'
                  : 'bg-transparent text-antigravity-light-text dark:text-antigravity-dark-text border-antigravity-light-border dark:border-antigravity-dark-border hover:bg-antigravity-accent/5'}
                                disabled:opacity-30 disabled:cursor-not-allowed`}
              onClick={() => setView('dashboard')}
              disabled={!currentStockpile}
            >
              <span className="material-symbols-rounded text-sm">dashboard</span> Dashboard
            </button>
            <button
              className={`nav-button px-4 py-2 rounded-xl font-medium transition-all duration-200 border flex items-center gap-2
                                ${view === 'management'
                  ? 'bg-antigravity-accent text-white border-antigravity-accent shadow-lg shadow-antigravity-accent/20'
                  : 'bg-transparent text-antigravity-light-text dark:text-antigravity-dark-text border-antigravity-light-border dark:border-antigravity-dark-border hover:bg-antigravity-accent/5'}`}
              onClick={() => setView('management')}
            >
              <span className="material-symbols-rounded text-sm">inventory_2</span> Gestión
            </button>
          </nav>

          {/* Indicador de conectividad */}
          <div className={`connectivity-indicator px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5
                        ${isOnline
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
            {isOnline ? 'En Línea' : 'Sin Conexión'}
          </div>
        </div>
      </header>

      {/* Contenido principal con transiciones animadas */}
      <main className={`app-main flex-1 w-full mx-auto ${view === 'management' || view === 'vision' ? 'max-w-full px-0 py-0' : 'max-w-[1200px] px-4 py-8'}`}>
        <AnimatePresence mode="wait">
          {view === 'capture' && (
            <motion.div
              key="capture"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <FieldRegistrationForm onSuccess={handleScanSuccess} />
            </motion.div>
          )}
          {/* <-- 4. Renderizado del nuevo componente --> */}
          {view === 'vision' && (
            <motion.div
              key="vision"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              <VisionAnalyzer context={mockSdk} onAnalysisComplete={handleAnalysisComplete} />
            </motion.div>
          )}
          {view === 'dashboard' && (
            <motion.div
              key="dashboard"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <ResultsDashboard
                stockpileData={currentStockpile}
                onNewScan={handleNewScan}
              />
            </motion.div>
          )}
          {view === 'management' && (
            <motion.div
              key="management"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              <DesktopAnalytics />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="app-footer bg-antigravity-light-surface dark:bg-antigravity-dark-surface border-t border-antigravity-light-border dark:border-antigravity-dark-border py-4 text-center">
        <p className="footer-text text-[10px] text-antigravity-light-muted dark:text-antigravity-dark-muted tracking-widest uppercase">
          Plugin Stockpile Control v1.0.5 | Región: southamerica-west1 | Blindaje Activo
        </p>
      </footer>
    </div>
  );
}

export default App;
