// src/components/bottle_V1.1/hooks/useChatAgent.js

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { agentConfig as allAgentConfigs } from '../config/agent-config'; //
import { startChatSession, sendMessage, generateImage } from '../api/gemini'; // Corrected path assuming api/index.js exports from gemini.js

// fileToGenerativePart function remains the same
const fileToGenerativePart = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      // If file is null/undefined, resolve with null to filter out later
      resolve(null);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      // Ensure result is a string and remove the data URL prefix
      const base64Data = typeof reader.result === 'string'
        ? reader.result.split(',')[1] // Get base64 part after "data:...;base64,"
        : null;

      if (base64Data) {
        resolve({
          inlineData: {
            mimeType: file.type,
            data: base64Data
          }
        });
      } else {
        reject(new Error("Failed to read file or convert to base64."));
      }
    };
    reader.onerror = (error) => {
      reject(new Error(`FileReader error: ${error}`));
    };
    reader.readAsDataURL(file); // Read the file as a data URL (includes base64)
  });
};

const useChatAgent = ({ agentId }) => {
    // --- Use agentId directly to get the config ---
    const agentConfig = useMemo(() => allAgentConfigs.getById(agentId), [agentId]);

    // Core State (remains the same)
    const [messages, setMessages] = useState([]);
    const [userInput, setUserInput] = useState("");
    const [chat, setChat] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [fileAttachment, setFileAttachment] = useState(null);

    // UI State (remains the same)
    const [theme, setTheme] = useState(agentConfig?.defaultTheme || 'dark');
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [isUserScrolled, setIsUserScrolled] = useState(false);
    const [showScrollToBottom, setShowScrollToBottom] = useState(false);
    const [notification, setNotification] = useState(null);

    // Refs (remains the same)
    const inputRef = useRef(null);
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);

    // --- OPTIMIZED Initialization Effect ---
    useEffect(() => {
        // Guard clause: Don't run if agentConfig isn't loaded yet
        if (!agentConfig) {
             console.log("useChatAgent effect: No agentConfig, skipping init.");
             // Reset state if agent becomes invalid
             setMessages([]);
             setChat(null);
             setError("Selected agent configuration is not available.");
             setLoading(false);
             return;
        }

        console.log(`useChatAgent effect: Initializing for agentId: ${agentId}`);
        // Indicate loading starts
        setLoading(true);
        setError(null);
        setMessages([]); // Clear previous messages
        setChat(null); // Explicitly nullify previous chat session

        // Define the async initialization function
        const initialize = async () => {
            try {
                // Fetch the specific config needed *inside* the effect
                const currentAgentConfig = allAgentConfigs.getById(agentId);
                 if (!currentAgentConfig) {
                    throw new Error(`Configuration for agent ID "${agentId}" not found during init.`);
                 }

                // Update theme based on the *current* agent being initialized
                 setTheme(currentAgentConfig.defaultTheme || 'dark');

                const session = await startChatSession(currentAgentConfig);
                setChat(session);
                // Set initial message AFTER session is confirmed
                setMessages([{ role: "model", text: currentAgentConfig.initialResponse, timestamp: Date.now() }]);
                 setError(null); // Clear any previous errors
            } catch (err) {
                setError(`Failed to initialize ${agentConfig.name}. Error: ${err.message}`);
                console.error(`Initialization error for ${agentId}:`, err);
                setMessages([]); // Ensure messages are empty on error
                setChat(null);
            } finally {
                // Ensure loading is set to false regardless of success/failure
                 setLoading(false);
                 console.log(`useChatAgent effect: Initialization complete for ${agentId}. Loading: false`);
            }
        };

        // Execute initialization
        initialize();

        // --- Cleanup function ---
        // This runs BEFORE the next effect execution or on unmount
        return () => {
            console.log(`useChatAgent cleanup: Cleaning up for previous agent (before initializing ${agentId})`);
            // Here you could add any specific cleanup needed for the 'chat' object if necessary,
            // like closing connections, though startChatSession likely doesn't require explicit cleanup.
            setChat(null); // Ensure chat session reference is cleared
        };
        // --- Depend ONLY on agentId ---
    }, [agentId]); // Now the effect re-runs whenever the agentId prop changes


    // Auto-scroll (remains the same)
    useEffect(() => {
        if (!isUserScrolled) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isUserScrolled]);

    // showNotification (remains the same)
    const showNotification = useCallback((message) => { /* ... */ }, []);

    // handleSendMessage (remains the same, but ensure it uses the latest agentConfig if needed, though config fetched inside effect is better)
    const handleSendMessage = useCallback(async () => {
         // Use the agentConfig derived from the agentId prop at the time of the call
         const currentAgentConfig = allAgentConfigs.getById(agentId);
         if (!currentAgentConfig) {
             setError("Cannot send message: Agent configuration is missing.");
             return;
         }
         // ... rest of handleSendMessage logic using currentAgentConfig ...

        const textInput = userInput.trim();
        const currentFile = fileAttachment;

        if ((!textInput && !currentFile) || !chat || loading) return;

        setLoading(true);
        setError(null);
        const timestamp = Date.now();
        const userMessageDisplayText = textInput + (currentFile ? `\n[File: ${currentFile.name}]` : "");

        setMessages(prev => [...prev, { role: "user", text: userMessageDisplayText, timestamp }]);
        setUserInput("");
        setFileAttachment(null);
        // Reset file input visually if needed (handled in component)

        try {
            const promptParts = [];
            if (textInput) {
                promptParts.push({ text: textInput });
            }
            if (currentFile) {
                // Ensure file conversion happens before sending
                 try {
                     promptParts.push(await fileToGenerativePart(currentFile));
                 } catch (fileError) {
                      throw new Error(`Failed to process attachment: ${fileError.message}`);
                 }
            }

            let generatedImageUrl = null;
            // Use currentAgentConfig for checking capabilities/models
            const wantsImage = currentAgentConfig.api.imageModel && ['draw', 'diagram', 'sketch', 'illustrate', 'visualize'].some(k => textInput.toLowerCase().includes(k));

            if (wantsImage) {
                setIsGeneratingImage(true);
                try {
                    generatedImageUrl = await generateImage(textInput, currentAgentConfig.api.imageModel);
                } catch (err) {
                    showNotification(`Image generation failed: ${err.message}`); // Show specific error
                } finally {
                    setIsGeneratingImage(false);
                }
            }

            const botResponseText = await sendMessage(chat, promptParts);
            const newBotMessage = {
                role: "model",
                text: botResponseText.trim(),
                imageUrl: generatedImageUrl,
                timestamp: Date.now()
            };
            setMessages(prev => [...prev, newBotMessage]);

        } catch (err) {
            console.error(`handleSendMessage error for ${agentId}:`, err);
            setError(`An error occurred: ${err.message}`);
            setMessages(prev => prev.filter(msg => msg.timestamp !== timestamp));
        } finally {
            setLoading(false);
            inputRef.current?.focus();
        }
    }, [agentId, userInput, fileAttachment, chat, loading, showNotification]); // Added agentId dependency

    // handleKeyDown (remains the same)
    const handleKeyDown = useCallback((e) => { /* ... */ }, [handleSendMessage]);

    // handleScroll (remains the same)
    const handleScroll = useCallback(() => { /* ... */ }, []);

    // scrollToBottom (remains the same)
    const scrollToBottom = useCallback(() => { /* ... */ }, []);

    // Return statement (remains the same, includes updated theme)
    return {
        agentConfig, // Return the memoized config based on current agentId
        messages,
        userInput,
        loading,
        error,
        theme, // Return the theme state managed by the effect
        showScrollToBottom,
        notification,
        fileAttachment,
        isGeneratingImage,
        setUserInput,
        setFileAttachment,
        handleSendMessage,
        handleKeyDown,
        handleScroll,
        scrollToBottom,
        showNotification,
        inputRef,
        messagesEndRef,
        messagesContainerRef
    };
};

export default useChatAgent;