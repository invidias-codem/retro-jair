import React, { useState, useCallback, useEffect, memo } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser,
  faCode,
  faCogs,
  faEnvelope,
  faTerminal,
  faRobot
} from '@fortawesome/free-solid-svg-icons';
import './Menu.css';

const SHADOW_COLORS = {
  red: '0 0 25px 5px rgba(204, 76, 61, 0.7)',
  green: '0 0 25px 5px rgba(36, 57, 44, 0.7)',
  blue: '0 0 25px 5px rgba(43, 212, 241, 0.7)',
  yellow: '0 0 25px 5px rgba(237, 218, 45, 0.7)'
};

const MENU_ITEMS = [
  {
    id: 'about',
    icon: faUser,
    label: 'About Me',
    path: '/about',
    color: 'red'
  },
  {
    id: 'projects',
    icon: faCode,
    label: 'Projects',
    path: '/projects',
    color: 'green'
  },
  {
    id: 'skills',
    icon: faCogs,
    label: 'Skills',
    path: '/skills',
    color: 'blue'
  },
  {
    id: 'contact',
    icon: faEnvelope,
    label: 'Contact',
    path: '/contact',
    color: 'yellow'
  }
];

// Memoized menu item component for better performance
const MenuItem = memo(({ item, isActive, onClick }) => (
  <Link
    to={item.path}
    className="menu-item"
    style={isActive ? { boxShadow: SHADOW_COLORS[item.color] } : {}}
    onClick={onClick}
    aria-label={item.label}
  >
    <div className="menu-icon-wrapper">
      <FontAwesomeIcon icon={item.icon} className="menu-icon" />
    </div>
    <span className="menu-text">{item.label}</span>
  </Link>
));

// Memoized chat button component
const ChatButton = memo(() => (
  <Link to="/chat" className="chat-button-wrapper" aria-label="Open TechGenie Chat">
    <div className="genie-container">
      <div className="genie-icon-container">
        <FontAwesomeIcon icon={faRobot} className="genie-icon" />
        <div className="energy-ring" />
      </div>
      <div className="power-core">
        <div className="core-inner" />
        <div className="core-outer" />
        <div className="core-glow" />
      </div>
    </div>
    <span>TechGenie</span>
  </Link>
));

// Memoized terminal component
const Terminal = memo(({ isUnlocked }) => (
  <Link to="/terminal" className="terminal-item" aria-label="Open Terminal">
    <div className="terminal-icon-container">
      <FontAwesomeIcon icon={faTerminal} className="terminal-icon" />
    </div>
    <div className="cube">
      {['front', 'back', 'right', 'left', 'top', 'bottom'].map(face => (
        <div key={face} className={`cube__face cube__face--${face}`} />
      ))}
    </div>
    <span>Terminal</span>
  </Link>
));

const Menu = ({ onItemClick }) => {
  const [gameState, setGameState] = useState({
    pattern: [],
    currentStep: 0,
    isPlaying: false,
    isUnlocked: false,
    countdown: null,
    activeButton: null,
    canAcceptInput: false,
    showSuccess: false
  });

  const generatePattern = useCallback(() => (
    Array(4).fill(null).map(() => 
      MENU_ITEMS[Math.floor(Math.random() * MENU_ITEMS.length)].color
    )
  ), []);

  const showPattern = useCallback(async (patternToShow) => {
    setGameState(prev => ({ ...prev, canAcceptInput: false }));
    
    for (const color of patternToShow) {
      setGameState(prev => ({ ...prev, activeButton: color }));
      await new Promise(resolve => setTimeout(resolve, 800));
      setGameState(prev => ({ ...prev, activeButton: null }));
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    setGameState(prev => ({ ...prev, canAcceptInput: true }));
  }, []);

  const startGame = useCallback(async () => {
    setGameState(prev => ({
      ...prev,
      isPlaying: true,
      currentStep: 0,
      isUnlocked: false,
      showSuccess: false
    }));

    for (let i = 3; i > 0; i--) {
      setGameState(prev => ({ ...prev, countdown: i }));
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const newPattern = generatePattern();
    setGameState(prev => ({
      ...prev,
      pattern: newPattern,
      countdown: null
    }));
    
    await showPattern(newPattern);
  }, [generatePattern, showPattern]);

  const handleGameClick = useCallback((e, color) => {
    e.preventDefault();
    const { isPlaying, canAcceptInput, pattern, currentStep } = gameState;

    if (!isPlaying || !canAcceptInput) return;

    setGameState(prev => ({ ...prev, activeButton: color }));
    setTimeout(() => 
      setGameState(prev => ({ ...prev, activeButton: null })), 300
    );

    if (color === pattern[currentStep]) {
      const newStep = currentStep + 1;
      if (newStep === pattern.length) {
        setGameState(prev => ({
          ...prev,
          isPlaying: false,
          canAcceptInput: false,
          isUnlocked: true,
          showSuccess: true
        }));
      } else {
        setGameState(prev => ({ ...prev, currentStep: newStep }));
      }
    } else {
      setGameState(prev => ({
        ...prev,
        isPlaying: false,
        canAcceptInput: false,
        currentStep: 0
      }));
    }
  }, [gameState]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      // Clear any pending timeouts when component unmounts
      const cleanup = () => {
        setGameState(prev => ({
          ...prev,
          isPlaying: false,
          canAcceptInput: false
        }));
      };
      cleanup();
    };
  }, []);

  return (
    <div className="menu-container">
      {gameState.countdown && (
        <div className="game-countdown" role="timer">
          {gameState.countdown}
        </div>
      )}
      
      {gameState.showSuccess && (
        <div className="success-message" role="alert">
          Sequence complete! Terminal unlocked.
        </div>
      )}

      <div className="menu-grid">
        {MENU_ITEMS.map(item => (
          <MenuItem
            key={item.id}
            item={item}
            isActive={gameState.activeButton === item.color}
            onClick={(e) => gameState.isPlaying 
              ? handleGameClick(e, item.color)
              : onItemClick?.()
            }
          />
        ))}
        
        <ChatButton />
        
        {gameState.isUnlocked ? (
          <Terminal isUnlocked={gameState.isUnlocked} />
        ) : (
          !gameState.isPlaying && (
            <button 
              className="start-game-button"
              onClick={startGame}
              aria-label="Start Memory Game"
            >
              Start Memory Game
            </button>
          )
        )}
      </div>
    </div>
  );
};

export default Menu;