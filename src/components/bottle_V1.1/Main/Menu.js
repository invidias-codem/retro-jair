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
import './Menu.css'; // Original Menu.css, styles will be overridden by App.css for sidebar context

const SHADOW_COLORS = {
  red: '0 0 25px 5px rgba(204, 76, 61, 0.7)',
  green: '0 0 25px 5px rgba(36, 57, 44, 0.7)',
  blue: '0 0 25px 5px rgba(43, 212, 241, 0.7)',
  yellow: '0 0 25px 5px rgba(237, 218, 45, 0.7)'
};

const MENU_ITEMS = [
  { id: 'about', icon: faUser, label: 'About Me', path: '/about', color: 'red' },
  { id: 'projects', icon: faCode, label: 'Projects', path: '/projects', color: 'green' },
  { id: 'skills', icon: faCogs, label: 'Skills Game', path: '/skills', color: 'blue' },
  { id: 'contact', icon: faEnvelope, label: 'Contact', path: '/contact', color: 'yellow' }
];

// Standard Menu Item
const MenuItem = memo(({ item, isActive, onClick, isDesktopSidebarCollapsed }) => (
  <Link
    to={item.path}
    className="menu-item" // This class is key for App.css to style it in the sidebar
    style={isActive && !isDesktopSidebarCollapsed ? { boxShadow: SHADOW_COLORS[item.color] } : {}}
    onClick={onClick}
    aria-label={item.label}
    title={isDesktopSidebarCollapsed ? item.label : undefined} // Show full label on hover when collapsed
  >
    <FontAwesomeIcon icon={item.icon} className="menu-item-icon" fixedWidth />
    <span className="menu-item-text">{item.label}</span>
  </Link>
));

// Chat Button, adapted for sidebar consistency
const ChatButton = memo(({ onClick, isDesktopSidebarCollapsed }) => (
  <Link
    to="/chat"
    className="menu-item chat-button-link" // Use "menu-item" for sidebar styling, specific class for other contexts
    aria-label="Open GenAIe Chat"
    onClick={onClick}
    title={isDesktopSidebarCollapsed ? "GenAIe Chat" : undefined}
  >
    <FontAwesomeIcon icon={faRobot} className="menu-item-icon" fixedWidth />
    <span className="menu-item-text">GenAIe</span>
  </Link>
));

// Terminal Link, adapted for sidebar consistency
const TerminalLink = memo(({ isUnlocked, onClick, isDesktopSidebarCollapsed }) => (
  <Link
    to="/terminal"
    className={`menu-item terminal-link ${isUnlocked ? 'unlocked' : ''}`} // Use "menu-item"
    aria-label="Open Terminal"
    onClick={onClick}
    title={isDesktopSidebarCollapsed ? "Terminal" : undefined}
  >
    <FontAwesomeIcon icon={faTerminal} className="menu-item-icon" fixedWidth />
    <span className="menu-item-text">Terminal</span>
  </Link>
));

