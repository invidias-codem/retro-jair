// src/components/bottle_V1.1/hooks/useScrollProgress.js

import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook to track the vertical scroll progress of a window/document.
 * Returns a value between 0 (top) and 1 (bottom).
 * Uses passive event listeners for high performance.
 * @returns {number} The scroll progress (0 to 1).
 */
export const useScrollProgress = () => {
    const [scrollProgress, setScrollProgress] = useState(0);

    const calculateScrollProgress = useCallback(() => {
        // Use window.scrollY for scroll position and document.documentElement for dimensions
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;

        if (scrollHeight === 0) {
            setScrollProgress(0);
        } else {
            const progress = scrollTop / scrollHeight;
            // Clamp the value between 0 and 1
            setScrollProgress(Math.min(1, Math.max(0, progress)));
        }
    }, []);

    useEffect(() => {
        calculateScrollProgress(); 
        // Use { passive: true } for optimal mobile scrolling performance
        window.addEventListener('scroll', calculateScrollProgress, { passive: true });

        return () => {
            window.removeEventListener('scroll', calculateScrollProgress);
        };
    }, [calculateScrollProgress]);

    return scrollProgress;
};

export default useScrollProgress;