import { useState, useEffect } from 'react';

// This function checks if the window height is greater than its width.
const getOrientation = () => {
  if (typeof window === 'undefined') {
    return 'portrait'; // Default for server-side rendering
  }
  return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
};

/**
 * A custom React hook that returns the current screen orientation.
 * @returns {'portrait' | 'landscape'} The current orientation.
 */
export const useOrientation = () => {
  const [orientation, setOrientation] = useState(getOrientation());

  useEffect(() => {
    const handleResize = () => {
      setOrientation(getOrientation());
    };

    // Listen for window resize events to detect orientation changes
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return orientation;
};