const Menu = ({ onItemClick, isDesktopSidebarCollapsed }) => {
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
      ...prev, isPlaying: true, currentStep: 0, isUnlocked: false, showSuccess: false
    }));
    for (let i = 3; i > 0; i--) {
      setGameState(prev => ({ ...prev, countdown: i }));
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    const newPattern = generatePattern();
    setGameState(prev => ({ ...prev, pattern: newPattern, countdown: null }));
    await showPattern(newPattern);
  }, [generatePattern, showPattern]);

  const handleGameClick = useCallback((e, color) => {
    e.preventDefault(); // Prevent navigation if game is active
    const { isPlaying, canAcceptInput, pattern, currentStep } = gameState;

    if (!isPlaying || !canAcceptInput) return;

    setGameState(prev => ({ ...prev, activeButton: color }));
    setTimeout(() => setGameState(prev => ({ ...prev, activeButton: null })), 300);

    if (color === pattern[currentStep]) {
      const newStep = currentStep + 1;
      if (newStep === pattern.length) {
        setGameState(prev => ({
          ...prev, isPlaying: false, canAcceptInput: false, isUnlocked: true, showSuccess: true
        }));
        // Game won, if onItemClick is for mobile menu, close it (if not already collapsed on desktop)
        if (onItemClick) {
          onItemClick();
        }
      } else {
        setGameState(prev => ({ ...prev, currentStep: newStep }));
      }
    } else { // Wrong pattern
      setGameState(prev => ({
        ...prev, isPlaying: false, canAcceptInput: false, currentStep: 0
      }));
      // Game lost, if onItemClick is for mobile menu, close it
      if (onItemClick) {
        onItemClick();
      }
    }
  }, [gameState, onItemClick]);

  // For items not part of the game, or when the game isn't active
  const handleStandardItemClick = (e) => {
    if (gameState.isPlaying) {
      e.preventDefault(); // Prevent navigation if game is playing and a non-game item is somehow clicked
      return;
    }
    if (onItemClick) {
      onItemClick(); // Close mobile menu
    }
  };

  // Effect for game success message timeout
  useEffect(() => {
    let timer;
    if (gameState.showSuccess) {
      timer = setTimeout(() => {
        setGameState(prev => ({ ...prev, showSuccess: false }));
      }, 3000); // Show success message for 3 seconds
    }
    return () => clearTimeout(timer);
  }, [gameState.showSuccess]);


  return (
    <div id="menuContainer"> {/* Styled by App.css when inside #appSidebar */}
      {gameState.countdown && (
        <div id="gameCountdown" role="timer"> {/* Styling for this ID is in Menu.css */}
          {gameState.countdown}
        </div>
      )}

      {gameState.showSuccess && (
        <div className="success-message" role="alert"> {/* Styling for this class is in Menu.css */}
          Sequence complete! Terminal unlocked.
        </div>
      )}

      {/* This .menu-grid will be overridden by #appSidebar .menu-grid in App.css for sidebar context */}
      {/* MODIFICATION: Added flexbox and overflow classes for mobile view */}
      <div className="menu-grid flex items-center justify-center overflow-x-hidden md:justify-start">
        {MENU_ITEMS.map(item => (
          <MenuItem
            key={item.id}
            item={item}
            isActive={gameState.activeButton === item.color}
            onClick={(e) => {
              if (gameState.isPlaying && gameState.canAcceptInput) {
                handleGameClick(e, item.color);
              } else if (!gameState.isPlaying) {
                // Standard click, allow navigation and call onItemClick (for mobile menu)
                handleStandardItemClick(e); // Pass event if needed, or just call
              } else {
                // Game is playing but input not yet accepted (e.g., during pattern display)
                e.preventDefault();
              }
            }}
            isDesktopSidebarCollapsed={isDesktopSidebarCollapsed}
          />
        ))}

        {/* The ChatButton and TerminalLink will also be treated as .menu-item by App.css in sidebar context */}
        <ChatButton
            onClick={handleStandardItemClick}
            isDesktopSidebarCollapsed={isDesktopSidebarCollapsed}
        />

        {gameState.isUnlocked ? (
          <TerminalLink
            isUnlocked={gameState.isUnlocked}
            onClick={handleStandardItemClick}
            isDesktopSidebarCollapsed={isDesktopSidebarCollapsed}
          />
        ) : (
          !gameState.isPlaying && (
            // This button might need specific styling if it's to appear like other .menu-items in the sidebar
            // Or it could be a more prominent button at the end.
            // For sidebar consistency, you might want to make it a MenuItem-like component too.
            // For now, it keeps its .start-game-button class from Menu.css
            <div className="menu-item start-game-button-container"> {/* Wrapper to help with layout if needed */}
                <button
                className="start-game-button" // Styled by Menu.css
                onClick={startGame}
                aria-label="Start Memory Game"
                >
                Start Memory Game
                </button>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default Menu;