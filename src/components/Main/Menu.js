import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faCode,
  faCogs,
  faEnvelope,
  faTerminal,
} from "@fortawesome/free-solid-svg-icons";
import "./Menu.css";

// Shadow colors for the pattern
const SHADOW_COLORS = {
  red: '0 0 25px 5px rgba(204, 76, 61, 0.7)',     // CC4C3D
  green: '0 0 25px 5px rgba(36, 57, 44, 0.7)',    // 24392C
  blue: '0 0 25px 5px rgba(43, 212, 241, 0.7)',   // 2BD4F1
  yellow: '0 0 25px 5px rgba(237, 218, 45, 0.7)'  // EDDA2D
};

// Menu items configuration
const MENU_ITEMS = [
  {
    id: "menuItemAbout",
    iconId: "menuItemIconAbout",
    wrapperID: "menuItemIconWrapperAbout",
    icon: faUser,
    label: "About Me",
    path: "/about",
    color: "red",
  },
  {
    id: "menuItemProjects",
    iconId: "menuItemIconProjects",
    wrapperID: "menuItemIconWrapperProjects",
    icon: faCode,
    label: "Projects",
    path: "/projects",
    color: "green",
  },
  {
    id: "menuItemSkills",
    iconId: "menuItemIconSkills",
    wrapperID: "menuItemIconWrapperSkills",
    icon: faCogs,
    label: "Skills",
    path: "/skills",
    color: "blue",
  },
  {
    id: "menuItemContact",
    iconId: "menuItemIconContact",
    wrapperID: "menuItemIconWrapperContact",
    icon: faEnvelope,
    label: "Contact",
    path: "/contact",
    color: "orange",
  },
];

function Menu({ onItemClick }) {
  const [pattern, setPattern] = useState();
  const [playerPattern, setPlayerPattern] = useState();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [activeButton, setActiveButton] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [canAcceptInput, setCanAcceptInput] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false); // State for success message

  // Generate new pattern
  const generatePattern = () => {
    const newPattern = Array(4)
    .fill(null)
    .map(
        () => MENU_ITEMS[Math.floor(Math.random() * MENU_ITEMS.length)].color,
      );
    console.log("Generated pattern:", newPattern); // For debugging
    return newPattern;
  };

  // Start game with countdown
  const startGame = async () => {
    setIsPlaying(true);
    setPlayerPattern();
    setCurrentStep(0);
    setIsUnlocked(false);
    setShowSuccessMessage(false); // Hide success message when starting a new game

    // Start countdown
    for (let i = 3; i > 0; i--) {
      setCountdown(i);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    setCountdown(null);

    // Generate and show pattern
    const newPattern = generatePattern();
    setPattern(newPattern);
    await showPattern(newPattern);
  };

  // Show pattern to user
  const showPattern = async (patternToShow) => {
    setCanAcceptInput(false);

    // Show each color in sequence
    for (const color of patternToShow) {
      setActiveButton(color);
      await new Promise((resolve) => setTimeout(resolve, 800));
      setActiveButton(null);
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    setCanAcceptInput(true);
  };

  // Handle menu item clicks during game
  const handleGameClick = async (e, color) => {
    e.preventDefault(); // Prevent navigation during game

    if (!isPlaying ||!canAcceptInput) return;

    // Visual feedback
    setActiveButton(color);
    setTimeout(() => setActiveButton(null), 300);

    // Check if this click matches the current step in the pattern
    if (color === pattern[currentStep]) {
      const newStep = currentStep + 1;
      setCurrentStep(newStep);

      // Check if pattern is complete
      if (newStep === pattern.length) {
        setIsPlaying(false);
        setCanAcceptInput(false);
        setIsUnlocked(true);
        setShowSuccessMessage(true); // Show success message
        console.log("Pattern completed! Terminal unlocked."); // For debugging
      }
    } else {
      // Wrong color - reset game
      setIsPlaying(false);
      setCanAcceptInput(false);
      setCurrentStep(0);
      setPlayerPattern();
      console.log("Wrong color! Game reset."); // For debugging
    }
  };

  return (
    <div id="menuContainer">
      

      {countdown && <div id="gameCountdown">{countdown}</div>}

      {/* Success Message */}
      {showSuccessMessage && (
        <div className="success-message">
          Sequence complete! Terminal unlocked.
        </div>
      )}

      <div id="menuItemGrid">
        {MENU_ITEMS.map(({ id, iconId, wrapperID, icon, label, path, color }) => (
          <Link
            key={id}
            to={path}
            id={id}
            style={activeButton === color? { boxShadow: SHADOW_COLORS[color] }: {}}
            onClick={(e) =>
              isPlaying? handleGameClick(e, color): onItemClick?.()
            }
          >
            <div id={wrapperID}>
              <FontAwesomeIcon icon={icon} id={iconId} />
            </div>
            <span>{label}</span>
          </Link>
        ))}

        {isUnlocked? (
          <Link to="/terminal" id="menuItemTerminal">
            <div id="menuItemIconWrapperTerminal">
              <div className="static-icon-container">
                <FontAwesomeIcon icon={faTerminal} className="terminal-icon" />
              </div>
              <div className="cube">
                <div className="face front"></div>
                <div className="face back"></div>
                <div className="face right"></div>
                <div className="face left"></div>
                <div className="face top"></div>
                <div className="face bottom"></div>
              </div>
            </div>
            <span>Terminal</span>
          </Link>
        ): (
        !isPlaying && (
            <button id="startGameButton" onClick={startGame}>
              Start Memory Game
            </button>
          )
        )}
      </div>
    </div>
  );
}

export default Menu;