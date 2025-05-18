// src/routes/Terminal/Terminal.js
// Terminal.js - Key modifications
import React, { useState, useEffect, useCallback } from 'react';
import journalEntries, { getAllEntries } from '../../TermJourn/journalLogs';
import MemoizedJournalEntry from '../../TermJourn/Journal';
import TypingText from './TypingText'; // Import the new component
import './Terminal.css';        // Your main terminal styles
import './TypingText.css';      // Import styles for TypingText (or ensure it's globally available)

const Terminal = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [showJournal, setShowJournal] = useState(false);
  const [entries, setEntries] = useState([]);
  const [selectedEntryId, setSelectedEntryId] = useState(null); // To highlight selected item

  // New state for the content to be typed
  const [activeTypingContent, setActiveTypingContent] = useState('');
  // Key to force re-render of TypingText when new content is selected
  const [typingInstanceKey, setTypingInstanceKey] = useState(0);

  useEffect(() => {
    setEntries(getAllEntries() || journalEntries);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => setShowJournal(true), 300);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  const handleEntrySelect = useCallback((entry) => {
    setSelectedEntryId(entry.id);
    // Format the content for typing. Explicitly use '\n' for newlines.
    const formattedContent = `ENTRY ID: ${entry.id}\nDATE    : ${new Date(entry.date).toLocaleDateString()} ${new Date(entry.date).toLocaleTimeString()}\nTITLE   : ${entry.title}\n----------------------------------------\n${entry.content}`;
    setActiveTypingContent(formattedContent);
    setTypingInstanceKey(prevKey => prevKey + 1); // Increment key to reset TypingText
  }, []);


  return (
    <div className="terminal-container">
      {isLoading ? (
        <div className="boot-sequence">
          <div className="terminal-line ">INITIALIZING JAIR ENTERPRISES TERMINAL V2.1...<span className="typing-effect-cursor">_</span></div>
          <div className="terminal-line ">MEMORY CHECK...........................OK<span className="typing-effect-cursor">_</span></div>
          <div className="terminal-line ">LOADING AS/400 EMULATION MODULE......<span className="typing-effect-cursor">_</span></div>
          <div className="terminal-line ">SYSTEM BOOT COMPLETE.<span className="typing-effect-cursor">_</span></div>
        </div>
      ) : (
        <div className="terminal-content-wrapper"> {/* For better layout control */}
          <div className="terminal-main-display">
            <div className="terminal-header">
              <div className="terminal-system-name">JAIR ENTERPRISES OS/400</div>
              <div className="terminal-datetime">{new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</div>
            </div>
            <div className="terminal-status-bar">
              <span>TERMINAL ID: JAIR001</span><span>STATUS: ONLINE</span>
            </div>

            {showJournal && (
              <div className="journal-section">
                <div className="journal-header-title">SYSTEM JOURNAL LOGS - SELECT AN ENTRY TO VIEW</div>
                <div className="entries-list">
                  {entries.length > 0 ? entries.map(entry => (
                    <MemoizedJournalEntry
                      key={entry.id}
                      entry={entry}
                      className={`journal-entry-list-item ${selectedEntryId === entry.id ? 'selected' : ''}`}
                      onClick={() => handleEntrySelect(entry)}
                      // Ensure MemoizedJournalEntry is simple, e.g.:
                      // <div className={props.className} onClick={props.onClick}>
                      //   <span>{props.entry.id}</span> - <span>{props.entry.title}</span>
                      // </div>
                    />
                  )) : <div className="terminal-line">NO JOURNAL ENTRIES FOUND.</div>}
                </div>
              </div>
            )}
          </div>

          {/* Area for displaying the typed journal content */}
          {activeTypingContent && !isLoading && showJournal && (
            <div className="typed-journal-output-area">
              <div className="journal-output-section-header">--- SELECTED JOURNAL ENTRY ---</div>
              <TypingText
                key={typingInstanceKey} // Use key to reset component on content change
                fullText={activeTypingContent}
                typingSpeed={25} // Adjust speed (ms per character)
              />
            </div>
          )}

          {!isLoading && (
            <div className="terminal-command-line">
              <span>CMD&gt;</span> <span className="typing-effect-cursor">_</span> {/* Re-using cursor style */}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Terminal;