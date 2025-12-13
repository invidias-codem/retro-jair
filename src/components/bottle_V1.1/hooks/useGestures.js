import { useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for handling mobile gestures (long-press, swipe, double-tap).
 * Provides callbacks for different gesture types.
 */
export const useGestures = ({
  onLongPress,
  onSwipeLeft,
  onSwipeRight,
  onDoubleTap,
  longPressDuration = 500,
  swipeThreshold = 50,
}) => {
  const elementRef = useRef(null);
  const touchStartRef = useRef(null);
  const longPressTimerRef = useRef(null);
  const lastTapRef = useRef(0);

  // Long-press handler
  const handleTouchStart = useCallback((e) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      timestamp: Date.now(),
    };

    // Set long-press timer
    if (onLongPress) {
      longPressTimerRef.current = setTimeout(() => {
        onLongPress(e);
      }, longPressDuration);
    }
  }, [onLongPress, longPressDuration]);

  // Swipe and double-tap handler
  const handleTouchEnd = useCallback((e) => {
    if (!touchStartRef.current) return;

    const touchEnd = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY,
      timestamp: Date.now(),
    };

    const deltaX = touchEnd.x - touchStartRef.current.x;
    const deltaY = touchEnd.y - touchStartRef.current.y;
    const deltaTime = touchEnd.timestamp - touchStartRef.current.timestamp;

    // Clear long-press timer if touch ended quickly
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }

    // Detect swipe (horizontal movement > threshold, vertical < threshold)
    if (Math.abs(deltaX) > swipeThreshold && Math.abs(deltaY) < swipeThreshold) {
      if (deltaX < 0 && onSwipeLeft) {
        onSwipeLeft(e);
      } else if (deltaX > 0 && onSwipeRight) {
        onSwipeRight(e);
      }
    }

    // Detect double-tap
    const now = Date.now();
    if (now - lastTapRef.current < 300 && onDoubleTap) {
      onDoubleTap(e);
    }
    lastTapRef.current = now;

    touchStartRef.current = null;
  }, [onSwipeLeft, onSwipeRight, onDoubleTap, swipeThreshold]);

  // Attach event listeners
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, [handleTouchStart, handleTouchEnd]);

  return elementRef;
};

export default useGestures;
