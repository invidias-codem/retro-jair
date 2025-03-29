import { useState, useEffect, useRef } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Custom hook that handles chat logic for both TechGenie and MindfulMate
 * 
 * @param {Object} options - Configuration options for the chat
 * @param {string} options.mode - Either "tech" or "wellness"
 * @param {string} options.initialPrompt - The initial prompt to set up the AI's persona
 * @param {string} options.initialResponse - First message shown to the user
 * @param {string} options.subscription - The user's subscription tier
 * @param {number} options.maxInteractions - Maximum allowed interactions based on subscription
 * @param {Function} options.onSubscriptionEnded - Callback when free tier runs out
 * @returns {Object} Chat state and functions
 */
const useChatLogic = ({
  mode = "tech", // "tech" or "wellness"
  initialPrompt,
  initialResponse,
  subscription = "free",
  maxInteractions = 5,
  onSubscriptionEnded = () => {},
}) => {
  // Core state
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [chat, setChat] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [remainingInteractions, setRemainingInteractions] = useState(maxInteractions);
  const [isUserScrolled, setIsUserScrolled] = useState(false);
  
  // Optional state (mode-specific)
  const [mood, setMood] = useState("neutral");
  const [journalEntries, setJournalEntries] = useState([]);
  
  // Refs
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Initialize chat with the selected mode
  useEffect(() => {
    const initializeAPI = () => {
      const apiKey = process.env.REACT_APP_GEMINI_API;
      if (!apiKey) {
        setError("API key not found. Check your environment configuration.");
        console.error("Missing API key in environment variables");
        return null;
      }
      try {
        return new GoogleGenerativeAI(apiKey);
      } catch (err) {
        setError("Failed to initialize API.");
        console.error("API initialization error:", err);
        return null;
      }
    };

    const initializeChat = async () => {
      const genAI = initializeAPI();
      if (!genAI) return;

      try {
        const model = await genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const initialHistory = [
          { role: "user", parts: [{ text: initialPrompt }] },
          { role: "model", parts: [{ text: initialResponse }] },
        ];

        const newChat = await model.startChat({
          history: initialHistory,
          generationConfig: { temperature: 0.7, topK: 40, topP: 0.9, maxOutputTokens: 2048 },
          safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          ],
        });

        setChat(newChat);
        setError(null);
        
        setMessages([{
          role: "model",
          text: initialResponse,
          timestamp: Date.now()
        }]);
      } catch (err) {
        setError("Failed to initialize chat. Please try again later.");
        console.error("Chat initialization error:", err);
      }
    };

    // Reset messages when changing modes
    setMessages([]);
    
    initializeChat();
  }, [initialPrompt, initialResponse, mode]); 

  // Send Message Handler
  const handleSendMessage = async () => {
    if (!userInput.trim() || (subscription === "free" && remainingInteractions <= 0) || !chat) return;

    setLoading(true);
    const newUserMessage = { role: "user", text: userInput, timestamp: Date.now() };

    try {
      setMessages(prevMessages => [...prevMessages, newUserMessage]);
      const currentInput = userInput;
      setUserInput(""); 

      const result = await chat.sendMessage(currentInput);
      const botResponse = result.response.text();
      const newBotMessage = { 
        role: "model", 
        text: botResponse, 
        timestamp: Date.now() 
      };

      setMessages(prevMessages => [...prevMessages, newBotMessage]);

      // Save significant messages to journal in wellness mode
      if (mode === "wellness" && (
        currentInput.length > 100 || 
        currentInput.includes("feel") || 
        currentInput.includes("emotion") ||
        currentInput.includes("anxiety") ||
        currentInput.includes("depression"))
      ) {
        const newEntry = {
          text: currentInput,
          timestamp: Date.now(),
          response: botResponse.substring(0, 150) + "..."
        };
        setJournalEntries(prev => [...prev, newEntry]);
      }

      if (subscription === "free") {
        const newRemainingInteractions = remainingInteractions - 1;
        setRemainingInteractions(newRemainingInteractions);
        
        if (newRemainingInteractions <= 0) {
          onSubscriptionEnded();
        }
      }
    } catch (err) {
      setError("I couldn't process your message. Please try again.");
      console.error("Message sending error:", err);
      setMessages(prevMessages => prevMessages.slice(0, -1));
    } finally {
      setLoading(false);
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  // Scroll to bottom function
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Auto-scroll effect when messages update
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle scroll events
  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isScrolledToBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 10;
      setIsUserScrolled(!isScrolledToBottom);
    }
  };

  // Mood handling for wellness mode
  const handleMoodChange = (newMood) => {
    setMood(newMood);
    
    // Add the mood selection as a user message
    const moodMessage = { 
      role: "user", 
      text: `I'm feeling ${newMood} today.`, 
      timestamp: Date.now(),
      isMoodUpdate: true
    };
    
    setMessages(prev => [...prev, moodMessage]);
    
    // Trigger AI response to the mood
    setTimeout(() => {
      handleSendMessage();
    }, 300);
  };

  // Handle key press event
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Save message to journal (for wellness mode)
  const saveToJournal = (text) => {
    const newEntry = {
      text: "Saved from conversation",
      timestamp: Date.now(),
      response: text
    };
    
    setJournalEntries(prev => [...prev, newEntry]);
    return true;
  };

  // Copy to clipboard (for tech mode)
  const copyToClipboard = (text) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text)
        .then(() => {
          console.log('Text copied to clipboard');
          return true;
        })
        .catch(err => {
          console.error('Failed to copy text: ', err);
          return false;
        });
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      
      try {
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        return successful;
      } catch (err) {
        console.error('Failed to copy text: ', err);
        document.body.removeChild(textArea);
        return false;
      }
    }
  };

  // Reset the chat to initial state
  const resetChat = () => {
    setMessages([{
      role: "model",
      text: initialResponse,
      timestamp: Date.now()
    }]);
    setUserInput("");
    setError(null);
  };

  return {
    // State
    messages,
    userInput,
    loading,
    error,
    remainingInteractions,
    isUserScrolled,
    mood,
    journalEntries,
    
    // Methods
    setUserInput,
    handleSendMessage,
    handleKeyDown,
    handleScroll,
    handleMoodChange,
    scrollToBottom,
    saveToJournal,
    copyToClipboard,
    resetChat,
    
    // Refs
    inputRef,
    messagesEndRef,
    messagesContainerRef,
  };
};

export default useChatLogic;