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
import './styles/m3-theme.css';
import './App.css';

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
    <div className="app">
      {/* Header con navegación */}
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">🏗️ Stockpile Control</h1>

          <nav className="app-nav">
            <button
              className={`nav-button ${view === 'capture' ? 'active' : ''}`}
              onClick={() => setView('capture')}
            >
              Captura
            </button>
            <button
              className={`nav-button ${view === 'dashboard' ? 'active' : ''}`}
              onClick={() => setView('dashboard')}
              disabled={!currentStockpile}
            >
              Dashboard
            </button>
          </nav>

          {/* Indicador de conectividad */}
          <div className={`connectivity-indicator ${isOnline ? 'online' : 'offline'}`}>
            {isOnline ? '🟢 Online' : '🔴 Offline'}
          </div>
        </div>
      </header>

      {/* Contenido principal con transiciones animadas */}
      <main className="app-main">
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
      <footer className="app-footer">
        <p className="footer-text">
          Plugin Stockpile Control v1.0.0 | Región: southamerica-west1 |
          <span className="footer-warning"> ⛔ App Engine Prohibido</span>
        </p>
      </footer>
    </div>
  );
}

export default App;
