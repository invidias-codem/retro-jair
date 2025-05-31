import React, { useState, useEffect, Suspense } from 'react';
import {
  BrowserRouter as Router, // Router is wrapping the main app structure
  Route,
  Routes,
  Link,
  useLocation,
  useNavigate // Import useNavigate
} from 'react-router-dom';
import { useTransition, animated } from '@react-spring/web';

// Component imports
import Menu from './components/bottle_V1.1/Main/Menu';
import AboutMe from './components/bottle_V1.1/AboutMe/AboutMe';
import Projects from './components/bottle_V1.1/Projects/Projects';
import Skills from './components/bottle_V1.1/Skills/Skills';
import Contact from './components/bottle_V1.1/ContactMe/Contact';
import Terminal from './components/bottle_V1.1/routes/Terminal/Terminal';
import Footer from './components/bottle_V1.1/Footer/Footer';

// Agent system imports
import { ChatProvider } from './components/bottle_V1.1/context/useContext';

// Import the Chat Interface component
import ChatInterface from './components/bottle_V1.1/AI_components/ChatInterface';

import './App.css';

// AnimatedRoutes now directly uses the location passed from AppWrapper
function AnimatedRoutes({ location }) {
  const transitions = useTransition(location, {
    from: { opacity: 0, transform: 'translateY(50px)' },
    enter: { opacity: 1, transform: 'translateY(0px)' },
    leave: { opacity: 0, transform: 'translateY(-50px)' },
    config: { tension: 220, friction: 20 },
  });

  return transitions((props, item) => (
    <animated.div style={props} className="animated-route-wrapper">
      {/* Pass the specific location item to Routes for correct animation matching */}
      <Routes location={item}>
        <Route path="/" element={<AboutMe />} />
        <Route path="/about" element={<AboutMe />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/skills" element={<Skills />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/chat" element={<ChatInterface />} />
        <Route path="/terminal" element={<Terminal />} />
      </Routes>
    </animated.div>
  ));
}

// Content of the App, now uses hooks from Router context
function AppContent() {
  const location = useLocation(); // For animations and chat button visibility
  const navigate = useNavigate(); // For chat button navigation

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode !== null) {
      return savedMode === 'true';
    }
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // State for Chat Button visibility, now primarily controlled by route
  const [isChatButtonVisible, setIsChatButtonVisible] = useState(true);

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('darkMode', 'false');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const handleResize = () => {
      const mobileCheck = window.innerWidth <= 768;
      setIsMobile(mobileCheck);
      if (!mobileCheck && showMobileMenu) {
        setShowMobileMenu(false);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [showMobileMenu]);

  // Control chat button visibility based on the current route
  useEffect(() => {
    if (location.pathname === '/chat') {
      setIsChatButtonVisible(false);
    } else {
      setIsChatButtonVisible(true);
    }
  }, [location.pathname]); // Re-run when the path changes

  const toggleMobileMenu = () => {
    setShowMobileMenu(!showMobileMenu);
  };

  const toggleDarkMode = () => {
    setIsDarkMode(prevMode => !prevMode);
  };

  const handleChatButtonClick = () => {
    // Optional: an immediate optimistic hide, though useEffect on location change will handle it robustly.
    // setIsChatButtonVisible(false);
    navigate('/chat'); // Navigate to the chat interface page
  };

  return (
    <div id="appContainer">
      <header id="appHeader">
        <Link to="/" id="appHeaderLink" onClick={() => { if (isMobile && showMobileMenu) setShowMobileMenu(false); }}>
          Cruise-Thru Portfolio
        </Link>
        <button
          onClick={toggleDarkMode}
          className="dark-mode-toggle-button"
          aria-label={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDarkMode ? '☀️' : '🌙'}
        </button>
      </header>

      <main id="appMain">
        {isMobile ? (
          <>
            <div id="appSidebar" className={`mobile-sidebar ${showMobileMenu ? 'show' : ''}`}>
              <Menu onItemClick={() => setShowMobileMenu(false)} />
            </div>
            <button
              id="menuToggle"
              onClick={toggleMobileMenu}
              aria-label={showMobileMenu ? 'Close Menu' : 'Open Menu'}
              aria-expanded={showMobileMenu}
            >
              {showMobileMenu ? '✕' : '☰'}
            </button>
          </>
        ) : (
        <>
          <div id="appSidebar">
            <Menu />
          </div>
          
        </>
        )}
        <div id="appContent">
          {/* Pass location to AnimatedRoutes for react-spring transitions */}
          <AnimatedRoutes location={location} />
        </div>

      </main>

      <div className={`active-chat-agent ${!isChatButtonVisible ? 'hidden' : ''}`}>
        <button className="chat-open-button tech-button" onClick={handleChatButtonClick}>
          <svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="robot" className="svg-inline--fa fa-robot " role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" style={{ marginRight: '10px' }}>
            <path fill="currentColor" d="M320 0c17.7 0 32 14.3 32 32l0 64 120 0c39.8 0 72 32.2 72 72l0 272c0 39.8-32.2 72-72 72l-304 0c-39.8 0-72-32.2-72-72l0-272c0-39.8 32.2-72 72-72l120 0 0-64c0-17.7 14.3-32 32-32zM208 384c-8.8 0-16 7.2-16 16s7.2 16 16 16l32 0c8.8 0 16-7.2 16-16s-7.2-16-16-16l-32 0zm96 0c-8.8 0-16 7.2-16 16s7.2 16 16 16l32 0c8.8 0 16-7.2 16-16s-7.2-16-16-16l-32 0zm96 0c-8.8 0-16 7.2-16 16s7.2 16 16 16l32 0c8.8 0 16-7.2 16-16s-7.2-16-16-16l-32 0zM264 256a40 40 0 1 0 -80 0 40 40 0 1 0 80 0zm152 40a40 40 0 1 0 0-80 40 40 0 1 0 0 80zM48 224l16 0 0 192-16 0c-26.5 0-48-21.5-48-48l0-96c0-26.5 21.5-48 48-48zm544 0c26.5 0 48 21.5 48 48l0 96c0 26.5-21.5 48-48 48l-16 0 0-192 16 0z"></path>
          </svg>
          Chat with Tech Genie
        </button>
      </div>

      <Footer />
    </div>
  );
}

// AppWrapper sets up the Router context needed by AppContent
function App() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showMenu, setShowMenu] = useState(false); // Assuming 'showMenu' is the correct state based on toggleMenu

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleMenu = () => {
    setShowMenu(!showMenu);
  };

  return (
    <ChatProvider>
      <Router>
        <div id="appContainer">
          <header id="appHeader">
            <Link to="/" id="appHeaderLink">
              Cruise-Thru Portfolio
            </Link>
          </header>

          <main id="appMain">
            {isMobile ? (
              <> {/* Opening React Fragment */}
                <div id="appSidebar" className={`mobile-sidebar ${showMenu ? 'show' : ''}`}>
                  <Menu onItemClick={() => setShowMenu(false)} />
                </div>
                <button id="menuToggle" onClick={toggleMenu} aria-label={showMenu ? 'Close Menu' : 'Open Menu'} aria-expanded={showMenu}>
                   {showMenu ? '✕' : '☰'}
                </button>
              </> 
            ) : (
              <div id="appSidebar">
                <Menu />
              </div>
            )}
            <div id="appContent">
              <AnimatedRoutes />
            </div>
          </main>

          {/* <ChatModal /> */}
          <Footer />
        </div>
      </Router>
    </ChatProvider>
  );
}

export default App;