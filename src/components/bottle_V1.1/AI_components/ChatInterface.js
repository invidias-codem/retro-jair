// ./components/bottle_V1.1/AI_components/ChatInterface.js
import React, { useState } from 'react';
import ScrollToPageTopButton from './ScrollTopBtn';

// Import the specific chat agent components
import TechChat from './agents/TechChat';
import StemChat from './agents/StemChat';
import BishopChat from './agents/BishopChat'; 

// Optional: Import common chat styles
import './common/chatInterface.css';

const ChatInterface = () => {
  // State to manage which agent is active
  // Consider setting default to null or a specific agent like 'tech'
  const [activeAgent, setActiveAgent] = useState('tech');

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
        {/* 2. Add the new button for Bishop AI */}
        <button
          onClick={() => setActiveAgent('bishop')}
          className={`selector-button ${activeAgent === 'bishop' ? 'active' : ''}`}
        >
          📖 Bishop AI {/* Or use faBookBible icon */}
        </button>
      </div>

      {/* Conditionally Render the Active Agent Component */}
      <div className="active-chat-agent">
        {activeAgent === 'tech' && <TechChat />}
        {activeAgent === 'stem' && <StemChat />}
        {/* 3. Add the conditional rendering for BishopChat */}
        {activeAgent === 'bishop' && <BishopChat />}
      </div>

      <ScrollToPageTopButton scrollThreshold={400} />

    </div>
  );
};

export default ChatInterface;