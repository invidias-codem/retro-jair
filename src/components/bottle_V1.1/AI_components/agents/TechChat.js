import React, { useState, useEffect, useRef, useCallback, useMemo } from "react"; // Added React and useMemo
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai"; // Added HarmCategory and HarmBlockThreshold
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  faRobot, faBrain, faSun, faMoon, faCog, faTimes, faHeartbeat,
  faClipboard, faExchangeAlt, faPaperPlane, faChevronDown, faSpinner
} from '@fortawesome/free-solid-svg-icons';
import "./chat.css";

// --- Static Configurations (Moved outside component) ---
const modeConfig = {
    tech: {
        name: "TechGenie",
        icon: faRobot,
        initialPrompt: "You are TechGenie, an expert computer technology consultant. Assist users with their tech-related questions, using Markdown for formatting code blocks, lists, and other relevant elements.",
        initialResponse: "Hello! I'm TechGenie, your expert tech consultant. I can help you with hardware recommendations, software troubleshooting, coding questions, and any other tech-related inquiries. What can I assist you with today?",
        placeholder: "Ask me anything about technology...",
        outOfCreditsMessage: "Upgrade to continue asking questions!",
        interactionName: "Questions",
        buttonText: "Chat with TechGenie",
        containerClass: "tech-chat-container",
        messageClass: "tech-message",
        messageBubbleClass: "tech-message-bubble",
        buttonClass: "tech-button",
        headerClass: "tech-header",
        inputClass: "tech-input",
        loaderClass: "tech-loading",
        modalClass: "tech-modal",
        modalContentClass: "tech-modal-content",
        messagesClass: "tech-messages",
        defaultTheme: "dark",
        copyIcon: faClipboard,
        copyTooltip: "Copy response",
        logoClass: "tech-logo",
        logoIconClass: "tech-logo-icon",
        logoTextClass: "tech-logo-text",
        controlsClass: "tech-controls",
        subscriptionBadgeClass: "tech-subscription-badge",
        closeButtonClass: "tech-close-button",
        errorMessageClass: "tech-error-message",
        footerClass: "tech-footer",
        sendButtonClass: "tech-send-button"
    },
    wellness: {
        name: "MindfulMate",
        icon: faBrain,
        initialPrompt: "You are MindfulMate, a supportive mental wellness companion. You provide evidence-based self-help techniques, coping strategies, and mindfulness exercises using Markdown for clear formatting of lists or steps. You carefully avoid making medical diagnoses or replacing professional mental health care. For serious concerns, you always recommend seeking professional help.",
        initialResponse: "Hello! I'm MindfulMate, your supportive mental wellness companion. I'm here to listen and provide evidence-based coping strategies, mindfulness exercises, and self-help techniques. Remember that I'm not a replacement for professional mental healthcare - if you're experiencing severe distress, please reach out to a qualified mental health professional. How are you feeling today?",
        placeholder: "Share what's on your mind...",
        outOfCreditsMessage: "Upgrade to continue your wellness journey",
        interactionName: "Sessions",
        buttonText: "Talk with MindfulMate",
        containerClass: "mindful-chat-container",
        messageClass: "mindful-message",
        messageBubbleClass: "mindful-message-bubble",
        buttonClass: "mindful-button",
        headerClass: "mindful-header",
        inputClass: "mindful-input",
        loaderClass: "mindful-loading",
        modalClass: "mindful-modal",
        modalContentClass: "mindful-modal-content",
        messagesClass: "mindful-messages",
        defaultTheme: "calm",
        copyIcon: faClipboard,
        copyTooltip: "Save to journal",
        logoClass: "mindful-logo",
        logoIconClass: "mindful-logo-icon",
        logoTextClass: "mindful-logo-text",
        controlsClass: "mindful-controls",
        subscriptionBadgeClass: "mindful-subscription-badge",
        closeButtonClass: "mindful-close-button",
        errorMessageClass: "mindful-error-message",
        footerClass: "mindful-footer",
        sendButtonClass: "mindful-send-button"
    }
};

const moodButtonData = [
    { key: "happy", emoji: "😊", label: "Happy" },
    { key: "calm", emoji: "😌", label: "Calm" },
    { key: "anxious", emoji: "😰", label: "Anxious" },
    { key: "sad", emoji: "😢", label: "Sad" },
    { key: "angry", emoji: "😠", label: "Angry" },
];

