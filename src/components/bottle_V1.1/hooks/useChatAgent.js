// src/components/bottle_V1.1/hooks/useChatAgent.js

import { createAgentAdapter } from '../AI_components/framework/agentFramework';
// import { startChatSession, sendMessage } from '../api/gemini'; // REMOVED
import { useChat } from '../context/useContext';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { agentConfig as allAgentConfigs } from '../config/agent-config';

const useChatAgent = (options) => {
  const agentId = options?.agentId;
  const { 
    theme, 
    toggleTheme, 
    userSubscription 
  } = useChat();

  // Get the agent config directly from the agentId prop
  const currentAgentConfig = useMemo(() => 
    agentId ? allAgentConfigs.getById(agentId) : null,
    [agentId]
  );

  // Core state
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  // const [chat, setChat] = useState(null); // REMOVED
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [remainingInteractions, setRemainingInteractions] = useState(5);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [notification, setNotification] = useState('');
  const [fileAttachment, setFileAttachment] = useState(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const agentAdapterRef = useRef(null);

  // Refs
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // REMOVED Gemini-specific chat initialization useEffect

  // Initialize agent adapter
  useEffect(() => {
    let isMounted = true;

    const setupAgent = async () => {
      if (!agentId) {
        setMessages([]);
        setError(null);
        return;
      }

      if (!currentAgentConfig) {
        setError("Agent configuration not found for this agent.");
        return;
      }

      setLoading(true);
      setError(null);
      setMessages([]); // Clear previous messages

      try {
        // Create and initialize the adapter for the given agent
        const adapter = createAgentAdapter(agentId);
        await adapter.initialize();

        if (isMounted) {
          agentAdapterRef.current = adapter;
          // Set initial message from agent config
          if (adapter.config.initialResponse) {
            setMessages([{
              role: 'model',
              text: adapter.config.initialResponse,
              timestamp: Date.now()
            }]);
          }
        }
      } catch (err) {
        console.error("Failed to initialize agent:", err);
        if (isMounted) {
          setError("Sorry, the AI agent failed to start. Please try again later.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    setupAgent();

    // Cleanup function
    return () => {
      isMounted = false;
      if (agentAdapterRef.current) {
        agentAdapterRef.current.teardown();
        agentAdapterRef.current = null;
      }
    };
  }, [agentId, currentAgentConfig]);

  // Send message handler using the agent adapter
  const handleSendMessage = useCallback(async () => {
    if (!userInput.trim() || !agentAdapterRef.current || loading) return;
    
    // Use a functional update to get the latest state without adding it to dependencies
    let canSend = true;
    if (userSubscription === 'free') {
      setRemainingInteractions(prev => {
        if (prev <= 0) {
          canSend = false;
          return 0;
        }
        return prev;
      });
    }

    if (!canSend) {
      setError('You have reached your free tier limit. Please upgrade to continue.');
      return;
    }

    const userMessage = {
      role: 'user',
      text: userInput,
      timestamp: Date.now()
    };

    // Add user message and a placeholder for the AI response
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);
    setError(null);
    const currentInput = userInput;
    setUserInput('');

    try {
      const response = await agentAdapterRef.current.sendMessage([{ text: currentInput }]);
      
      const aiMessage = {
        role: 'model',
        text: response.text,
        timestamp: Date.now(),
        imageUrl: response.imageUrl || null,
      };

      setMessages(prev => [...prev, aiMessage]);

      if (userSubscription === 'free') {
        setRemainingInteractions(prev => prev - 1);
      }

    } catch (err) {
      console.error("Error sending message:", err);
      const errorMessage = {
        role: 'model',
        text: `Sorry, I encountered an error: ${err.message}`,
        timestamp: Date.now(),
        isError: true,
      };
      setMessages(prev => [...prev, errorMessage]);
      setError("Message failed to send. Please check your connection or try again.");
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [userInput, loading, userSubscription]);

  // REMOVED second sendMessage function

  // Handle key press
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // Scroll handling
  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isScrolledToBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 10;
    setShowScrollToBottom(!isScrolledToBottom);
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Auto-scroll on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Copy response handler
  const handleCopyResponse = useCallback((text) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setNotification('Copied to clipboard!');
        setTimeout(() => setNotification(''), 2000);
      })
      .catch(err => {
        console.error('Failed to copy:', err);
        setNotification('Failed to copy');
        setTimeout(() => setNotification(''), 2000);
      });
  }, []);

  // Show notification helper
  const showNotification = useCallback((message) => {
    setNotification(message);
    setTimeout(() => setNotification(''), 3000);
  }, []);

  // Return values
  return {
    messages,
    userInput,
    loading,
    error,
    remainingInteractions,
    showScrollToBottom,
    notification,
    fileAttachment,
    isGeneratingImage,
    currentAgentConfig, // <-- Use the locally derived config
    subscription: userSubscription,

    // Refs
    inputRef,
    messagesEndRef,
    messagesContainerRef,

    // Handlers
    setUserInput,
    handleSendMessage,
    handleKeyDown,
    handleScroll,
    scrollToBottom,
    setFileAttachment,
    handleCopyResponse,
    showNotification,
  };
};

export default useChatAgent;