import React, { useState } from 'react';
import { useSyncStatus } from '../utils/syncStatus';
import { motion, AnimatePresence } from 'framer-motion';

export const SyncIndicator: React.FC = () => {
    const { status } = useSyncStatus();
    const [showConfirm, setShowConfirm] = useState(false);

    const handleHardReset = async () => {
        const { hardSyncReset } = await import('../services/sdk-mock');
        await hardSyncReset();
    };

    if (status === 'idle') return null;

    const config = {
        uploading:     { icon: 'cloud_upload',  label: 'Subiendo...',     color: 'text-antigravity-accent' },
        syncing:       { icon: 'cloud_download', label: 'Sincronizando...', color: 'text-blue-400' },
        success:       { icon: 'check_circle',   label: 'Sincronizado',    color: 'text-green-500' },
        error:         { icon: 'error',          label: 'Error de Sync',   color: 'text-red-500' },
        offline:       { icon: 'cloud_off',      label: 'Modo Offline',    color: 'text-zinc-500' },
    }[status] || { icon: 'sync', label: 'Procesando...', color: 'text-zinc-400' };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 50, opacity: 0 }}
                className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2 pointer-events-none"
            >
                <div className="px-4 py-2 bg-antigravity-light-surface/80 dark:bg-antigravity-dark-surface/80 backdrop-blur-md border border-antigravity-light-border dark:border-antigravity-dark-border rounded-full flex items-center gap-3 shadow-2xl pointer-events-auto">
                    <span className={`material-symbols-outlined text-xl ${config.color} ${status === 'uploading' || status === 'syncing' ? 'animate-pulse' : ''}`}>
                        {config.icon}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-antigravity-light-text dark:text-antigravity-dark-text/80">
                        {config.label}
                    </span>

                    {(status === 'success' || status === 'error' || status === 'offline') && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); setShowConfirm(!showConfirm); }}
                            className="ml-2 w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-500/10 transition-colors"
                            title="Limpiar todo (Reset)"
                        >
                            <span className="material-symbols-outlined text-sm text-red-500/40 hover:text-red-500">delete_forever</span>
                        </button>
                    )}
                </div>

                {showConfirm && (
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-red-500 text-white px-4 py-2 rounded-lg shadow-xl flex items-center gap-4 border border-red-600 pointer-events-auto"
                    >
                        <span className="text-[10px] font-bold uppercase tracking-tighter">¿BORRAR TODO (NUBE + LOCAL)?</span>
                        <div className="flex gap-2">
                            <button onClick={handleHardReset} className="bg-white text-red-500 px-2 py-1 rounded text-[10px] font-black hover:bg-zinc-100 uppercase">SÍ</button>
                            <button onClick={() => setShowConfirm(false)} className="text-white/60 text-[10px] font-bold uppercase">NO</button>
                        </div>
                    </motion.div>
                )}
            </motion.div>
        </AnimatePresence>
    );
};
