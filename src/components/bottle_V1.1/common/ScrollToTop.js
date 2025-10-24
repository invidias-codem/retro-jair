// src/components/bottle_V1.1/common/ScrollToTop.js
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll the window to the top (0, 0) whenever the pathname changes
    window.scrollTo(0, 0); 
  }, [pathname]); // Dependency array ensures this runs only when the route changes

  return null; // This component doesn't render anything visible
}

export default ScrollToTop;