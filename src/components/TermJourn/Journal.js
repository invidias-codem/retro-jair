import React, { useState, useCallback, memo } from 'react';
import { ChevronRight, X } from 'lucide-react';
import journalLogs from './journalLogs';

// Console log to verify data is imported correctly
console.log('Imported Journal Logs:', journalLogs);

/**
 * @typedef {Object} JournalEntryType
 * @property {string} id - Unique identifier
 * @property {string} date - Entry date
 * @property {string} title - Entry title
 * @property {string} initialStatus - System status
 * @property {string} content - Main content
 * @property {string} details - Additional details
 * @property {string[]} alerts - System alerts
 */

/**
 * Modal component for displaying full journal entry details
 * @param {{ entry: JournalEntryType, onClose: () => void }} props
 */
const Modal = memo(({ entry, onClose }) => {
  // Move hooks to the top level
  const handleOverlayClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  if (!entry) return null;

  const {
    id = '',
    date = '',
    title = '',
    initialStatus = '',
    content = '',
    details = '',
    alerts = []
  } = entry;

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button 
          className="modal-close-button" 
          onClick={onClose} 
          aria-label="Close modal"
        >
          <X size={24} />
        </button>
        
        <div className="modal-header">
          <div className="terminal-line">JAIR ENTERPRISES UNIFIED OPERATING SYSTEM</div>
          <div className="terminal-line">ENTRY #{id} - {date}</div>
          <div className="terminal-title">{title}</div>
        </div>

        {initialStatus && (
          <div className="status-section">
            <div className="terminal-line">STATUS: {initialStatus}</div>
          </div>
        )}

        <div className="content-section">
          <div className="terminal-content">
            {content || 'No content available'}
          </div>
        </div>

        {details && (
          <div className="details-section">
            <div className="section-header">ADDITIONAL DETAILS</div>
            <div className="terminal-content">{details}</div>
          </div>
        )}

        {Array.isArray(alerts) && alerts.length > 0 && (
          <div className="alerts-section">
            <div className="section-header">SYSTEM ALERTS</div>
            {alerts.map((alert, index) => (
              <div 
                key={`alert-${id}-${index}`} 
                className="alert-item"
                role="alert"
              >
                {`>${alert}`}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

Modal.displayName = 'Modal';

/**
 * Journal Entry component displaying a collapsible entry with modal view
 * @param {{ 
 *   entry: JournalEntryType, 
 *   isSelected?: boolean, 
 *   onClick?: () => void 
 * }} props
 */
const JournalEntry = ({ 
  entry, 
  isSelected = false, 
  onClick = () => {} 
}) => {
  // All hooks at the top level
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handleReadMoreClick = useCallback((e) => {
    e.stopPropagation();
    setIsModalOpen(true);
  }, []);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      onClick();
    }
  }, [onClick]);

  // Handle invalid entry data
  if (!entry || typeof entry !== 'object') {
    return (
      <div className="journal-entry error" role="alert">
        <div className="entry-header">
          <span className="entry-title">Invalid Entry Data</span>
        </div>
      </div>
    );
  }

  // Destructure with defaults for type safety
  const {
    date = '',
    title = '',
    content = ''
  } = entry;

  return (
    <div className="journal-entry-wrapper">
      <div  
        className={`journal-entry ${isSelected ? 'selected' : ''}`}
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyPress={handleKeyPress}
      >
        <div className="entry-header">
          <span className="entry-date">{date}</span>
          <span className="entry-title">{title}</span>
        </div>
        <div className={`entry-content-container ${isSelected ? 'selected' : ''}`}>
          <div className="content-layout">
            <div className="content-text">
              {content 
                ? `${content.slice(0, 100)}${content.length > 100 ? '...' : ''}`
                : 'No content available'
              }
            </div>
            <button 
              className="read-more-button" 
              onClick={handleReadMoreClick} 
              aria-label="Read more"
            >
              <ChevronRight className="chevron-icon" />
            </button>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <Modal 
          entry={entry} 
          onClose={handleModalClose} 
        />
      )}
    </div>
  );
};

// Example usage with journal logs data
const JournalList = () => {
  const [selectedEntryId, setSelectedEntryId] = useState(null);

  return (
    <div className="journal-container">
      <h1>Jair Enterprises Journal</h1>
      <div className="entries-list">
        {journalLogs.map(entry => (
          <JournalEntry
            key={entry.id}
            entry={entry}
            isSelected={selectedEntryId === entry.id}
            onClick={() => setSelectedEntryId(entry.id)}
          />
        ))}
      </div>
    </div>
  );
};

// Memoize the components to prevent unnecessary re-renders
const MemoizedJournalEntry = memo(JournalEntry);
const MemoizedJournalList = memo(JournalList);

// Add display names for debugging
MemoizedJournalEntry.displayName = 'JournalEntry';
MemoizedJournalList.displayName = 'JournalList';

export { MemoizedJournalList as JournalList };
export default MemoizedJournalEntry;