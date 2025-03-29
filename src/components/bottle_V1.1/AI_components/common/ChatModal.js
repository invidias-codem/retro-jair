import React, { Suspense, useEffect, useCallback } from 'react'; // Added useCallback
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSpinner } from '@fortawesome/free-solid-svg-icons'; // Added faSpinner for fallback
import { useFocusTrap } from '../../hooks/accessibility.js';
// It's good practice to import PropTypes or use TypeScript for prop validation
// import PropTypes from 'prop-types';

/**
 * Unified Chat Modal Component
 *
 * A flexible modal container that can render any AI agent component
 * based on the provided configuration. Ensures focus trapping for accessibility.
 *
 * @param {Object} props Component props
 * @param {Object} props.agentConfig Configuration for the agent to render (requires id, component, name)
 * @param {boolean} props.isOpen Whether the modal is currently open
 * @param {Function} props.onClose Function to call when closing the modal
 * @param {string} props.subscription User's subscription tier
 * @returns {JSX.Element | null} The rendered modal component or null
 */
const ChatModal = ({
  agentConfig,
  isOpen = false,
  onClose,
  subscription = "free"
}) => {
  // Always use hooks at the top level
  const modalRef = useFocusTrap(); // Ensure useFocusTrap handles its own cleanup

  // Memoize onClose callback if it might change identity unnecessarily
  const handleClose = useCallback(() => {
      if (typeof onClose === 'function') {
          onClose();
      } else {
          console.warn("ChatModal: onClose prop is not a function.");
      }
  }, [onClose]);

  // Effect for focus trapping
  useEffect(() => {
    if (isOpen && modalRef.current) {
      // Activate the focus trap
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0];
      if (firstElement) {
        firstElement.focus();
      }
      // Ensure your useFocusTrap hook implementation correctly traps focus
      // and includes cleanup logic when the component unmounts or isOpen becomes false.
    }
    // If useFocusTrap doesn't handle its own cleanup, add it here
    // return () => { /* Deactivate trap */ };
  }, [isOpen, modalRef]); // Dependency array is correct

  // Effect for Escape key listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    if (isOpen) {
      // Add listener only when modal is open
      document.addEventListener('keydown', handleKeyDown);
    }

    // Cleanup listener when modal closes or component unmounts
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleClose]); // Add handleClose dependency

  // --- Early exit ---
  // If modal is not open or essential agent config is missing, don't render
  if (!isOpen || !agentConfig || typeof agentConfig.component !== 'function' || !agentConfig.id || !agentConfig.name) {
      if (isOpen && !agentConfig) {
        console.error("ChatModal: agentConfig prop is missing or invalid.");
      }
      // Add more specific checks/warnings if needed
      return null;
  }

  // --- Component Rendering ---
  const AgentComponent = agentConfig.component; // Already checked if it's a function (for lazy components)
  const theme = agentConfig.theme || agentConfig.defaultTheme || 'dark'; // Allow 'theme' or 'defaultTheme'
  const agentId = agentConfig.id;
  const agentName = agentConfig.name;

  return (
    <div
      className={`modal ${agentId}-modal`} // Use agentId which is checked for existence
      // Removed onKeyDown here, handled by useEffect for document listener
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${agentId}-modal-title`} // Use a dynamic title ID
    >
      <div
        className={`modal-content ${agentId}-theme ${theme}`} // Use theme derived above
        ref={modalRef}
        // Add tabIndex={-1} to make the div focusable programmatically if needed,
        // but focus should usually go to the first interactive element inside.
      >
        {/* Modal Header (Example) */}
        <div className="modal-header">
            <h2 id={`${agentId}-modal-title`} className="modal-title">
                {agentName} {/* Use agentName which is checked */}
            </h2>
            <button
              onClick={handleClose} // Use memoized handler
              className="close-button"
              aria-label="Close"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
        </div>

        {/* Agent Component Area */}
        <div className="modal-body">
            {/* Suspense Fallback: Shown while lazy component loads */}
            <Suspense fallback={
                <div className="loading-fallback">
                    <FontAwesomeIcon icon={faSpinner} spin size="2x" />
                    <p>Loading {agentName}...</p>
                </div>
            }>
                {/* Render the specific agent component */}
                {/* Consider adding an ErrorBoundary here */}
                <AgentComponent
                  config={agentConfig}
                  subscription={subscription}
                  onClose={handleClose} // Pass memoized handler
                  // Pass other necessary props down
                />
            </Suspense>
        </div>

        {/* Optional Modal Footer */}
        {/* <div className="modal-footer"> ... </div> */}

      </div>
    </div>
  );
};

/*
// Example PropTypes (install prop-types package)
ChatModal.propTypes = {
  agentConfig: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    component: PropTypes.elementType.isRequired, // For React components (incl. lazy)
    theme: PropTypes.string,
    defaultTheme: PropTypes.string,
    // other expected config props...
  }),
  isOpen: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  subscription: PropTypes.string,
};
*/

export default ChatModal;