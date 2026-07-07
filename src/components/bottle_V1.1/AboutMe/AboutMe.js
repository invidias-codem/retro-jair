import React, { useState, useCallback } from 'react';
import { FaUser, FaCode, FaRobot, FaMicrochip } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import journalEntries from '../TermJourn/journalLogs';
import './AboutMe.css';

const AboutMe = () => {
  const [selectedId, setSelectedId] = useState(null);

  const activeEntry = journalEntries.find(entry => entry.id === selectedId) || null;

  const choose = useCallback((entry) => {
    setSelectedId(prev => (prev === entry.id ? null : entry.id));
  }, []);

  return (
    <div className="about-me-container">
      <div className="about-me-header">
        <h2 className="about-me-title">
          <FaUser className="about-me-icon" /> About Joshua
        </h2>
        <div className="about-me-subtitle">
          <span className="about-me-status">STATUS:</span> BOOT SEQUENCE COMPLETE
        </div>
      </div>

      <div className="journal-chapter-list">
        <div className="journal-chapter-label">CHAPTERS</div>
        <div className="journal-chapter-cards">
          {journalEntries.map(entry => {
            const isActive = activeEntry && activeEntry.id === entry.id;
            return (
              <button
                key={entry.id}
                type="button"
                className={`journal-chapter-card ${isActive ? 'selected' : ''}`}
                onClick={() => choose(entry)}
              >
                <div className="journal-chapter-meta">
                  <span className="journal-chapter-id">{entry.id}</span>
                  <span className="journal-chapter-date">{entry.date}</span>
                </div>
                <div className="journal-chapter-title">{entry.title}</div>
                <div className="journal-chapter-status">{entry.initialStatus}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="about-me-detail" aria-live="polite">
        {activeEntry ? (
          <div className="about-me-chapter">
            <div className="about-me-chapter-header">
              <div className="about-me-chapter-title">{activeEntry.title}</div>
              <div className="about-me-chapter-meta">{activeEntry.date}</div>
            </div>
            <div className="about-me-chapter-body">
              {activeEntry.content.split('\n').map((line, idx) => (
                <p key={idx} className="about-me-text">{line}</p>
              ))}
            </div>
            <div className="about-me-chapter-footer">
              <div className="about-me-alerts">
                {activeEntry.alerts.map((alert, idx) => (
                  <span key={idx} className="about-me-alert">ALERT: {alert}</span>
                ))}
              </div>
              <div className="about-me-actions">
                <Link
                  to="https://jairs2.wordpress.com/"
                  className="read-blog-button"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Read Vector's Daily Briefing
                </Link>
                <Link to="/services" className="hire-me-button secondary">
                  Book a Consultation
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="about-me-placeholder">SELECT A CHAPTER TO VIEW DETAILS</div>
        )}
      </div>
    </div>
  );
};

export default AboutMe;
