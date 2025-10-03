import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { agentConfig as allAgentConfigs } from '../config/agent-config';
import { startChatSession, sendMessage, generateImage } from '../api';

/**
 * Converts a file to a base64 encoded string for the Gemini API.
 * @param {File} file The file to convert.
 * @returns {Promise<{inlineData: {data: string, mimeType: string}}>} A promise that resolves with the generative part.
 */
const fileToGenerativePart = async (file) => {
    const base64EncodedData = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
    return {
        inlineData: { data: base64EncodedData, mimeType: file.type },
    };
};

/**
 * A custom hook to manage the state and logic of a chat agent.
 * @param {{agentId: string}} props The properties for the hook.
 * @returns An object containing the agent's state and action handlers.
 */
const useChatAgent = ({ agentId }) => {
    const agentConfig = useMemo(() => allAgentConfigs.getById(agentId), [agentId]);

    // Core State
    const [messages, setMessages] = useState([]);
    const [userInput, setUserInput] = useState("");
    const [chat, setChat] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [fileAttachment, setFileAttachment] = useState(null);

    // UI State
    const [theme, setTheme] = useState(agentConfig?.defaultTheme || 'dark');
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [isUserScrolled, setIsUserScrolled] = useState(false);
    const [showScrollToBottom, setShowScrollToBottom] = useState(false);
    const [notification, setNotification] = useState(null);

    // Refs for DOM elements
    const inputRef = useRef(null);
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);

    // Initialize the chat session when the agent changes
    useEffect(() => {
        if (!agentConfig) return;

        setTheme(agentConfig.defaultTheme);

        const initialize = async () => {
            setLoading(true);
            setError(null);
            setMessages([]);
            try {
                const session = await startChatSession(agentConfig);
                setChat(session);
                setMessages([{ role: "model", text: agentConfig.initialResponse, timestamp: Date.now() }]);
            } catch (err) {
                setError(`Failed to initialize ${agentConfig.name}. Please check the API key and configuration.`);
                console.error("Initialization error:", err);
            } finally {
                setLoading(false);
            }
        };

        initialize();
    }, [agentConfig]);

    // Auto-scroll to the bottom of the messages
    useEffect(() => {
        if (!isUserScrolled) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isUserScrolled]);

    // Function to display a temporary notification
    const showNotification = useCallback((message) => {
        setNotification(message);
        setTimeout(() => setNotification(null), 3000);
    }, []);

    // Handles sending a message to the agent
    const handleSendMessage = useCallback(async () => {
        const textInput = userInput.trim();
        const currentFile = fileAttachment;

        if ((!textInput && !currentFile) || !chat || loading) return;

        setLoading(true);
        setError(null);
        const timestamp = Date.now();
        const userMessageDisplayText = textInput + (currentFile ? `\n[File: ${currentFile.name}]` : "");

        // Optimistically update the UI with the user's message
        setMessages(prev => [...prev, { role: "user", text: userMessageDisplayText, timestamp }]);
        setUserInput("");
        setFileAttachment(null);

        try {
            const promptParts = [];
            if (textInput) {
                promptParts.push({ text: textInput });
            }
            if (currentFile) {
                promptParts.push(await fileToGenerativePart(currentFile));
            }

            // Image Generation Logic
            let generatedImageUrl = null;
            const wantsImage = agentConfig.api.imageModel && ['draw', 'diagram', 'sketch', 'illustrate'].some(k => textInput.toLowerCase().includes(k));
            if (wantsImage) {
                setIsGeneratingImage(true);
                try {
                    generatedImageUrl = await generateImage(textInput, agentConfig.api.imageModel);
                } catch (err) {
                    showNotification(err.message);
                } finally {
                    setIsGeneratingImage(false);
                }
            }

            // Send the message and update the UI with the response
            const botResponseText = await sendMessage(chat, promptParts);
            const newBotMessage = {
                role: "model",
                text: botResponseText.trim(),
                imageUrl: generatedImageUrl,
                timestamp: Date.now()
            };
            setMessages(prev => [...prev, newBotMessage]);

        } catch (err) {
            console.error("handleSendMessage error:", err);
            setError(`An error occurred: ${err.message}`);
            // Revert the optimistic UI update on error
            setMessages(prev => prev.filter(msg => msg.timestamp !== timestamp));
        } finally {
            setLoading(false);
            inputRef.current?.focus();
        }
    }, [userInput, fileAttachment, chat, loading, agentConfig, showNotification]);

    // Handles the 'Enter' key press to send a message
    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    }, [handleSendMessage]);

    // Manages the visibility of the "scroll to bottom" button
    const handleScroll = useCallback(() => {
        if (messagesContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
            const isAtBottom = scrollHeight - clientHeight <= scrollTop + 10;
            setShowScrollToBottom(scrollHeight > clientHeight && !isAtBottom);
            setIsUserScrolled(!isAtBottom);
        }
    }, []);

    // Scrolls the message container to the bottom
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

    return {
        agentConfig,
        messages,
        userInput,
        loading,
        error,
        theme,
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