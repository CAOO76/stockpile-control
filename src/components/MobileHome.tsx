import React from 'react';

interface MobileHomeProps {
    onStartNewScan: () => void;
    onViewRecords: () => void;
}

/**
 * MobileHome - Pantalla de inicio de PRECISIÓN para STOCKPILE-CONTROL.
 * Diseño: Herramienta Industrial, Minimalismo Extremo.
 * Background: #0C0C0C (Negro Puro).
 * Tipografía: Atkinson Hyperlegible.
 * Sin redundancias, sin indicadores ficticios.
 */
export const MobileHome: React.FC<MobileHomeProps> = ({ onStartNewScan, onViewRecords }) => {
    return (
        <main className="h-screen w-screen bg-black flex flex-col font-atkinson text-white overflow-hidden select-none">
            {/* Header Branding - Static for stability */}
            <header className="relative z-10 pt-16 pb-8 landscape:pt-8 landscape:pb-4 flex flex-col items-center">
                <span className="material-symbols-outlined text-primary text-6xl mb-2 landscape:text-4xl transition-all">landscape</span>
                <h1 className="text-xs font-bold tracking-[0.5em] uppercase text-white/90 landscape:text-[10px]">STOCKPILE-CONTROL</h1>
            </header>

            {/* Ergonomic Action Zone (Industrial Standards: 96px targets) */}
            <section className="relative z-10 flex-1 flex flex-col landscape:flex-row items-center justify-center p-8 landscape:p-12 gap-12 landscape:gap-24 pb-24 landscape:pb-12 text-center">

                {/* Secondary: STOCK (Now First) */}
                <button
                    onClick={onViewRecords}
                    className="flex flex-col items-center space-y-4 active:scale-90 transition-all group"
                    aria-label="Ver registros de stock"
                >
                    <div className="w-32 h-32 landscape:w-28 landscape:h-28 flex items-center justify-center rounded-full bg-white/5 border-2 border-white/10 group-active:bg-white/10 group-active:border-white transition-colors overflow-hidden">
                        <span className="material-symbols-outlined text-[64px] landscape:text-[56px] text-white/40 group-active:text-white transition-all">list_alt</span>
                    </div>
                    <span className="text-xs font-bold uppercase tracking-[0.3em] text-white/30 group-active:text-white">Stock</span>
                </button>

                {/* Primary: NUEVO REGISTRO (Now Second) */}
                <button
                    onClick={onStartNewScan}
                    className="flex flex-col items-center space-y-4 active:scale-90 transition-all group"
                    aria-label="Iniciar nuevo registro de acopio"
                >
                    <div className="w-32 h-32 landscape:w-28 landscape:h-28 flex items-center justify-center rounded-full bg-primary/5 border-2 border-primary/20 group-active:bg-primary/20 group-active:border-primary transition-colors overflow-hidden">
                        <span className="material-symbols-outlined text-[64px] landscape:text-[56px] font-bold text-primary transition-all">list_alt_add</span>
                    </div>
                    <span className="text-xs font-bold uppercase tracking-[0.3em] text-primary group-active:text-white">Nuevo Registro</span>
                </button>

            </section>

            {/* Industrial Version Footer */}
            <footer className="relative z-10 pb-8 flex justify-center items-center">
                <div className="flex items-center space-x-4">
                    <div className="h-[1px] w-8 bg-white/5"></div>
                    <span className="text-[10px] text-white/10 font-bold uppercase tracking-[0.6em]">FIELD_V2.0_PRO</span>
                    <div className="h-[1px] w-8 bg-white/5"></div>
                </div>
            </footer>
        </main>
    );
};
