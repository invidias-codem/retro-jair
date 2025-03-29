import React, { createContext, useState, useContext, useCallback } from 'react';
import { agentConfig } from '../config/agent-config'; // Use the instance, not the function

// 1. Create the Context
const ChatContext = createContext();

// 2. Create the Provider Component
export const ChatProvider = ({ children }) => {
  const [activeAgentId, setActiveAgentId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [theme, setTheme] = useState(null);
  const [userSubscription, setUserSubscription] = useState('free');

  // Function to open the chat modal for a specific agent
  const openChatModal = useCallback((agentId) => {
    // Use hasAgent to check if the agent exists
    if (agentConfig.hasAgent(agentId)) {
      setActiveAgentId(agentId);
      setIsModalOpen(true);
      
      // Set default theme if not already set
      const agent = agentConfig.getById(agentId);
      if (agent && !theme) {
        setTheme(agent.defaultTheme);
      }
    } else {
      console.error(`Agent with ID "${agentId}" not found in configuration.`);
    }
  }, [theme]);

  // Function to close the chat modal
  const closeChatModal = useCallback(() => {
    setIsModalOpen(false);
    
    // Optionally reset active agent after a delay to allow modal fade-out
    setTimeout(() => setActiveAgentId(null), 300);
  }, [activeAgentId]);

  // Toggle theme for the current agent
  const toggleTheme = useCallback(() => {
    if (!activeAgentId) return;
    
    const agent = agentConfig.getById(activeAgentId);
    if (!agent) return;
    
    const themeOptions = Object.keys(agent.themes);
    if (themeOptions.length < 2) return;
    
    const currentIndex = themeOptions.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themeOptions.length;
    const newTheme = themeOptions[nextIndex];
    
    setTheme(newTheme);
  }, [activeAgentId, theme]);

  // Update subscription tier
  const updateSubscription = useCallback((tier) => {
    setUserSubscription(tier);
  }, [userSubscription]);

  // Get the configuration for the currently active agent
  const activeAgentConfig = activeAgentId ? agentConfig.getById(activeAgentId) : null;

  // 3. Define the Context Value
  const value = {
    // State
    isModalOpen,
    activeAgentId,
    activeAgentConfig, // Derived state: config of the active agent
    theme,
    userSubscription,
    
    // All agents
    agents: agentConfig.getAllConfigs(), // Get array of all agent configs

    // Actions
    openChatModal,
    closeChatModal,
    toggleTheme,
    updateSubscription,
    
    // Helper methods
    getAgentById: agentConfig.getById,
    hasAgent: agentConfig.hasAgent,
    getAgentByMode: agentConfig.getByMode
  };

  // 4. Return the Provider wrapping children
  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

// 5. Create a custom hook for easy consumption
export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};