import React from 'react';
import { motion } from 'framer-motion';

export type GeometryType = 'CONO_ELIPTICO' | 'CONO_ELIPTICO_TRUNCADO' | 'CONO_TRUNCADO_PERIMETRO';

interface GeometrySelectionProps {
    onSelection: (type: GeometryType) => void;
    onBack: () => void;
}

/**
 * GeometrySelection - INTERFAZ INDUSTRIAL (STITCH)
 * Selección de tipo de sólido para cubicación manual.
 */
export const GeometrySelection: React.FC<GeometrySelectionProps> = ({ onSelection, onBack }) => {
    return (
        <motion.main
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-screen w-screen bg-black flex flex-col font-atkinson text-white overflow-hidden select-none relative"
        >
            {/* Header Técnico */}
            <header className="absolute top-0 left-0 w-full pt-14 pb-4 px-6 flex items-center justify-between z-50 bg-gradient-to-b from-black/80 to-transparent">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center active:scale-90 transition-transform">
                        <span className="material-symbols-outlined text-3xl text-primary">arrow_back</span>
                    </button>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black tracking-[0.4em] uppercase text-white/20">GEOMETRÍA</span>
                        <span className="text-xl font-black tracking-tight text-white/90">DEL SÓLIDO</span>
                    </div>
                </div>
                <div className="w-12 h-12 flex items-center justify-center opacity-20">
                    <span className="material-symbols-outlined text-3xl">landscape</span>
                </div>
            </header>

            {/* Technical Grid Background */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
            </div>

            {/* Selection Grid */}
            <section className="flex-1 flex flex-col items-center justify-center p-8 gap-8 z-10">

                {/* 1º CONO ELÍPTICO */}
                <button
                    onClick={() => onSelection('CONO_ELIPTICO')}
                    className="w-full max-w-xs h-24 bg-white/5 border border-white/10 rounded-2xl flex items-center px-6 gap-6 active:scale-95 active:bg-primary active:text-black transition-all group"
                >
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center group-active:bg-black/20">
                        <span className="material-symbols-outlined text-3xl text-primary group-active:text-black">category</span>
                    </div>
                    <div className="flex flex-col items-start">
                        <span className="text-[10px] font-black tracking-widest text-white/30">1º OPCIÓN</span>
                        <span className="text-lg font-black tracking-tight">CONO ELÍPTICO</span>
                    </div>
                </button>

                {/* 2º CONO ELÍPTICO TRUNCADO */}
                <button
                    onClick={() => onSelection('CONO_ELIPTICO_TRUNCADO')}
                    className="w-full max-w-xs h-24 bg-white/5 border border-white/10 rounded-2xl flex items-center px-6 gap-6 active:scale-95 active:bg-primary active:text-black transition-all group"
                >
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center group-active:bg-black/20">
                        <span className="material-symbols-outlined text-3xl text-primary group-active:text-black">layers</span>
                    </div>
                    <div className="flex flex-col items-start">
                        <span className="text-[10px] font-black tracking-widest text-white/30">2º OPCIÓN</span>
                        <span className="text-lg font-black tracking-tight">CONO ELÍPTICO TRUNCADO</span>
                    </div>
                </button>

                {/* 3º CONO TRUNCADO POR PERÍMETRO */}
                <button
                    onClick={() => onSelection('CONO_TRUNCADO_PERIMETRO')}
                    className="w-full max-w-xs h-24 bg-white/5 border border-white/10 rounded-2xl flex items-center px-6 gap-6 active:scale-95 active:bg-primary active:text-black transition-all group"
                >
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center group-active:bg-black/20">
                        <span className="material-symbols-outlined text-3xl text-primary group-active:text-black">architecture</span>
                    </div>
                    <div className="flex flex-col items-start">
                        <span className="text-[10px] font-black tracking-widest text-white/30">3º OPCIÓN</span>
                        <span className="text-lg font-black tracking-tight leading-tight">CONO ELÍPTICO TRUNCADO POR PERÍMETRO</span>
                    </div>
                </button>

            </section>
        </motion.main>
    );
};
