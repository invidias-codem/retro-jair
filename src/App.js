import React, { useState, useEffect, Suspense, useCallback } from 'react';
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Link,
  useLocation,
  useParams,
  useNavigate
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
import { ChatProvider, useChat } from './components/bottle_V1.1/context/useContext';
import ChatModal from './components/bottle_V1.1/AI_components/common/ChatModal';

import './App.css';
import Chat from './components/bottle_V1.1/AI_components/agents/chat';

function AnimatedRoutes() {
  const location = useLocation();
  const transitions = useTransition(location, {
    from: { opacity: 0, transform: 'translateY(50px)' },
    enter: { opacity: 1, transform: 'translateY(0px)' },
    leave: { opacity: 0, transform: 'translateY(-50px)' },
  });

  return transitions((props, item) => (
    <animated.div style={props}>
      <Routes location={item}>
        <Route path="/" element={<AboutMe />} />
        <Route path="/about" element={<AboutMe />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/skills" element={<Skills />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/terminal" element={<Terminal />} />
       
      </Routes>
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

  return (
    <Router>
      <div id="appContainer">
        <header id="appHeader">
          <Link to="/" id="appHeaderLink">
            Cruise-Thru Portfolio
          </Link>
        </header>
        
        <main id="appMain">
          {isMobile ? (
            <>
              <div id="appSidebar" className={showMenu ? 'show' : ''}>
                <Menu onItemClick={() => setShowMenu(false)} />
              </div>
              <button id="menuToggle" onClick={toggleMenu}>
                {showMenu ? '↓' : '↑'}
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
        <Footer />
      </div>
    </Router>
  );
}

export default App;