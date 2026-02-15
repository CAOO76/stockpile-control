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
                // Industrial Mining Palette (Flat Colors Only)
                primary: '#ff6b00',           // Deep Amber (Mining Industry Standard)
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
                        border: '#e5e7eb',
                    },
                    dark: {
                        bg: '#000000',
                        surface: '#1a1a1a',
                        text: '#ffffff',
                        muted: '#8b949e',
                        border: '#30363d',
                    },
                    accent: '#ff6b00',
                }
            },
            borderRadius: {
                'industrial': '4px',          // Sharp Industrial Edges
                DEFAULT: '4px',
                lg: '4px',
                xl: '6px',
            },
            boxShadow: {
                DEFAULT: 'none',
            }
        },
    },
    plugins: [],
}
