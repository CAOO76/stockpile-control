import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import StockpileControlPlugin from './plugin';
import { MockSecureContext, isStandalone } from './services/sdk-mock';

import { enableOfflinePersistence } from './config/firebase.config';

// Inicialización automática para Standalone/Dev
if (isStandalone()) {
  console.log('🔧 Modo Standalone detectado: Inicializando Mock SDK...');

  // Habilitar persistencia offline
  enableOfflinePersistence().then((enabled) => {
    console.log(`📡 Offline Mode: ${enabled ? 'ENABLED' : 'DISABLED'}`);
  });

  StockpileControlPlugin.onInit(MockSecureContext).then(() => {
    StockpileControlPlugin.onActivate();
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
