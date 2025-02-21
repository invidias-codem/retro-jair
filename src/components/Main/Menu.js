import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faCode,
  faCogs,
  faEnvelope,
  faTerminal,
  faRobot
} from "@fortawesome/free-solid-svg-icons";
import "./Menu.css";

const SHADOW_COLORS = {
  red: '0 0 25px 5px rgba(204, 76, 61, 0.7)',
  green: '0 0 25px 5px rgba(36, 57, 44, 0.7)',
  blue: '0 0 25px 5px rgba(43, 212, 241, 0.7)',
  yellow: '0 0 25px 5px rgba(237, 218, 45, 0.7)'
};

const MENU_ITEMS = [
  {
    id: "menuItemAbout",
    iconId: "menuItemIconAbout",
    wrapperID: "menuItemIconWrapperAbout",
    icon: faUser,
    label: "About Me",
    path: "/about",
    color: "red"
  },
  {
    id: "menuItemProjects",
    iconId: "menuItemIconProjects",
    wrapperID: "menuItemIconWrapperProjects",
    icon: faCode,
    label: "Projects",
    path: "/projects",
    color: "green"
  },
  {
    id: "menuItemSkills",
    iconId: "menuItemIconSkills",
    wrapperID: "menuItemIconWrapperSkills",
    icon: faCogs,
    label: "Skills",
    path: "/skills",
    color: "blue"
  },
  {
    id: "menuItemContact",
    iconId: "menuItemIconContact",
    wrapperID: "menuItemIconWrapperContact",
    icon: faEnvelope,
    label: "Contact",
    path: "/contact",
    color: "orange"
  }
];

export default function Menu({ onItemClick }) {
  const [pattern, setPattern] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [activeButton, setActiveButton] = useState(null);
  const [canAcceptInput, setCanAcceptInput] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const generatePattern = () => {
    const newPattern = Array(4)
      .fill(null)
      .map(() => MENU_ITEMS[Math.floor(Math.random() * MENU_ITEMS.length)].color);
    return newPattern;
  };

  const showPattern = async (patternToShow) => {
    setCanAcceptInput(false);
    
    for (const color of patternToShow) {
      setActiveButton(color);
      await new Promise(resolve => setTimeout(resolve, 800));
      setActiveButton(null);
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    setCanAcceptInput(true);
  };

  const startGame = async () => {
    setIsPlaying(true);
    setCurrentStep(0);
    setIsUnlocked(false);
    setShowSuccessMessage(false);

    for (let i = 3; i > 0; i--) {
      setCountdown(i);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    setCountdown(null);

    const newPattern = generatePattern();
    setPattern(newPattern);
    await showPattern(newPattern);
  };

  const handleGameClick = async (e, color) => {
    e.preventDefault();

    if (!isPlaying || !canAcceptInput) return;

    setActiveButton(color);
    setTimeout(() => setActiveButton(null), 300);

    if (color === pattern[currentStep]) {
      const newStep = currentStep + 1;
      setCurrentStep(newStep);

      if (newStep === pattern.length) {
        setIsPlaying(false);
        setCanAcceptInput(false);
        setIsUnlocked(true);
        setShowSuccessMessage(true);
      }
    } else {
      setIsPlaying(false);
      setCanAcceptInput(false);
      setCurrentStep(0);
    }
  };

  const renderMenuItem = ({ id, iconId, wrapperID, icon, label, path, color }) => (
    <Link
      key={id}
      to={path}
      id={id}
      style={activeButton === color ? { boxShadow: SHADOW_COLORS[color] } : {}}
      onClick={(e) => isPlaying ? handleGameClick(e, color) : onItemClick?.()}
    >
      <div id={wrapperID}>
        <FontAwesomeIcon icon={icon} id={iconId} />
      </div>
      <span>{label}</span>
    </Link>
  );

  const renderChatButton = () => (
    <Link to="/chat" id="menuItemChat" className="chat-button-wrapper">
      <div id="menuItemIconWrapperChat">
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
  );

  const renderTerminalSection = () => (
    isUnlocked ? (
      <Link to="/terminal" id="menuItemTerminal">
        <div id="menuItemIconWrapperTerminal">
          <div className="static-icon-container">
            <FontAwesomeIcon icon={faTerminal} className="terminal-icon" />
          </div>
          <div className="cube">
            {['front', 'back', 'right', 'left', 'top', 'bottom'].map(face => (
              <div key={face} className={`face ${face}`} />
            ))}
          </div>
        </div>
        <span>Terminal</span>
      </Link>
    ) : (
      !isPlaying && (
        <button id="startGameButton" onClick={startGame}>
          Start Memory Game
        </button>
      )
    )
  );

  return (
    <div id="menuContainer">
      {countdown && <div id="gameCountdown">{countdown}</div>}
      
      {showSuccessMessage && (
        <div className="success-message">
          Sequence complete! Terminal unlocked.
        </div>
      )}

      <div id="menuItemGrid">
        {MENU_ITEMS.map(renderMenuItem)}
        {renderChatButton()}
        {renderTerminalSection()}
      </div>
    </div>
  );
}