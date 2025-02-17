// src/routes/Terminal/Terminal.js
import React, { useState, useEffect } from 'react';
import journalEntries, { getAllEntries } from '../../components/TermJourn/journalLogs';
import MemoizedJournalEntry from '../../components/TermJourn/Journal';
import './Terminal.css';

const Terminal = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [showJournal, setShowJournal] = useState(false);
  const [entries, setEntries] = useState([]);
  const [selectedEntryId, setSelectedEntryId] = useState(null);

  useEffect(() => {
    setEntries(getAllEntries() || journalEntries);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        setShowJournal(true);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  return (
    <div className="terminal-container">
      {isLoading ? (
        <div className="boot-sequence">
          <div className="terminal-line">INITIALIZING JAIR ENTERPRISES TERMINAL...</div>
          <div className="terminal-line">LOADING SYSTEM PROTOCOLS...</div>
          <div className="terminal-line">ESTABLISHING SECURE CONNECTION...</div>
        </div>
      ) : (
        <div className="terminal-content">
          <div className="terminal-header">
            <div className="terminal-title">JAIR ENTERPRISES UNIFIED OPERATING SYSTEM</div>
            <div className="terminal-version">VERSION 1.0.0</div>
            <div className="terminal-line">ACCESS GRANTED</div>
            <div className="terminal-line">TERMINAL READY</div>
          </div>

          {showJournal && (
            <div className="journal-section">
              <div className="terminal-line">ACCESSING JOURNAL LOGS...</div>
              <div className="entries-list">
                {entries.map(entry => (
                  <MemoizedJournalEntry
                    key={entry.id}
                    entry={entry}
                    isSelected={selectedEntryId === entry.id}
                    onClick={() => setSelectedEntryId(entry.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Terminal;