import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MobileScanner } from './components/MobileScanner';
import { MobileHome } from './components/MobileHome';
import { CaptureSelection } from './components/CaptureSelection';
import { DesktopAnalytics } from './components/DesktopAnalytics';
import VisionAnalyzer from './components/VisionAnalyzer';
import { usePlatform } from './hooks/usePlatform';
import { MainLayout } from './layouts/MainLayout';
import { MockSecureContext } from './services/sdk-mock';
import { ManualCapture } from './components/ManualCapture';
import { StockpileRegistration } from './components/StockpileRegistration';
import { StockpileDashboard } from './components/StockpileDashboard';
import { StockList } from './components/StockList';
import { MeasurementDetail } from './components/MeasurementDetail';
import { GeometrySelection } from './components/GeometrySelection';
import type { GeometryType } from './components/GeometrySelection';


export type ViewState =
  | 'home'
  | 'registration'
  | 'stock_list'
  | 'asset_portada'
  | 'selection'
  | 'geometry_selection'
  | 'capture'
  | 'manual_capture'
  | 'vision'
  | 'results'
  | 'measurement_detail'
  | 'management';

function App() {
  const { isNative } = usePlatform();
  const [view, setView] = useState<ViewState>('home');
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [selectedMeasurementId, setSelectedMeasurementId] = useState<string | null>(null);
  const [selectedGeometry, setSelectedGeometry] = useState<GeometryType>('CONO_ELIPTICO');

  // Efecto para establecer la vista inicial
  useEffect(() => {
    if (isNative) {
      setView('home');
    } else {
      setView('management');
    }
  }, [isNative]);

  // --- Handlers de Flujo ---

  const handleStartRegistration = () => setView('registration');

  const handleRegistrationSuccess = (assetId: string) => {
    setSelectedAssetId(assetId);
    setView('asset_portada');
  };

  const handleAddMeasurement = () => setView('selection');

  const handleCaptureSuccess = async (measurementId: string) => {
    console.log('[App] Capture Success:', measurementId);
    // Al capturar éxito (Manual/Digital), volvemos a la portada del activo para ver el resultado consolidado
    setView('asset_portada');
  };

  const handleAnalysisComplete = (result: { type: string; image: string }) => {
    console.log('[App] Vision analysis complete:', result);
    // Aquí podrías navegar a resultados o guardar directamente
    setView('asset_portada');
  };

  const pageVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  // VERSIÓN MÓVIL
  if (isNative) {
    return (
      <div className="relative h-screen w-screen overflow-hidden bg-black">
        <AnimatePresence mode="wait">
          {view === 'home' && (
            <motion.div key="home" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="h-full w-full">
              <MobileHome
                onStartNewScan={handleStartRegistration}
                onViewRecords={() => setView('stock_list')}
              />
            </motion.div>
          )}

          {view === 'registration' && (
            <motion.div key="reg" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="h-full w-full">
              <StockpileRegistration
                onSuccess={handleRegistrationSuccess}
                onCancel={() => setView('home')}
              />
            </motion.div>
          )}

          {view === 'stock_list' && (
            <motion.div key="list" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="h-full w-full">
              <StockList
                onSelectAsset={(id) => {
                  setSelectedAssetId(id);
                  setView('asset_portada');
                }}
                onBack={() => setView('home')}
              />
            </motion.div>
          )}

          {view === 'asset_portada' && selectedAssetId && (
            <motion.div key="portada" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="h-full w-full">
              <StockpileDashboard
                assetId={selectedAssetId}
                onAddMeasurement={handleAddMeasurement}
                onSelectMeasurement={(mid) => {
                  setSelectedMeasurementId(mid);
                  setView('measurement_detail');
                }}
                onBack={() => setView('home')}
              />
            </motion.div>
          )}

          {view === 'selection' && (
            <motion.div key="selection" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="h-full w-full">
              <CaptureSelection
                onSelection={(type) => {
                  if (type === 'digital') setView('capture');
                  else setView('geometry_selection');
                }}
                onBack={() => setView('asset_portada')}
              />
            </motion.div>
          )}

          {view === 'geometry_selection' && (
            <motion.div key="geometry" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="h-full w-full">
              <GeometrySelection
                onSelection={(type) => {
                  setSelectedGeometry(type);
                  setView('manual_capture');
                }}
                onBack={() => setView('selection')}
              />
            </motion.div>
          )}

          {view === 'capture' && selectedAssetId && (
            <motion.div key="capture" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="h-full w-full">
              <MobileScanner
                assetId={selectedAssetId}
                onSuccess={handleCaptureSuccess}
                onBack={() => setView('selection')}
              />
            </motion.div>
          )}

          {view === 'manual_capture' && selectedAssetId && (
            <motion.div key="manual" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="h-full w-full">
              <ManualCapture
                assetId={selectedAssetId}
                initialGeometry={selectedGeometry}
                onSuccess={handleCaptureSuccess}
                onBack={() => setView('geometry_selection')}
              />
            </motion.div>
          )}

          {view === 'measurement_detail' && selectedMeasurementId && (
            <motion.div key="detail" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="h-full w-full">
              <MeasurementDetail
                measurementId={selectedMeasurementId}
                onBack={() => setView('asset_portada')}
              />
            </motion.div>
          )}

          {view === 'vision' && (
            <motion.div key="vision" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="h-full w-full">
              <VisionAnalyzer context={MockSecureContext} onAnalysisComplete={handleAnalysisComplete} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // VERSIÓN WEB: CON MainLayout (plugin embebido)
  return (
    <MainLayout
      view={view as any}
      setView={setView as any}
      hasActiveStockpile={!!selectedAssetId}
    >
      <DesktopAnalytics />
    </MainLayout>
  );
}

export default App;
