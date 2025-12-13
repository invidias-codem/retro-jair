import React, { createContext, useState, useContext, useCallback } from 'react';
import { agentConfig } from '../config/agent-config';

const ChatContext = createContext(null);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const [activeAgentId, setActiveAgentId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // --- OPTIMIZATION 1: Manage button visibility in the context ---
  const [isChatButtonVisible, setIsChatButtonVisible] = useState(true);
  
  const [theme, setTheme] = useState(null);
  const [userSubscription, setUserSubscription] = useState('free');

  // --- REMOVED: The call to useChatAgent is removed to break the circular dependency ---

  const openChatModal = useCallback((agentId) => {
    if (agentConfig.hasAgent(agentId)) {
      setActiveAgentId(agentId);
      setIsModalOpen(true);
      
      // --- OPTIMIZATION 2: Hide the button when the modal opens ---
      setIsChatButtonVisible(false);
      
      const agent = agentConfig.getById(agentId);
      if (agent && !theme) {
        setTheme(agent.defaultTheme);
      }
    } else {
      console.error(`Agent with ID "${agentId}" not found in configuration.`);
    }
  }, [theme]);

  const closeChatModal = useCallback(() => {
    // Reset the agent ID immediately. This tells useChatAgent to clean up.
    setActiveAgentId(null); 
    
    // Now, close the modal.
    setIsModalOpen(false);
    
    // --- OPTIMIZATION 3: Show the button again when the modal closes ---
    setIsChatButtonVisible(true);
  }, []);

  const toggleChatModal = useCallback((agentId) => {
    if (isModalOpen) {
      closeChatModal();
    } else {
      openChatModal(agentId);
    }
  }, [isModalOpen, openChatModal, closeChatModal]);

  const toggleTheme = useCallback(() => {
    if (!activeAgentId) return;
    const agent = agentConfig.getById(activeAgentId);
    if (!agent) return;
    const themeOptions = Object.keys(agent.themes);
    if (themeOptions.length < 2) return;
    const currentIndex = themeOptions.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themeOptions.length;
    setTheme(themeOptions[nextIndex]);
  }, [activeAgentId, theme]);

  const updateSubscription = useCallback((tier) => {
    setUserSubscription(tier);
  }, []);

  const activeAgentConfig = activeAgentId ? agentConfig.getById(activeAgentId) : null;

  const value = {
    // State
    isModalOpen,
    activeAgentId,
    activeAgentConfig,
    theme,
    userSubscription,
    isChatButtonVisible, // <-- Expose the new state
    
    // All agents
    agents: agentConfig.getAllConfigs(),

    // Actions
    openChatModal,
    closeChatModal,
    toggleChatModal,
    toggleTheme,
    updateSubscription,
    
    // Helper methods
    getAgentById: agentConfig.getById,
    hasAgent: agentConfig.hasAgent,
    getAgentByMode: agentConfig.getByMode,

    // --- REMOVED: Chat session state is no longer managed here ---
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};
