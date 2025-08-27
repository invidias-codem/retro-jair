import React, { Suspense, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { useFocusTrap } from '../../hooks/accessibility.js';

/**
 * A highly reusable and accessible modal component that provides an overlay,
 * focus trapping, and closing logic, while delegating all content rendering
 * to a dynamically provided child component.
 *
 * @param {object} props The component props.
 * @param {object} props.agentConfig The configuration for the agent component to render.
 * @param {boolean} props.isOpen Controls the visibility of the modal.
 * @param {function} props.onClose Callback function to close the modal.
 * @param {string} props.subscription The user's subscription tier.
 * @returns {JSX.Element|null}
 */
const ChatModal = ({ agentConfig, isOpen, onClose, subscription }) => {
  const modalRef = useFocusTrap(isOpen); // The hook now takes isOpen to manage its state.

  // Destructure required properties from agentConfig for cleaner validation.
  const AgentComponent = agentConfig?.component;
  const agentId = agentConfig?.id;

  // Memoize the onClose handler to prevent unnecessary re-renders.
  const handleClose = useCallback(() => {
    if (typeof onClose === 'function') {
      onClose();
    }
  }, [onClose]);

  // Effect to handle side effects when the modal opens or closes.
  useEffect(() => {
    // 1. Handle Escape key press
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    if (isOpen) {
      // 2. Prevent background scroll
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleKeyDown);
    }

    // 3. Cleanup function
    return () => {
      document.body.style.overflow = 'auto';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleClose]);

  // Early return if the modal should not be rendered.
  if (!isOpen || !AgentComponent || !agentId) {
    if (isOpen) {
      console.error("ChatModal: Invalid `agentConfig` provided. It must include `id` and `component`.");
    }
    return null;
  }

  // Clicks on the overlay will close the modal, but clicks on the content will not.
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <div
      className={`modal-overlay ${agentId}-modal-overlay`}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${agentId}-title`} // Assume the agent component provides a title with this ID.
    >
      <div
        className={`modal-content-wrapper ${agentId}-modal-content`}
        ref={modalRef}
      >
        <Suspense fallback={
          <div className="loading-fallback">
            <FontAwesomeIcon icon={faSpinner} spin size="2x" />
            <p>Loading Interface...</p>
          </div>
        }>
          {/*
            Render the specific agent component.
            It's now responsible for its own header, body, and close button.
            We pass `onClose` so it can trigger the closing action.
          */}
          <AgentComponent
            subscription={subscription}
            onClose={handleClose}
            // Pass the entire config if the component needs more details.
            config={agentConfig}
          />
        </Suspense>
      </div>
    </div>
  );
};

export default ChatModal;