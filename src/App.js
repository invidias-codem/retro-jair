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
import Header from './components/bottle_V1.1/common/Header';
import './components/bottle_V1.1/common/Header.css';

// --- Lazy-Loaded Page Components ---
const Home = React.lazy(() => import('./components/bottle_V1.1/Main/Home')); // <-- ADDED HOME LAZY LOAD
const AboutMe = React.lazy(() => import('./components/bottle_V1.1/AboutMe/AboutMe'));
const Projects = React.lazy(() => import('./components/bottle_V1.1/Projects/Projects'));
const Skills = React.lazy(() => import('./components/bottle_V1.1/Skills/Skills'));
const Contact = React.lazy(() => import('./components/bottle_V1.1/ContactMe/Contact'));
const Terminal = React.lazy(() => import('./components/bottle_V1.1/routes/Terminal/Terminal'));
const Services = React.lazy(() => import('./components/bottle_V1.1/Services/Service'));
const ChatInterface = React.lazy(() => import('./components/bottle_V1.1/AI_components/ChatInterface'));
const ChatModal = React.lazy(() => import('./components/bottle_V1.1/AI_components/ChatModal')); // Import ChatModal
const ChatRoute = React.lazy(() => import('./components/bottle_V1.1/AI_components/ChatRoute'));
const Settings = React.lazy(() => import('./components/bottle_V1.1/routes/Settings/Settings'));

// --- Framework Providers ---
const AgentSessionProvider = React.lazy(() =>
  import('./components/bottle_V1.1/AI_components/framework/agentFramework').then(m => ({ default: m.AgentSessionProvider }))
);

// --- Config ---
import { agentConfig as allAgentConfigs } from './components/bottle_V1.1/config/agent-config';

// --- Styles ---
import './App.css';
import './components/bottle_V1.1/AI_components/ChatModal.css'; // Import the new CSS

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
          <Route path="/settings" element={<Settings />} />
          <Route
            path="/chat/:agentId"
            element={
              <Suspense fallback={<div>Loading Chat Framework...</div>}>
                <AgentSessionProvider>
                  <ChatRoute />
                </AgentSessionProvider>
              </Suspense>
            }
          />
          <Route
            path="/chat"
            element={
              <Suspense fallback={<div>Loading Chat Framework...</div>}>
                <AgentSessionProvider>
                  <ChatRoute />
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
      <Router>
         <ScrollToTop />
        <div id="appContainer" className={`${orientation}-orientation`}>
          <div className={`crt-effect ${isMenuOpen ? 'menu-open' : ''}`}></div>

          <Header
            isMobile={isMobile}
            onOpenChat={() => {
              // open chat modal via context
              const evt = new CustomEvent('open-chat');
              window.dispatchEvent(evt);
            }}
            onToggleTheme={() => {
              // simple theme toggle event; existing theme management can hook into this
              const evt = new CustomEvent('toggle-theme');
              window.dispatchEvent(evt);
            }}
            onOpenMenu={toggleMenu}
          />

          <Menu isMobile={isMobile} isMenuOpen={isMenuOpen} onLinkClick={closeMenu} />

          <main id="mainContent" className={isMenuOpen ? 'menu-shifted' : ''}>
            <AnimatedRoutes />
          </main>

          <Footer />
        </div>
        <Suspense fallback={null}>
          <ChatModal />
        </Suspense>
      </Router>
    </ChatProvider>
  );
}

export default App;