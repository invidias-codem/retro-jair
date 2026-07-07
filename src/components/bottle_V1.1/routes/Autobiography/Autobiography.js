import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import journalEntries from '../../TermJourn/journalLogs';
import './Autobiography.css';

const Autobiography = () => {
  const [selectedId, setSelectedId] = useState(null);
  const activeEntry = journalEntries.find(entry => entry.id === selectedId) || null;

  const choose = useCallback((entry) => {
    setSelectedId(prev => (prev === entry.id ? null : entry.id));
  }, []);

  return (
    <div className="autobiography-container">
      <div className="autobiography-header">
        <h2 className="autobiography-title">Autobiography</h2>
        <div className="autobiography-subtitle">CHAPTERS</div>
      </div>

      <div className="autobiography-chapter-list">
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

      <div className="autobiography-detail" aria-live="polite">
        {activeEntry ? (
          <div className="autobiography-chapter">
            <div className="autobiography-chapter-header">
              <div className="autobiography-chapter-title">{activeEntry.title}</div>
              <div className="autobiography-chapter-meta">{activeEntry.date}</div>
            </div>
            <div className="autobiography-chapter-body">
              {activeEntry.content.split('\n').map((line, idx) => (
                <p key={idx} className="autobiography-text">{line}</p>
              ))}
            </div>
            <div className="autobiography-chapter-footer">
              <div className="autobiography-alerts">
                {activeEntry.alerts.map((alert, idx) => (
                  <span key={idx} className="autobiography-alert">ALERT: {alert}</span>
                ))}
              </div>
              <div className="autobiography-actions">
                <Link to="/about" className="autobiography-button secondary">
                  About Overview
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="autobiography-placeholder">SELECT A CHAPTER TO BEGIN READING</div>
        )}
      </div>
    </div>
  );
};

export default Autobiography;
