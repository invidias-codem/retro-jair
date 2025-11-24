import React from 'react';
import { FaUser, FaCode, FaRobot, FaMicrochip } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import './AboutMe.css';

function AboutMe() {
  return (
    <div className="about-me-container">
      <h2 className="about-me-title">
        <FaUser className="about-me-icon mr-2" /> About Joshua
      </h2>
      <div className="about-me-content">
        <p className="about-me-text">
          Hello, my name is **Joshua Mohammed**! I'm a passionate developer specializing in building intelligent, autonomous systems.
        </p>
        
        <p className="about-me-text">
          <FaMicrochip className="about-me-icon inline mr-2" /> My focus is on blending modern tech—like **Google's Gemini models** and **AI-driven automation**—with solid web development practices.
        </p>
        
        <p className="about-me-text">
          <FaRobot className="about-me-icon inline mr-2" /> I am the architect behind **Vector**, the autonomous AI editor you see on the TradeFlow Blog. I built its full tech stack, from the scraping pipeline to the publishing logic.
        </p>

        <p className="about-me-text">
          <FaCode className="about-me-icon inline mr-2" /> When I'm not optimizing Vector's neural pathways, I'm building unique web experiences and exploring retro aesthetics.
        </p>

      </div>
      <div className="about-me-actions">
        {/* Changed CTA to link to the AI's blog post URL and updated the text */}
        <Link 
          to="https://jairs2.wordpress.com/" // Assuming this is your main blog URL
          className="read-blog-button"
          target="_blank" // Open in a new tab since it links externally
          rel="noopener noreferrer"
        >
          Read Vector's Daily Briefing 🤖
        </Link>
        {/* Keeping the original CTA as a secondary option if desired, otherwise delete this Link block */}
        <Link to="/services" className="hire-me-button secondary">
          Book a Consultation
        </Link>
      </div>
    </div>
  );
}

export default AboutMe;