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
            },
            colors: {
                antigravity: {
                    light: {
                        bg: '#f3f3f3',
                        surface: '#ffffff',
                        text: '#1f2937',
                        muted: '#6b7280',
                        border: '#e5e7eb',
                    },
                    dark: {
                        bg: '#1f1f1f',
                        surface: '#181818',
                        text: '#e6edf3',
                        muted: '#8b949e',
                        border: '#30363d',
                    },
                    accent: '#007fd4',
                }
            },
            boxShadow: {
                DEFAULT: 'none',
            }
        },
    },
    plugins: [],
}
