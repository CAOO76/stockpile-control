/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                sans: ['"Atkinson Hyperlegible"', 'sans-serif'],
                atkinson: ['"Atkinson Hyperlegible"', 'sans-serif'],
            },
            colors: {
                // Elite Industrial Minimalism Palette (Copper #C68346)
                primary: 'var(--antigravity-accent)',           // Copper (MINREPORT Standard)
                secondary: '#1e88e5',         // Steel Blue
                success: '#43a047',           // Industrial Green  
                warning: '#fdd835',           // Safety Yellow
                error: '#e53935',             // Alert Red

                // Backgrounds (Pure Solid Colors)
                'bg-dark': '#000000',         // Pure Black
                charcoal: '#1a1a1a',          // Charcoal Gray
                'nav-bg': '#121212',          // Navigation Background
                'bg-light': '#ffffff',        // Pure White
                'bg-light-gray': '#f5f5f5',   // Light Gray

                // Legacy support for existing components
                'background-light': '#f6f6f8',
                'background-dark': '#101622',
                antigravity: {
                    light: {
                        bg: '#f6f6f8',
                        surface: '#ffffff',
                        text: '#1f2937',
                        muted: '#6b7280',
                        border: '#d1d5db',      // gray-300 — clearly visible on white
                        input: '#9ca3af',       // gray-400 — high contrast for inputs
                    },
                    dark: {
                        bg: '#000000',
                        surface: '#1a1a1a',
                        text: '#ffffff',
                        muted: '#8b949e',
                        border: '#30363d',
                    },
                    accent: 'var(--antigravity-accent)',
                }
            },
            borderRadius: {
                'industrial': '0px',          // Elite Industrial Minimalism (Sharp)
                DEFAULT: '0px',
                lg: '0px',
                xl: '0px',
            },
            boxShadow: {
                DEFAULT: 'none',
            }
        },
    },
    plugins: [],
}