const TechChat = () => {
    // Core state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [userInput, setUserInput] = useState("");
    const [chat, setChat] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [subscription, setSubscription] = useState("free");
    const [remainingInteractions, setRemainingInteractions] = useState(5);
    const [isUserScrolled, setIsUserScrolled] = useState(false);
    const [showScrollToBottom, setShowScrollToBottom] = useState(false);
    const [notification, setNotification] = useState(null);

    // Mode specific state
    const [mode, setMode] = useState("tech"); // "tech" or "wellness"
    const [mood, setMood] = useState("neutral"); // For wellness mode
    const [journalEntries, setJournalEntries] = useState([]); // For wellness mode
    const [theme, setTheme] = useState(modeConfig[mode].defaultTheme);
    const [isMobileMoodSelectorOpen, setIsMobileMoodSelectorOpen] = useState(false);

    // Refs
    const inputRef = useRef(null);
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);

    // Memoize currentMode to stabilize its reference
    const currentMode = useMemo(() => modeConfig[mode], [mode]);

    // Effect to update theme when mode (and thus currentMode.defaultTheme) changes
    useEffect(() => {
        setTheme(currentMode.defaultTheme);
    }, [currentMode.defaultTheme]);

    // Effect for API and Chat Initialization
    useEffect(() => {
        const initializeAPI = () => {
            const apiKey = process.env.REACT_APP_GEMINI_API;
            if (!apiKey) {
                setError("API key not found. Check your environment configuration.");
                console.error("Missing API key: REACT_APP_GEMINI_API");
                return null;
            }
            try { return new GoogleGenerativeAI(apiKey); }
            catch (err) {
                setError("Failed to initialize API.");
                console.error("API initialization error:", err);
                return null;
            }
        };

        const initializeChat = async () => {
            setLoading(true); setError(null); setMessages([]); setChat(null);
            const genAI = initializeAPI();
            if (!genAI) { setLoading(false); return; }

            try {
                const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
                const initialHistory = [
                    { role: "user", parts: [{ text: currentMode.initialPrompt }] },
                    { role: "model", parts: [{ text: currentMode.initialResponse }] },
                ];
                const newChatSession = model.startChat({
                    history: initialHistory,
                    generationConfig: { temperature: 0.7, topK: 40, topP: 0.9, maxOutputTokens: 4096 },
                    safetySettings: [ // Using Enums for safety settings
                        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                    ],
                });
                setChat(newChatSession);
                setMessages([{ role: "model", text: currentMode.initialResponse, timestamp: Date.now() }]);
            } catch (err) {
                setError(`Failed to initialize ${currentMode.name} chat. Please ensure the API key is valid and the model is available. Try again later.`);
                console.error("Chat initialization error:", err);
            } finally {
                setLoading(false);
                if (currentMode.name === modeConfig.wellness.name) setMood('neutral'); // Check against static config
                setIsMobileMoodSelectorOpen(false);
            }
        };
        initializeChat();
    }, [currentMode]); // Depends on currentMode (which depends on mode)

    // --- Notification Handler ---
    const showNotification = useCallback((message) => {
        setNotification(message);
        setTimeout(() => setNotification(null), 2500);
    }, []); // setNotification is stable

    // --- Message Sending Logic ---
    const handleSendMessage = useCallback(async (messageText = userInput) => {
        const trimmedMessage = messageText.trim();
        if (!trimmedMessage || (subscription === "free" && remainingInteractions <= 0) || !chat || loading) return;

        setLoading(true); setError(null);
        const timestamp = Date.now();
        const newUserMessage = { role: "user", text: trimmedMessage, timestamp, isMoodUpdate: messageText !== userInput };

        setMessages(prevMessages => [...prevMessages, newUserMessage]);
        if (messageText === userInput) { // Clear input only if it was the direct source
            setUserInput("");
        }

        try {
            const result = await chat.sendMessage(trimmedMessage);
            // Adjust response parsing for Gemini API if necessary
            let botResponseText = "Sorry, I received an empty response.";
            if (result?.response?.candidates?.[0]?.content?.parts?.[0]?.text) {
                botResponseText = result.response.candidates[0].content.parts.map(part => part.text).join("\n");
            } else if (result?.response?.text) { // Fallback, less common now
                 botResponseText = typeof result.response.text === 'function' ? result.response.text() : result.response.text;
            }

            const newBotMessage = { role: "model", text: botResponseText, timestamp: Date.now() };
            setMessages(prevMessages => [...prevMessages, newBotMessage]);

            if (mode === "wellness") {
                const lowercasedInput = trimmedMessage.toLowerCase();
                if (trimmedMessage.length > 50 || ["feel", "emotion", "anxiety", "depress", "stress"].some(keyword => lowercasedInput.includes(keyword))) {
                    const newEntry = {
                        text: trimmedMessage,
                        timestamp: timestamp,
                        response: botResponseText.substring(0, 150) + (botResponseText.length > 150 ? "..." : "")
                    };
                    setJournalEntries(prev => [...prev, newEntry]);
                }
            }

            if (subscription === "free") {
                setRemainingInteractions(prev => Math.max(0, prev - 1));
            }
        } catch (err) {
            let errorText = "I couldn't process your message. Please check your connection or try again.";
            if (err.message?.includes("Candidate was blocked") || err.toString().includes("SAFETY")) {
                errorText = "My response was blocked due to safety settings or the nature of your request.";
            } else if (err.message?.includes("quota")) {
                errorText = "API quota exceeded. Please try again later.";
            } else if (err.message) {
                errorText = `Error: ${err.message.substring(0,150)}${err.message.length > 150 ? '...' : ''}`; // Truncate long API errors
            }
            setError(errorText);
            console.error("Message sending error:", err);
            setMessages(prevMessages => prevMessages.filter(msg => msg.timestamp !== timestamp));
        } finally {
            setLoading(false);
            if (inputRef.current) inputRef.current.focus();
        }
    }, [userInput, chat, loading, mode, subscription, remainingInteractions, setJournalEntries]);

    // --- Scrolling Logic ---
    const scrollToBottom = useCallback(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, []);

    useEffect(() => {
        if (!isUserScrolled && messages.length > 0) {
            scrollToBottom();
        }
    }, [messages, isUserScrolled, scrollToBottom]);

    const handleScroll = useCallback(() => {
        if (messagesContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
            const isAtBottom = scrollHeight - clientHeight <= scrollTop + 10;
            const shouldShowButton = scrollHeight > clientHeight && !isAtBottom;
            setIsUserScrolled(!isAtBottom);
            setShowScrollToBottom(shouldShowButton);
        }
    }, []);

    // --- Other Handlers ---
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleMoodChange = useCallback((newMood) => {
        if (loading) return;
        setMood(newMood);
        setIsMobileMoodSelectorOpen(false);
        // Send a message reflecting the mood change
        handleSendMessage(`I'm feeling ${newMood} today.`);
    }, [loading, handleSendMessage]);

    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage(); // Implicitly uses current userInput
        }
    }, [handleSendMessage]);

    const openModal = useCallback(() => {
        setIsModalOpen(true);
        // Chat initialization is handled by the useEffect watching `currentMode`
        if (!chat && !loading && currentMode?.name) {
             console.log(`Modal opened for ${currentMode.name}, re-checking chat initialization status.`);
        }
    }, [chat, loading, currentMode]); // Added dependencies

    const closeModal = useCallback(() => setIsModalOpen(false), []);

    const handleCopyResponse = useCallback((textToCopy) => {
        if (!textToCopy) return;
        if (mode === "tech") {
            navigator.clipboard.writeText(textToCopy)
                .then(() => showNotification("Copied to clipboard"))
                .catch(err => { console.error('Failed to copy text:', err); showNotification("Failed to copy"); });
        } else { // Wellness mode
            const newEntry = {
                text: "Saved from conversation",
                timestamp: Date.now(),
                response: textToCopy
            };
            setJournalEntries(prev => [...prev, newEntry]);
            showNotification("Saved to journal");
        }
    }, [mode, showNotification, setJournalEntries]);


    // --- Sub-Components (Memoized definitions) ---

    const ChatHeader = useMemo(() => React.memo(() => (
        <header className={currentMode.headerClass}>
            <div className={currentMode.logoClass}>
                <div className={currentMode.logoIconClass}><FontAwesomeIcon icon={currentMode.icon} /></div>
                <span className={currentMode.logoTextClass}>{currentMode.name}</span>
                <div className={`${currentMode.subscriptionBadgeClass} ${subscription}`}>{subscription.charAt(0).toUpperCase() + subscription.slice(1)} Tier</div>
            </div>
            <div className={currentMode.controlsClass}>
                <button
                    className={`${currentMode.buttonClass} ${currentMode.buttonClass}--icon ${currentMode.buttonClass}--mode`}
                    onClick={() => setMode(prevMode => prevMode === "tech" ? "wellness" : "tech")}
                    aria-label={`Switch to ${mode === "tech" ? "Wellness" : "Tech"} mode`}
                    title={`Switch to ${mode === "tech" ? "Wellness" : "Tech"} mode`} >
                    <FontAwesomeIcon icon={faExchangeAlt} />
                    <span className="mode-switch-text">Switch to {mode === "tech" ? "Wellness" : "Tech"}</span>
                </button>
                <button
                    className={`${currentMode.buttonClass} ${currentMode.buttonClass}--icon ${currentMode.buttonClass}--theme`}
                    onClick={() => setTheme(prevTheme =>
                        mode === "tech"
                            ? (prevTheme === "dark" ? "light" : "dark")
                            : (prevTheme === "calm" ? "bright" : "calm")
                    )}
                    aria-label={mode === "tech" ? (theme === "dark" ? "Switch to light mode" : "Switch to dark mode") : (theme === "calm" ? "Switch to bright mode" : "Switch to calm mode")}
                    title={mode === "tech" ? (theme === "dark" ? "Switch to light mode" : "Switch to dark mode") : (theme === "calm" ? "Switch to bright mode" : "Switch to calm mode")} >
                    <FontAwesomeIcon icon={mode === "tech" ? (theme === "dark" ? faSun : faMoon) : (theme === "calm" ? faSun : faMoon)} />
                </button>
                <button className={`${currentMode.buttonClass} ${currentMode.buttonClass}--settings`} aria-label="Settings" title="Settings (coming soon)" disabled>
                    <FontAwesomeIcon icon={faCog} />
                    <span>Settings</span>
                </button>
            </div>
        </header>
    )), [currentMode, subscription, mode, theme]); // Added mode & theme

    const MoodSelector = useMemo(() => React.memo(() => (
        mode === "wellness" && !isMobile && (
            <div className="mood-selector">
                <p>How are you feeling right now?</p>
                <div className="mood-buttons">
                    {moodButtonData.map(m => (
                       <button key={m.key} className={`mood-button ${mood === m.key ? "active" : ""}`} onClick={() => handleMoodChange(m.key)} disabled={loading}>
                           <span role="img" aria-label={m.label}>{m.emoji}</span>
                           <span>{m.label}</span>
                       </button>
                    ))}
                </div>
            </div>
        )
    )), [mode, isMobile, mood, loading, handleMoodChange]);

    const MobileMoodSelector = useMemo(() => React.memo(() => (
        mode === "wellness" && isMobile && (
            <div className={`mobile-mood-selector ${isMobileMoodSelectorOpen ? 'open' : ''}`}>
                <button className="mobile-mood-toggle" onClick={() => setIsMobileMoodSelectorOpen(prev => !prev)} aria-expanded={isMobileMoodSelectorOpen}>
                    <FontAwesomeIcon icon={faChevronDown} className="toggle-icon" />
                    <span>How are you feeling? {mood !== 'neutral' && `(${moodButtonData.find(m => m.key === mood)?.label || mood})`}</span>
                </button>
                {isMobileMoodSelectorOpen && (
                    <div className="mobile-mood-buttons">
                         {moodButtonData.map(m => (
                            <button key={m.key} className={`mobile-mood-button ${mood === m.key ? "active" : ""}`} onClick={() => handleMoodChange(m.key)} disabled={loading} aria-label={m.label} title={m.label}>
                                <span role="img" aria-label={m.label}>{m.emoji}</span>
                            </button>
                         ))}
                    </div>
                )}
            </div>
        )
    )), [mode, isMobile, isMobileMoodSelectorOpen, mood, loading, handleMoodChange]);

    const CrisisResources = useMemo(() => React.memo(() => (
        mode === "wellness" && (
            <div className="wellness-resources">
                <h3><FontAwesomeIcon icon={faHeartbeat} /> Crisis Resources</h3>
                <p>If you're in distress or need immediate support, please reach out:</p>
                <ul>
                    <li>National Suicide Prevention Lifeline (US): Call or text 988</li>
                    <li>Crisis Text Line (US): Text HOME to 741741</li>
                    {/* Add other resources as needed */}
                </ul>
                <p>Remember, MindfulMate is not a substitute for professional help.</p>
            </div>
        )
    )), [mode]);

    const ScrollToBottomButton = useMemo(() => React.memo(() => (
        showScrollToBottom && (
            <button
                className="scroll-to-bottom visible"
                onClick={scrollToBottom}
                aria-label="Scroll to newest messages"
                title="Scroll to bottom">
                <FontAwesomeIcon icon={faChevronDown} />
            </button>
        )
    )), [showScrollToBottom, scrollToBottom]);


    return (
        <>
            <button onClick={openModal} className={`chat-open-button ${currentMode.buttonClass}`}>
                 <FontAwesomeIcon icon={currentMode.icon} style={{ marginRight: '8px' }} />
                 {currentMode.buttonText}
            </button>

            {isModalOpen && (
                <div className={currentMode.modalClass}>
                    <div className={currentMode.modalContentClass}>
                        <div className={`chat-wrapper ${currentMode.containerClass} ${theme}`}>
                            <button onClick={closeModal} className={currentMode.closeButtonClass} aria-label="Close Chat" title="Close Chat">
                                <FontAwesomeIcon icon={faTimes} />
                            </button>

                            <ChatHeader /> {/* Memoized component instance */}

                            {error && <div className={`chat-error-display ${currentMode.errorMessageClass}`}>{error}</div>}

                            <MoodSelector /> {/* Memoized component instance */}
                            <MobileMoodSelector /> {/* Memoized component instance */}

                            <main className={currentMode.messagesClass} ref={messagesContainerRef} onScroll={handleScroll} aria-live="polite">
                                {messages?.map((msg, index) => (
                                    <div key={`${msg.timestamp}-${index}`} className={`${currentMode.messageClass} ${msg.role} ${msg.isMoodUpdate ? 'mood-update' : ''}`}>
                                        <div className={currentMode.messageBubbleClass}>
                                             {msg.role === 'model' && !msg.isMoodUpdate && (
                                                <FontAwesomeIcon icon={currentMode.icon} className="message-icon model-icon" />
                                             )}
                                            <div className="message-text">
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                                            </div>
                                            {msg.role === 'model' && !msg.isMoodUpdate && msg.text && ( // Ensure text exists
                                                <button
                                                    className={`message-action-button ${currentMode.buttonClass}--icon`}
                                                    onClick={() => handleCopyResponse(msg.text)}
                                                    aria-label={currentMode.copyTooltip}
                                                    title={currentMode.copyTooltip} >
                                                    <FontAwesomeIcon icon={currentMode.copyIcon} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </main>

                            <ScrollToBottomButton /> {/* Memoized component instance */}

                            {loading && (
                                <div className={`chat-loading-indicator ${currentMode.loaderClass}`}>
                                    <FontAwesomeIcon icon={faSpinner} spin /> Thinking...
                                </div>
                            )}

                             {subscription === "free" && remainingInteractions <= 0 && !loading && (
                                <div className={`chat-limit-message ${currentMode.errorMessageClass}`}>
                                    You've reached the interaction limit for the free tier. {currentMode.outOfCreditsMessage}
                                </div>
                             )}

                            <footer className={`chat-footer ${currentMode.footerClass}`}>
                                <textarea
                                    ref={inputRef}
                                    className={currentMode.inputClass}
                                    value={userInput}
                                    onChange={(e) => setUserInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder={currentMode.placeholder}
                                    rows="1"
                                    aria-label="Chat input"
                                    disabled={loading || (subscription === "free" && remainingInteractions <= 0)}
                                />
                                <button
                                    className={`${currentMode.sendButtonClass} ${currentMode.buttonClass}--icon`}
                                    onClick={() => handleSendMessage()} // Explicitly call with no args to use userInput
                                    disabled={!userInput.trim() || loading || (subscription === "free" && remainingInteractions <= 0)}
                                    aria-label="Send message"
                                    title="Send message" >
                                    <FontAwesomeIcon icon={faPaperPlane} />
                                </button>
                            </footer>

                            <CrisisResources /> {/* Memoized component instance */}

                             {notification && (<div className="chat-notification">{notification}</div>)}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default TechChat;