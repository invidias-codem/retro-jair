import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { agentConfig as allAgentConfigs } from '../config/agent-config';
import { startChatSession, sendMessage, generateImage } from '../api'; // UPDATED IMPORT

const fileToGenerativePart = async (file) => {
    const base64EncodedDataPromise = new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.readAsDataURL(file);
    });
    return {
        inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
    };
};

const useChatAgent = ({ agentId }) => {
    const agentConfig = useMemo(() => allAgentConfigs.getById(agentId), [agentId]);
    const [messages, setMessages] = useState([]);
    const [userInput, setUserInput] = useState("");
    const [chat, setChat] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [theme, setTheme] = useState(agentConfig?.defaultTheme || 'dark');
    const [fileAttachment, setFileAttachment] = useState(null);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const inputRef = useRef(null);
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const [isUserScrolled, setIsUserScrolled] = useState(false);
    const [showScrollToBottom, setShowScrollToBottom] = useState(false);
    const [notification, setNotification] = useState(null);

    useEffect(() => {
        if (!agentConfig) return;
        setTheme(agentConfig.defaultTheme);

        const initialize = async () => {
            setLoading(true);
            setError(null);
            setMessages([]);
            try {
                // Use the new API layer to start the session
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
    
    useEffect(() => {
        if (!isUserScrolled) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isUserScrolled]);

    const showNotification = useCallback((message) => {
        setNotification(message);
        setTimeout(() => setNotification(null), 3000);
    }, []);

    const handleSendMessage = useCallback(async () => {
        const textInput = userInput.trim();
        const currentFile = fileAttachment;
        if ((!textInput && !currentFile) || !chat || loading) return;

        setLoading(true);
        setError(null);
        const timestamp = Date.now();
        
        // **THE FIX IS HERE:** We create the simplest possible prompt.
        // If there's no file, we send a plain string. If there is a file,
        // we send the more complex array of parts. This reduces the chances
        // of a malformed request for simple text messages.
        let prompt;
        let userMessageDisplayText = textInput;

        if (currentFile) {
            const promptParts = [];
            if (textInput) promptParts.push({ text: textInput });
            try {
                const filePart = await fileToGenerativePart(currentFile);
                promptParts.push(filePart);
                userMessageDisplayText += `\n[File: ${currentFile.name}]`;
                prompt = promptParts;
            } catch (err) {
                setError("Error processing file."); setLoading(false); return;
            }
        } else {
            prompt = textInput; // Just send the string
        }
        
        setMessages(prev => [...prev, { role: "user", text: userMessageDisplayText, timestamp }]);
        setUserInput("");
        setFileAttachment(null);

        // ... (Image generation and the rest of the function remain the same)
        let generatedImageUrl = null;
        try {
            const wantsImage = agentConfig.api.imageModel && ['draw', 'diagram', 'sketch', 'illustrate'].some(k => textInput.toLowerCase().includes(k));
            if (wantsImage) {
                setIsGeneratingImage(true);
                generatedImageUrl = await generateImage(textInput, agentConfig.api.imageModel).catch(err => {
                    showNotification(err.message);
                    return null;
                });
                setIsGeneratingImage(false);
            }

            // The 'prompt' variable (either a string or an array) is passed here.
            const botResponseText = await sendMessage(chat, prompt);
            const newBotMessage = {
                role: "model", text: botResponseText.trim(), imageUrl: generatedImageUrl, timestamp: Date.now()
            };
            setMessages(prev => [...prev, newBotMessage]);
        } catch (err) {
            console.error("handleSendMessage caught an error:", err);
            setError(`An error occurred: ${err.message}`);
            setMessages(prev => prev.filter(msg => msg.timestamp !== timestamp));
        } finally {
            setLoading(false);
            inputRef.current?.focus();
        }
    }, [userInput, fileAttachment, chat, loading, agentConfig, showNotification]);

    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
    }, [handleSendMessage]);

    const handleScroll = useCallback(() => {
        if (messagesContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
            const isAtBottom = scrollHeight - clientHeight <= scrollTop + 10;
            setShowScrollToBottom(scrollHeight > clientHeight && !isAtBottom);
            setIsUserScrolled(!isAtBottom);
        }
    }, []);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

    return {
        agentConfig, messages, userInput, loading, error, theme, showScrollToBottom,
        notification, fileAttachment, isGeneratingImage,
        setUserInput, setFileAttachment, handleSendMessage, handleKeyDown,
        handleScroll, scrollToBottom, showNotification,
        inputRef, messagesEndRef, messagesContainerRef
    };
};

export default useChatAgent;