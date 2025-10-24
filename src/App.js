// src/App.js
import React, { useState, useEffect, Suspense, useCallback } from 'react';
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Link,
  useLocation,
} from 'react-router-dom';
import { useTransition, animated } from '@react-spring/web';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faTimes } from '@fortawesome/free-solid-svg-icons';

// --- Custom Hooks ---
import { useOrientation } from './components/bottle_V1.1/hooks/useOrientation';

// --- Core Components ---
import Menu from './components/bottle_V1.1/Main/Menu';
import Footer from './components/bottle_V1.1/Footer/Footer';
import { ChatProvider } from './components/bottle_V1.1/context/useContext';
import ScrollToTop from './components/bottle_V1.1/common/ScrollToTop';

// --- Lazy-Loaded Page Components ---
const Home = React.lazy(() => import('./components/bottle_V1.1/Main/Home')); // <-- ADDED HOME LAZY LOAD
const AboutMe = React.lazy(() => import('./components/bottle_V1.1/AboutMe/AboutMe'));
const Projects = React.lazy(() => import('./components/bottle_V1.1/Projects/Projects'));
const Skills = React.lazy(() => import('./components/bottle_V1.1/Skills/Skills'));
const Contact = React.lazy(() => import('./components/bottle_V1.1/ContactMe/Contact'));
const Terminal = React.lazy(() => import('./components/bottle_V1.1/routes/Terminal/Terminal'));
const Services = React.lazy(() => import('./components/bottle_V1.1/Services/Service'));
const ChatInterface = React.lazy(() => import('./components/bottle_V1.1/AI_components/ChatInterface'));

// --- Framework Providers ---
const AgentSessionProvider = React.lazy(() =>
  import('./components/bottle_V1.1/AI_components/framework/agentFramework').then(m => ({ default: m.AgentSessionProvider }))
);

// --- Styles ---
import './App.css';

// --- AnimatedRoutes Component ---
function AnimatedRoutes() {
  const location = useLocation();
  const [isMotionReduced] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  const transitions = useTransition(location, {
    from: { opacity: 0, transform: 'translateY(30px)' },
    enter: { opacity: 1, transform: 'translateY(0px)' },
    leave: { opacity: 0, transform: 'translateY(-30px)' },
    config: { tension: 220, friction: 20 },
    immediate: isMotionReduced,
  });

  return transitions((props, item) => (
    <animated.div style={props} className="animated-route-wrapper">
      <Suspense fallback={<div className="route-fallback" aria-busy="true">Loading Blueprint...</div>}>
        <Routes location={item}>
          <Route path="/" element={<Home />} /> {/* <-- MAPPED ROOT TO HOME */}
          <Route path="/about" element={<AboutMe />} /> {/* <-- KEPT ABOUTME ON /ABOUT */}
          <Route path="/projects" element={<Projects />} />
          <Route path="/skills" element={<Skills />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/terminal" element={<Terminal />} />
          <Route path="/services" element={<Services />} />
          <Route
            path="/chat"
            element={
              <Suspense fallback={<div>Loading Chat Framework...</div>}>
                <AgentSessionProvider>
                  <ChatInterface />
                </AgentSessionProvider>
              </Suspense>
            }
          />
        </Routes>
      </Suspense>
    </animated.div>
  ));
}

// --- Main App Component ---
function App() {
  const orientation = useOrientation();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) {
        setIsMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleMenu = useCallback(() => {
    setIsMenuOpen(prev => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  return (
    <ChatProvider>
      <Router> {/* Renamed BrowserRouter import */}
         <ScrollToTop /> {/* <-- 2. ADD COMPONENT HERE */}
        <div id="appContainer" className={`${orientation}-orientation`}>
          <header id="appHeader">
             {/* ... (keep existing header content) */}
            <Link to="/" id="appHeaderLink" onClick={closeMenu}>
              J.M. Portfolio
            </Link>
            {isMobile && (
              <button
                id="menuToggle"
                onClick={toggleMenu}
                aria-label={isMenuOpen ? 'Close Menu' : 'Open Menu'}
                aria-expanded={isMenuOpen}
              >
                <FontAwesomeIcon icon={isMenuOpen ? faTimes : faBars} />
              </button>
            )}
          </header>

          <main id="appMain">
            <aside id="appSidebar" className={isMobile && isMenuOpen ? 'show' : ''}>
              <Menu onItemClick={isMobile ? closeMenu : undefined} />
            </aside>
            <div id="appContent">
              <AnimatedRoutes />
            </div>
          </main>

          <Footer />
        </div>
      </Router>
    </ChatProvider>
  );
}

export default App;