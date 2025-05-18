// Journal.js - Refined for list display
import React, { useCallback, memo } from 'react';
// journalLogs import is not strictly needed here if Terminal.js handles data fetching/passing
// import journalLogs from './journalLogs'; // Can be removed if entry is always passed as prop

// We are removing the Modal component and its direct usage from this file.
// The typing effect will be handled by Terminal.js using the TypingText component.

/**
 * @typedef {Object} JournalEntryType
 * @property {string} id - Unique identifier
 * @property {string} date - Entry date
 * @property {string} title - Entry title
 * @property {string} initialStatus - System status (optional, if used in list)
 * @property {string} content - Main content (used by Terminal.js for typing)
 * @property {string} details - Additional details (used by Terminal.js for typing)
 * @property {string[]} alerts - System alerts (used by Terminal.js for typing)
 */

/**
 * Journal Entry component for displaying an item in a list.
 * The actual typing out of content will be handled by a different component
 * managed by the parent (e.g., Terminal.js).
 *
 * @param {{
 * entry: JournalEntryType,
 * isSelected?: boolean,
 * onClick?: (entry: JournalEntryType) => void, // onClick now passes the entry
 * className?: string // To be used by Terminal.js for AS/400 list item styling
 * }} props
 */
const JournalEntry = ({
  entry,
  isSelected = false, // isSelected might not be used directly by this component anymore for styling if parent handles it via className
  onClick = () => {},
  className = "" // Default className to empty string
}) => {
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault(); // Prevent default space scroll
      onClick(entry); // Pass the entry data on click
    }
  }, [onClick, entry]);

  const handleClick = useCallback(() => {
    onClick(entry); // Pass the entry data on click
  }, [onClick, entry]);

  // Handle invalid entry data
  if (!entry || typeof entry !== 'object' || !entry.id) {
    // Simple fallback for invalid entry data, can be styled further in Journal.css if needed
    return (
      <div className={`${className} journal-entry-list-item error`} role="alert">
        <span>INVALID ENTRY DATA</span>
      </div>
    );
  }

  // Destructure with defaults for type safety in list display
  const {
    id = 'N/A',
    date = 'Unknown Date',
    title = 'Untitled Entry'
  } = entry;

  // Formatting for display in the list (AS/400 style)
  // Example: "JE001   02.17.2025   Foundation Day - Jair Enterprises Launch"
  // The styling of this will be primarily handled by Terminal.css's .journal-entry-list-item
  const displayDate = new Date(date).toLocaleDateString('en-US', {
    year: 'numeric', month: '2-digit', day: '2-digit'
  });

  return (
    // The className prop will be provided by Terminal.js (e.g., "journal-entry-list-item selected")
    <div
      className={className} // Use the className passed from Terminal.js
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyPress={handleKeyPress}
      aria-label={`Journal entry: ${title}, dated ${displayDate}`}
      title={`Select to view: ${title}`} // Tooltip
    >
      {/* Structure for AS/400 style list item: ID, Date, Title */}
      {/* These spans can be targeted by Terminal.css for specific column-like alignment if needed */}
      <span className="entry-id">{id}</span>
      <span className="entry-date-summary">{displayDate}</span>
      <span className="entry-title-summary">{title}</span>
    </div>
  );
};

// Memoize the component
const MemoizedJournalEntry = memo(JournalEntry);
MemoizedJournalEntry.displayName = 'MemoizedJournalEntry'; // Corrected displayName

// We are removing JournalList from here as Terminal.js will handle the list rendering.
// If JournalList is used elsewhere, it would need to be adapted or this file becomes solely for MemoizedJournalEntry.
// For the purpose of integrating with Terminal.js, we only need to export MemoizedJournalEntry.

export default MemoizedJournalEntry;
