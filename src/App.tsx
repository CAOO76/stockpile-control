/**
 * Main App Component
 * Material Design 3 + Atkinson Hyperlegible + Framer Motion
 * Transiciones fluidas entre Captura y Dashboard
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FieldRegistrationForm } from './components/FieldRegistrationForm';
import { ResultsDashboard } from './components/ResultsDashboard';
import { dataService, type StockpileData } from './services/DataService';
import { connectivityMonitor } from './utils/offline';
// Los estilos se gestionan ahora vía Tailwind CSS en index.css

type ViewState = 'capture' | 'dashboard';

function App() {
  const [view, setView] = useState<ViewState>('capture');
  const [currentStockpile, setCurrentStockpile] = useState<StockpileData | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

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
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  };

  return (
    <div className="app bg-antigravity-light-bg dark:bg-antigravity-dark-bg text-antigravity-light-text dark:text-antigravity-dark-text min-h-screen flex flex-col transition-colors duration-200 font-sans">
      {/* Header con navegación */}
      <header className="app-header bg-antigravity-light-surface dark:bg-antigravity-dark-surface border-b border-antigravity-light-border dark:border-antigravity-dark-border sticky top-0 z-[100]">
        <div className="header-content max-w-[1200px] mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <h1 className="app-title text-2xl font-bold flex items-center gap-2">
            <span className="material-symbols-rounded text-antigravity-accent">precision_manufacturing</span> Stockpile Control
          </h1>

          <nav className="app-nav flex gap-2">
            <button
              className={`nav-button px-4 py-2 rounded-lg font-medium transition-all duration-200 border
                                ${view === 'capture'
                  ? 'bg-antigravity-accent text-white border-antigravity-accent'
                  : 'bg-transparent text-antigravity-light-text dark:text-antigravity-dark-text border-antigravity-light-border dark:border-antigravity-dark-border hover:bg-antigravity-accent/5'}`}
              onClick={() => setView('capture')}
            >
              Captura
            </button>
            <button
              className={`nav-button px-4 py-2 rounded-lg font-medium transition-all duration-200 border
                                ${view === 'dashboard'
                  ? 'bg-antigravity-accent text-white border-antigravity-accent'
                  : 'bg-transparent text-antigravity-light-text dark:text-antigravity-dark-text border-antigravity-light-border dark:border-antigravity-dark-border hover:bg-antigravity-accent/5'}
                                disabled:opacity-30 disabled:cursor-not-allowed`}
              onClick={() => setView('dashboard')}
              disabled={!currentStockpile}
            >
              Dashboard
            </button>
          </nav>

          {/* Indicador de conectividad */}
          <div className={`connectivity-indicator px-3 py-1 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1.5
                        ${isOnline
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
            <span className="material-symbols-rounded text-[14px]">{isOnline ? 'wifi' : 'wifi_off'}</span>
            {isOnline ? 'Online' : 'Offline'}
          </div>
        </div>
      </header>

      {/* Contenido principal con transiciones animadas */}
      <main className="app-main flex-1 max-w-[1200px] w-full mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {view === 'capture' ? (
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
          ) : (
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
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="app-footer bg-antigravity-light-surface dark:bg-antigravity-dark-surface border-t border-antigravity-light-border dark:border-antigravity-dark-border py-6 text-center">
        <p className="footer-text text-xs text-antigravity-light-muted dark:text-antigravity-dark-muted">
          Plugin Stockpile Control v1.0.5 | Región: southamerica-west1 |
          <span className="text-red-500 font-bold ml-2 flex inline-items items-center gap-1 justify-center">
            <span className="material-symbols-rounded text-sm">block</span> App Engine Prohibido
          </span>
        </p>
      </footer>
    </div>
  );
};

export default App;
