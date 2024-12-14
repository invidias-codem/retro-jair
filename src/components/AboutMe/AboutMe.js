import React from 'react';
import { FaUser, FaCode, FaCoffee } from 'react-icons/fa';
import './AboutMe.css';

function AboutMe() {
  return (
    <div className="about-me-container">
      <h2 className="about-me-title">
        <FaUser className="about-me-icon mr-2" /> About Me
      </h2>
      <div className="about-me-content">
        <p className="about-me-text">
          Hello, my name is Joshua Mohammed! I'm a passionate developer with a love for retro aesthetics and modern tech.
        </p>
        <p className="about-me-text">
          <FaCode className="about-me-icon inline mr-2" /> I specialize in creating unique web experiences that blend nostalgia with cutting-edge functionality.
        </p>
        <p className="about-me-text">
          <FaCoffee className="about-me-icon inline mr-2" /> When I'm not coding, you can find me sipping on coffee and playing classic video games.
        </p>
      </div>
    </div>
  );
}

export default AboutMe;