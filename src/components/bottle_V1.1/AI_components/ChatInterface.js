
import React, { useState } from 'react';
import { Send, CornerDownLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useChatAgent from '../hooks/useChatAgent';
import Message from './Message';
import ConfirmationDialog from './ConfirmationDialog';
import { agentConfig as allAgentConfigs } from '../config/agent-config';

const ChatInterface = ({ agentId }) => {
  const navigate = useNavigate();
  const [pendingConfirmation, setPendingConfirmation] = useState(null);
  const {
    currentAgentConfig,
    messages,
    userInput,
    loading,
    error,
    showScrollToBottom,
    setUserInput,
    handleSendMessage,
    handleKeyDown,
    handleScroll,
    scrollToBottom,
    inputRef,
    messagesEndRef,
    messagesContainerRef,
    remainingInteractions,
    subscription
  } = useChatAgent({ agentId });

  // Loading state
  if (!currentAgentConfig && loading) {
    return (
      <div className="flex items-center justify-center h-full bg-header rounded-lg text-text-main">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-accent"></div>
        <span className="ml-3">Initializing agent...</span>
      </div>
    );
  }

  // Error state
  if (!currentAgentConfig) {
    return (
      <div className="flex items-center justify-center h-full bg-header rounded-lg text-red-400 p-4 text-center">
        Error: Agent configuration for ID "{agentId}" not found.
      </div>
    );
  }

  const handleConfirm = () => {
    if (pendingConfirmation?.onConfirm) {
      pendingConfirmation.onConfirm();
    }
    setPendingConfirmation(null);
  };

  const handleReject = () => {
    if (pendingConfirmation?.onReject) {
      pendingConfirmation.onReject();
    }
    setPendingConfirmation(null);
  };

  return (
    <div className="flex flex-col h-full bg-header rounded-lg shadow-main overflow-hidden border border-brand-line">
      {/* Confirmation Dialog */}
      {pendingConfirmation && (
        <ConfirmationDialog
          action={pendingConfirmation}
          onConfirm={handleConfirm}
          onReject={handleReject}
        />
      )}

      {/* Header with Agent Selector */}
      <div className="p-4 border-b border-brand-line">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-header text-text-header agent-name">
            {currentAgentConfig.name}
          </h2>
          {subscription === 'free' && (
            <div className="text-sm text-brand-text-muted">
              {remainingInteractions} interactions remaining
            </div>
          )}
        </div>

        {/* Agent Selector */}
        <div className="agent-selector">
          {allAgentConfigs.getAll().map((agent) => (
            <button
              key={agent.id}
              onClick={() => navigate(`/chat/${agent.id}`)}
              className={`selector-button ${agentId === agent.id ? 'active' : ''}`}
              title={`Switch to ${agent.name}`}
              aria-label={`Switch to ${agent.name}`}
              aria-pressed={agentId === agent.id}
            >
              <span className="agent-emoji">{agent.emoji}</span>
              <span className="agent-label">{agent.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Messages List */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-grow p-4 overflow-y-auto"
      >
        <div className="space-y-4">
          {messages.map((msg, index) => (
            <Message
              key={index}
              message={msg}
            />
          ))}
        </div>
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      {showScrollToBottom && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-24 right-6 bg-sidebar-hover p-2 rounded-full text-text-main hover:bg-brand-accent transition-colors"
          aria-label="Scroll to bottom"
        >
          <CornerDownLeft size={20} />
        </button>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-2 text-center bg-red-900 bg-opacity-50 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t border-brand-line">
        <div className="relative flex items-center">
          <textarea
            ref={inputRef}
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask ${currentAgentConfig.name}...`}
            disabled={loading}
            className="w-full bg-app border border-brand-line rounded-md p-3 pr-24 resize-none text-text-main placeholder-brand-text-muted focus:ring-2 focus:ring-brand-accent focus:outline-none transition-all duration-200"
            rows={1}
          />
          <div className="absolute right-2 flex items-center">
            <button
              onClick={handleSendMessage}
              disabled={loading || !userInput.trim()}
              className="ml-2 bg-brand-accent text-brand-text-dark p-2 rounded-md hover:bg-yellow-400 disabled:bg-brand-line disabled:cursor-not-allowed transition-colors"
              title="Send Message"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-t-transparent border-brand-text-dark rounded-full animate-spin"></div>
              ) : (
                <Send size={20} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
