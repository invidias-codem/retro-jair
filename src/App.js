import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useLocation } from 'react-router-dom';
import { useTransition, animated } from '@react-spring/web';
import Menu from './components/Main/Menu';
import Speaker from './components/Main/Speaker';
import AboutMe from './components/AboutMe/AboutMe';
import Projects from './components/Projects/Projects';
import Skills from './components/Skills/Skills';
import Contact from './components/ContactMe/Contact';
import Chat from './components/AI/chat'
import Terminal from './routes/Terminal/Terminal'
import Footer from './components/Footer/Footer';
import './App.css';

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
        <Speaker />
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
