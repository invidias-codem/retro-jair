// accessibility.js
// Utilities and hooks for improving accessibility

import React, { useEffect, useRef, useState } from 'react';

/**
 * Accessibility utility functions and hooks
 * Implements ARIA best practices for chat and modal interfaces
 */

/**
 * Trap focus within a modal or dialog
 * @param {boolean} isActive - Whether the focus trap is active
 * @returns {Object} Ref to attach to the containing element
 */
export const useFocusTrap = (isActive = true) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;
    
    const container = containerRef.current;
    
    // Find all focusable elements
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length === 0) return;
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    // Auto-focus first element
    firstElement.focus();

    // Handle tabbing
    const handleKeyDown = (event) => {
      // Only handle tab key
      if (event.key !== 'Tab') return;
      
      // Shift + Tab
      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          event.preventDefault();
        }
      } 
      // Tab
      else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          event.preventDefault();
        }
      }
    };

    // Set up event listener
    container.addEventListener('keydown', handleKeyDown);
    
    // Store previous active element to restore focus later
    const previousActiveElement = document.activeElement;
    
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      
      // Restore focus when unmounting
      if (previousActiveElement) {
        previousActiveElement.focus();
      }
    };
  }, [isActive]);

  return containerRef;
};

/**
 * Announce messages to screen readers
 * @param {string} message - Message to announce
 * @param {string} politeness - ARIA live region politeness ('polite' or 'assertive')
 */
export const useAnnounce = () => {
  const announceRef = useRef(null);
  
  const announce = (message, politeness = 'polite') => {
    if (!announceRef.current) return;
    
    // Create or update the live region
    announceRef.current.setAttribute('aria-live', politeness);
    
    // Set the message
    announceRef.current.textContent = message;
    
    // Clear after a delay
    setTimeout(() => {
      if (announceRef.current) {
        announceRef.current.textContent = '';
      }
    }, 3000);
  };
  
  const Announcer = () => (
    <div 
      ref={announceRef}
      className="sr-only"
      aria-live="polite"
      aria-atomic="true"
    ></div>
  );
  
  return { announce, Announcer };
};

/**
 * Add keyboard shortcuts to a component
 * @param {Object} shortcuts - Map of key combinations to callback functions
 * @param {boolean} isActive - Whether shortcuts are active
 */
export const useKeyboardShortcuts = (shortcuts, isActive = true) => {
  useEffect(() => {
    if (!isActive) return;
    
    const handleKeyDown = (event) => {
      // Skip if user is typing in an input, textarea, or contentEditable element
      if (
        event.target.tagName === 'INPUT' ||
        event.target.tagName === 'TEXTAREA' ||
        event.target.isContentEditable
      ) {
        return;
      }
      
      // Build key combination string
      let combo = '';
      if (event.ctrlKey) combo += 'Ctrl+';
      if (event.altKey) combo += 'Alt+';
      if (event.shiftKey) combo += 'Shift+';
      if (event.metaKey) combo += 'Meta+';
      
      combo += event.key;
      
      // Check if combo matches a shortcut
      if (shortcuts[combo] && typeof shortcuts[combo] === 'function') {
        event.preventDefault();
        shortcuts[combo](event);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts, isActive]);
};

/**
 * Enhanced scrolling for chat interfaces
 * @param {boolean} smoothScroll - Whether to use smooth scrolling
 * @returns {Object} Refs and functions for scrolling
 */
export const useChatScroll = (smoothScroll = true) => {
  const containerRef = useRef(null);
  const endRef = useRef(null);
  const isUserScrolled = useRef(false);
  
  const scrollToBottom = (force = false) => {
    if (!endRef.current || (!force && isUserScrolled.current)) return;
    
    endRef.current.scrollIntoView({
      behavior: smoothScroll ? 'smooth' : 'auto',
      block: 'end'
    });
  };
  
  const handleScroll = () => {
    if (!containerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isScrolledToBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 10;
    
    // Update user scroll state
    isUserScrolled.current = !isScrolledToBottom;
    
    // Add/remove new messages indicator
    if (containerRef.current.classList) {
      if (isUserScrolled.current) {
        containerRef.current.classList.add('has-new-messages');
      } else {
        containerRef.current.classList.remove('has-new-messages');
      }
    }
  };
  
  return {
    containerRef,
    endRef,
    scrollToBottom,
    handleScroll,
    isUserScrolled: () => isUserScrolled.current
  };
};

/**
 * Skip to content link for keyboard users
 * @returns {JSX.Element} Skip link component
 */
export const SkipToContent = ({ contentId = 'main-content' }) => {
  return (
    <a 
      href={`#${contentId}`} 
      className="skip-to-content"
      tabIndex="0"
    >
      Skip to main content
    </a>
  );
};

/**
 * Enhanced focus indicator for keyboard users
 * Adds a focus outline only when using keyboard navigation
 */
export const useFocusVisible = () => {
  useEffect(() => {
    // Add class to body when tab key is pressed
    const handleKeyDown = (e) => {
      if (e.key === 'Tab') {
        document.body.classList.add('keyboard-user');
      }
    };
    
    // Remove class when mouse is used
    const handleMouseDown = () => {
      document.body.classList.remove('keyboard-user');
    };
    
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);
};

/**
 * Message pagination for long chat histories
 * @param {Array} messages - Array of messages
 * @param {number} pageSize - Number of messages per page
 * @returns {Object} Pagination state and controls
 */
export const usePagination = (messages, pageSize = 20) => {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(messages.length / pageSize);
  
  // Get current page of messages
  const currentMessages = messages.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );
  
  // Go to next page
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };
  
  // Go to previous page
  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };
  
  // Go to specific page
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
  
  // Always set to last page when new messages are added
  useEffect(() => {
    // If we're on the last page or near it, go to new last page
    if (currentPage >= totalPages - 1) {
      setCurrentPage(totalPages);
    }
  }, [messages.length, totalPages, currentPage]);
  
  return {
    currentMessages,
    currentPage,
    totalPages,
    nextPage,
    prevPage,
    goToPage,
    hasPrevPage: currentPage > 1,
    hasNextPage: currentPage < totalPages
  };
};

/**
 * High contrast mode toggle
 * @param {boolean} initialState - Initial high contrast state
 * @returns {Object} High contrast state and toggle function
 */
export const useHighContrast = (initialState = false) => {
  // Try to get saved preference
  const savedPreference = typeof localStorage !== 'undefined' && 
    localStorage.getItem('high-contrast-mode');
  
  const [highContrast, setHighContrast] = useState(
    savedPreference !== null ? JSON.parse(savedPreference) : initialState
  );
  
  // Update document class when high contrast mode changes
  useEffect(() => {
    if (highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
    
    // Save preference
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('high-contrast-mode', JSON.stringify(highContrast));
    }
  }, [highContrast]);
  
  // Toggle high contrast mode
  const toggleHighContrast = () => {
    setHighContrast(prev => !prev);
  };
  
  return { highContrast, toggleHighContrast };
};

// Add other a11y helper functions as needed