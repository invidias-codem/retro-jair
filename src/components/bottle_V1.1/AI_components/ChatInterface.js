// ./components/bottle_V1.1/AI_components/ChatInterface.js
import React, { useState } from 'react';

// Import the specific chat agent components
// Adjust paths if necessary based on your actual file structure
import TechChat from './agents/TechChat';
import StemChat from './agents/StemChat'; // Assuming stem.js is renamed/created here

// Optional: Import common chat styles if needed for the interface itself
import './common/chatInterface.css'; // Create this CSS file for styling selectors etc.

const ChatInterface = () => {
  // State to manage which agent is active
  const [activeAgent, setActiveAgent] = useState('tech'); // Default to 'tech'

  return (
    <div className="chat-interface-container">
      {/* Agent Selector UI */}
      <div className="agent-selector">
        <button
          onClick={() => setActiveAgent('tech')}
          className={`selector-button ${activeAgent === 'tech' ? 'active' : ''}`}
        >
          🤖 Tech Genie
        </button>
        <button
          onClick={() => setActiveAgent('stem')}
          className={`selector-button ${activeAgent === 'stem' ? 'active' : ''}`}
        >
          🔬 Professor AI
        </button>
        {/* Add more buttons here if you create more agents */}
      </div>

      {/* Conditionally Render the Active Agent Component */}
      <div className="active-chat-agent">
        {activeAgent === 'tech' && <TechChat />}
        {activeAgent === 'stem' && <StemChat />}
        {/*
           Note: TechChat and StemChat currently manage their own modal state (isModalOpen).
           If you want this ChatInterface to *always* show the chat without needing an
           "Open" button inside the agent components, you'll need to adjust the agent
           components to render their content directly without checking isModalOpen,
           or manage the modal visibility from here.
           For now, assuming the agent components render their "Open" button or are always visible.
        */}
      </div>
    </div>
  );
};

export default ChatInterface;