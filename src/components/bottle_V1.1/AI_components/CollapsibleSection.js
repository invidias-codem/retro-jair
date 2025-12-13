import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import './CollapsibleSection.css';

/**
 * CollapsibleSection component for long responses.
 * Allows users to expand/collapse content with smooth animations.
 */
const CollapsibleSection = ({
  title = 'Show more',
  children,
  defaultOpen = false,
  maxHeightCollapsed = '200px',
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="collapsible-section">
      <button
        className="collapsible-header"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls="collapsible-content"
      >
        <span className="collapsible-title">{title}</span>
        <ChevronDown
          size={18}
          className={`collapsible-icon ${isOpen ? 'open' : ''}`}
        />
      </button>

      <div
        id="collapsible-content"
        className={`collapsible-content ${isOpen ? 'open' : ''}`}
        style={{
          maxHeight: isOpen ? '1000px' : maxHeightCollapsed,
        }}
      >
        <div className="collapsible-inner">
          {children}
        </div>
      </div>
    </div>
  );
};

export default CollapsibleSection;
