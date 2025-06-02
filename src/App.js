import React, { useState, useEffect, Suspense, useCallback } from 'react';
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Link,
  useLocation,
  // Removed unused imports: useParams, useNavigate (unless used elsewhere)
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

// Agent system imports - KEEP these for now, might be used by modal or context
import { ChatProvider, useChat } from './components/bottle_V1.1/context/useContext';
import ChatModal from './components/bottle_V1.1/AI_components/common/ChatModal';

// Import the NEW Chat Interface component
import ChatInterface from './components/bottle_V1.1/AI_components/ChatInterface'; // Adjust path if needed

// REMOVE the direct import of the old Chat/TechChat component
// import Chat from './components/bottle_V1.1/AI_components/agents/chat';

import './App.css';

function AnimatedRoutes() {
  const location = useLocation();
  const transitions = useTransition(location, {
    // Stagger: 50, // Optional: add stagger if needed
    from: { opacity: 0, transform: 'translateY(50px)' },
    enter: { opacity: 1, transform: 'translateY(0px)' },
    leave: { opacity: 0, transform: 'translateY(-50px)' },
    config: { tension: 220, friction: 20 }, // Example config
  });

  return transitions((props, item) => (
    // MODIFIED LINE: Using spread syntax for the style prop
    // This allows you to easily merge the animated props with other styles if needed.
    // For example: style={{ ...props, yourCustomProperty: 'value' }}
    <animated.div style={{ ...props }} className="animated-route-wrapper"> {/* Added class for potential styling */}
      {/* Use Suspense if any routed components use React.lazy */}
      {/* <Suspense fallback={<div>Loading Page...</div>}> */}
        <Routes location={item}>
          <Route path="/" element={<AboutMe />} />
          <Route path="/about" element={<AboutMe />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/skills" element={<Skills />} />
          <Route path="/contact" element={<Contact />} />
          {/* MODIFIED ROUTE: Use ChatInterface for the /chat path */}
          <Route path="/chat" element={<ChatInterface />} />
          <Route path="/terminal" element={<Terminal />} />
          {/* Add other routes as needed */}
          {/* Optional: Add a 404 Not Found route */}
          {/* <Route path="*" element={<NotFoundComponent />} /> */}
        </Routes>
      {/* </Suspense> */}
    </animated.div>
  ));
}

function App() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showMenu, setShowMenu] = useState(false);

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

  // Assuming ChatProvider should wrap the part of the app using the chat context
  // If it needs to wrap everything, move it outside <Router> or inside <div id="appContainer">
  return (
    <ChatProvider> {/* Example: Wrap with ChatProvider if needed globally or for modal */}
      <Router>
        <div id="appContainer">
          <header id="appHeader">
            <Link to="/" id="appHeaderLink">
              Cruise-Thru Portfolio {/* Consider a more descriptive title */}
            </Link>
          </header>

          <main id="appMain">
            {isMobile ? (
              <div>
                <div id="appSidebar" className={`mobile-sidebar ${showMenu ? 'show' : ''}`}> {/* Added class */}
                  <Menu onItemClick={() => setShowMenu(false)} />
                </div>
                <button id="menuToggle" onClick={toggleMenu} aria-label={showMenu ? 'Close Menu' : 'Open Menu'} aria-expanded={showMenu}>
                   {/* Use more descriptive icons/text if possible */}
                   {showMenu ? '✕' : '☰'}
                </button>
              </div>
            ) : (
              <div id="appSidebar">
                <Menu />
              </div>
            )}
            <div id="appContent">
              <AnimatedRoutes />
            </div>
          </main>

          {/* Render ChatModal here if it's meant to be a global modal triggered by context */}
          {/* <ChatModal /> */}

          <Footer />
        </div>
      </Router>
    </ChatProvider>
  );
}

export default App;