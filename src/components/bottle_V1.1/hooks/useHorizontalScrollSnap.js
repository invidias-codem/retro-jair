// src/components/bottle_V1.1/hooks/useHorizontalScrollSnap.js
import { useState, useCallback, useEffect } from 'react';

/**
 * Custom hook to manage horizontal scrolling via state index for snap-to-slide transitions.
 * @param {number} totalSlides - Total number of horizontal slides.
 * @returns {{ activeIndex: number, goToNext: Function, goToPrev: Function, goToIndex: Function }}
 */
export const useHorizontalScrollSnap = (totalSlides) => {
  const [activeIndex, setActiveIndex] = useState(0);

  // Set up keyboard listeners (ArrowRight/ArrowLeft)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' && activeIndex < totalSlides - 1) {
        setActiveIndex(prev => prev + 1);
      } else if (e.key === 'ArrowLeft' && activeIndex > 0) {
        setActiveIndex(prev => prev - 1);
      }
    };
    
    // Disable native arrow key scrolling when this is active
    const preventDefault = (e) => {
        if (['ArrowRight', 'ArrowLeft', 'Space'].includes(e.key)) {
            e.preventDefault();
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keydown', preventDefault);

    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keydown', preventDefault);
    };
  }, [activeIndex, totalSlides]);

  const goToNext = useCallback(() => {
    setActiveIndex(prev => Math.min(prev + 1, totalSlides - 1));
  }, [totalSlides]);

  const goToPrev = useCallback(() => {
    setActiveIndex(prev => Math.max(prev - 1, 0));
  }, []);
  
  const goToIndex = useCallback((index) => {
    setActiveIndex(Math.min(Math.max(0, index), totalSlides - 1));
  }, [totalSlides]);

  return { activeIndex, goToNext, goToPrev, goToIndex };
};