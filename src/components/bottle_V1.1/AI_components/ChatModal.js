
import React, { Suspense } from 'react';
import { useChat } from '../context/useContext';
import './ChatModal.css';

// Lazy load the ChatInterface and its provider
const ChatInterface = React.lazy(() => import('./ChatInterface'));
const AgentSessionProvider = React.lazy(() =>
  import('./framework/agentFramework').then(m => ({ default: m.AgentSessionProvider }))
);

const ChatModal = () => {
    const { isChatOpen, closeChat } = useChat();

    if (!isChatOpen) {
        return null; // Don't render anything if the chat is not open
    }

    // Close the modal if the user clicks on the background overlay
    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            closeChat();
        }
    };

    return (
        <div className="chat-modal-overlay" onClick={handleOverlayClick}>
            <div className="chat-modal-container">
                <button className="chat-modal-close-button" onClick={closeChat} aria-label="Close chat">
                    &times;
                </button>
                <div className="chat-modal-content">
                    <Suspense fallback={<div className="route-fallback">Loading Chat...</div>}>
                        <AgentSessionProvider>
                            <ChatInterface agentId="tech-genie" />
                        </AgentSessionProvider>
                    </Suspense>
                </div>
            </div>
        </div>
    );
};

export default ChatModal;
