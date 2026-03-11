import { useState, useEffect } from 'react';

/**
 * Hook to manage and detect the current theme (light or dark).
 * It listens for changes in the 'dark' class on the document root or body.
 */
export function useTheme() {
    const [isDark, setIsDark] = useState(() => 
        document.documentElement.classList.contains('dark') || 
        document.body.classList.contains('dark') ||
        window.matchMedia('(prefers-color-scheme: dark)').matches
    );

    useEffect(() => {
        // Observer to detect class changes on <html> or <body>
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const hasDark = document.documentElement.classList.contains('dark') || 
                                   document.body.classList.contains('dark');
                    setIsDark(hasDark);
                }
            });
        });

        observer.observe(document.documentElement, { attributes: true });
        observer.observe(document.body, { attributes: true });

        // Listen for system theme changes if no manual class is set
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleSystemChange = (e: MediaQueryListEvent) => {
            const hasClass = document.documentElement.classList.contains('dark') || 
                            document.body.classList.contains('dark');
            if (!hasClass) {
                setIsDark(e.matches);
            }
        };

        mediaQuery.addEventListener('change', handleSystemChange);

        return () => {
            observer.disconnect();
            mediaQuery.removeEventListener('change', handleSystemChange);
        };
    }, []);

    const toggleTheme = () => {
        const newDark = !isDark;
        if (newDark) {
            document.documentElement.classList.add('dark');
            document.body.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
            document.body.classList.remove('dark');
        }
        setIsDark(newDark);
    };

    // Detect if running standalone (dev) or inside MINREPORT host
    const isDev = !(window as any).minreport;

    return { isDark, theme: isDark ? 'dark' : 'light', toggleTheme, isDev };
}
