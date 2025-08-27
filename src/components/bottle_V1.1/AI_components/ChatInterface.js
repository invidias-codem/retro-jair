// ./components/bottle_V1.1/AI_components/ChatInterface.js
import React, { useState, useMemo, Suspense } from 'react';
import ScrollToPageTopButton from './ScrollTopBtn';
import './common/chatInterface.css';

// 1. Lazily import agent components for better performance.
// Each component will only be downloaded when it's first selected.
const TechChat = React.lazy(() => import('./agents/TechChat'));
const StemChat = React.lazy(() => import('./agents/StemChat'));
const BishopChat = React.lazy(() => import('./agents/BishopChat'));

// 2. Centralize agent configuration in a single, easily updatable object.
// This makes the component data-driven and scalable.
const AGENT_CONFIG = {
  tech: {
    id: 'tech',
    name: 'Tech Genie',
    emoji: '🤖',
    component: TechChat,
  },
  stem: {
    id: 'stem',
    name: 'Professor AI',
    emoji: '🔬',
    component: StemChat,
  },
  bishop: {
    id: 'bishop',
    name: 'Bishop AI',
    emoji: '📖',
    component: BishopChat,
  },
};

const ChatInterface = () => {
  // Set the default agent by its key from the config.
  const [activeAgentId, setActiveAgentId] = useState('tech');

  // 3. Memoize the active component to prevent unnecessary re-calculations.
  const ActiveAgentComponent = useMemo(() => {
    return AGENT_CONFIG[activeAgentId]?.component || null;
  }, [activeAgentId]);

  return (
    <div className="chat-interface-container">
      {/* 4. Dynamically generate selector buttons from the config object. */}
      <div className="agent-selector">
        {Object.values(AGENT_CONFIG).map((agent) => (
          <button
            key={agent.id}
            onClick={() => setActiveAgentId(agent.id)}
            className={`selector-button ${activeAgentId === agent.id ? 'active' : ''}`}
            aria-pressed={activeAgentId === agent.id}
          >
            {agent.emoji} {agent.name}
          </button>
        ))}
      </div>

      {/* 5. Render the active agent inside a Suspense boundary. */}
      {/* This shows a fallback UI while the lazy-loaded component is fetched. */}
      <div className="active-chat-agent">
        <Suspense fallback={<div className="loading-placeholder">Loading Chat...</div>}>
          {ActiveAgentComponent ? <ActiveAgentComponent /> : <p>Select an agent to begin.</p>}
        </Suspense>
      </div>

      <ScrollToPageTopButton scrollThreshold={400} />
    </div>
  );
};

export default ChatInterface;