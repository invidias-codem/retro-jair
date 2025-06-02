import { useState, useEffect, useRef } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  faRobot,
  faBrain,
  faSun,
  faMoon,
  faCog,
  faTimes,
  faHeartbeat,
  faClipboard,
  faExchangeAlt,
  faPaperPlane,
  faChevronDown,
  faSpinner
} from '@fortawesome/free-solid-svg-icons';
import "./chat.css";
// Removed: import "./StemChat"; // This import was unused

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
    const [mode, setMode] = useState("tech");
    const [mood, setMood] = useState("neutral");
    const [journalEntries, setJournalEntries] = useState([]);
    const [theme, setTheme] = useState("dark"); // Will be set by useEffect based on currentMode
    const [isMobileMoodSelectorOpen, setIsMobileMoodSelectorOpen] = useState(false);

    // Refs
    const inputRef = useRef(null);
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);

    // Mode-specific properties
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
            messageClass: "tech-message", // Base for user/model message container
            messageBubbleClass: "tech-message-bubble", // Specific class for the bubble
            buttonClass: "tech-button",
            headerClass: "tech-header",
            inputClass: "tech-input",
            loaderClass: "tech-loading",
            modalClass: "tech-modal", // Matches CSS .modal class
            modalContentClass: "tech-modal-content", // Matches CSS .modal-content class
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
            messageClass: "mindful-message", // Base for user/model message container
            messageBubbleClass: "mindful-message-bubble", // Specific class for the bubble
            buttonClass: "mindful-button",
            headerClass: "mindful-header",
            inputClass: "mindful-input",
            loaderClass: "mindful-loading",
            modalClass: "mindful-modal", // Matches CSS .modal class
            modalContentClass: "mindful-modal-content", // Matches CSS .modal-content class
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

    const currentMode = modeConfig[mode];

    useEffect(() => {
        setTheme(currentMode.defaultTheme);
    }, [mode, currentMode.defaultTheme]);

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
                const newChat = model.startChat({
                    history: initialHistory,
                    generationConfig: { temperature: 0.7, topK: 40, topP: 0.9, maxOutputTokens: 4096 }, // Increased maxOutputTokens
                    safetySettings: [
                        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                    ],
                });
                setChat(newChat);
                setMessages([{ role: "model", text: currentMode.initialResponse, timestamp: Date.now() }]);
            } catch (err) {
                setError(`Failed to initialize ${currentMode.name} chat. Please ensure the API key is valid and the model is available. Try again later.`);
                console.error("Chat initialization error:", err);
            } finally {
                setLoading(false);
                if (mode === 'wellness') setMood('neutral');
                setIsMobileMoodSelectorOpen(false);
            }
        };
        initializeChat();
    }, [mode, currentMode.initialPrompt, currentMode.initialResponse, currentMode.name]);

    const handleSendMessage = async (messageToSend = userInput) => {
        const trimmedMessage = messageToSend.trim(); // Trim message before sending
        if (!trimmedMessage || (subscription === "free" && remainingInteractions <= 0) || !chat || loading) return;

        setLoading(true); setError(null);
        const timestamp = Date.now();
        const newUserMessage = { role: "user", text: trimmedMessage, timestamp };

        setMessages(prevMessages => [...prevMessages, newUserMessage]);
        if (messageToSend === userInput) {
            setUserInput("");
        }

        try {
            const result = await chat.sendMessage(trimmedMessage); // Send trimmed message
            const botResponseText = result?.response?.text ? result.response.text() : "Sorry, I received an empty response.";
            const newBotMessage = { role: "model", text: botResponseText, timestamp: Date.now() };
            setMessages(prevMessages => [...prevMessages, newBotMessage]);

            if (mode === "wellness") {
                const lowercasedInput = trimmedMessage.toLowerCase();
                if (trimmedMessage.length > 50 || ["feel", "emotion", "anxiety", "depress", "stress"].some(keyword => lowercasedInput.includes(keyword))) {
                    const newEntry = {
                        text: trimmedMessage, // Store trimmed message
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
                errorText = `Error: ${err.message}`;
            }
            setError(errorText);
            console.error("Message sending error:", err);
            setMessages(prevMessages => prevMessages.filter(msg => msg.timestamp !== timestamp));
        } finally {
            setLoading(false);
            if (inputRef.current) inputRef.current.focus();
        }
    };

    // const scrollToBottom = () => {
    //     if (messagesEndRef.current) {
    //         messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    //         setShowScrollToBottom(false);
    //         setIsUserScrolled(false);
    //     }
    // };

    // useEffect(() => {
    //     if (!isUserScrolled && messagesContainerRef.current && messagesContainerRef.current.scrollHeight > messagesContainerRef.current.clientHeight) {
    //         scrollToBottom();
    //     }
    // // eslint-disable-next-line react-hooks/exhaustive-deps
    // }, [messages]);

    // const handleScroll = () => {
    //     if (messagesContainerRef.current) {
    //         const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    //         const isNearBottom = scrollHeight - clientHeight - scrollTop < 70; // Slightly increased threshold
    //         setIsUserScrolled(!isNearBottom);
    //         setShowScrollToBottom(!isNearBottom && scrollHeight > clientHeight + 50); // Only show if significantly scrolled and content overflows
    //     }
    // };
    
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);


    const handleMoodChange = (newMood) => {
        if (loading) return;
        setMood(newMood);
        setIsMobileMoodSelectorOpen(false);
        handleSendMessage(`I'm feeling ${newMood} today.`);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const openModal = () => {
        setIsModalOpen(true);
        // Initialization is handled by the useEffect hook that depends on 'mode'
        // and currentMode will be defined by then.
        if (!chat && !loading && currentMode?.name) {
             console.log(`Modal opened for ${currentMode.name}, re-checking chat initialization status.`);
        }
    };
    const closeModal = () => setIsModalOpen(false);

    const handleCopyResponse = (textToCopy) => {
        if (!textToCopy) return;
        if (mode === "tech") {
            navigator.clipboard.writeText(textToCopy)
                .then(() => showNotification("Copied to clipboard"))
                .catch(err => { console.error('Failed to copy text:', err); showNotification("Failed to copy"); });
        } else {
            const newEntry = {
                text: "Saved from conversation",
                timestamp: Date.now(),
                response: textToCopy
            };
            setJournalEntries(prev => [...prev, newEntry]);
            showNotification("Saved to journal");
        }
    };

    const showNotification = (message) => {
        setNotification(message);
        setTimeout(() => setNotification(null), 2500);
    };

    // Sub-Components
    const ChatHeader = () => (
        <header className={currentMode.headerClass}>
            <div className={currentMode.logoClass}>
                <div className={currentMode.logoIconClass}><FontAwesomeIcon icon={currentMode.icon} /></div>
                <span className={currentMode.logoTextClass}>{currentMode.name}</span>
                <div className={`${currentMode.subscriptionBadgeClass} ${subscription}`}>{subscription.charAt(0).toUpperCase() + subscription.slice(1)} Tier</div>
            </div>
            <div className={currentMode.controlsClass}>
                <button
                    className={`${currentMode.buttonClass} ${currentMode.buttonClass}--icon ${currentMode.buttonClass}--mode`}
                    onClick={() => setMode(mode === "tech" ? "wellness" : "tech")}
                    aria-label={`Switch to ${mode === "tech" ? "Wellness" : "Tech"} mode`}
                    title={`Switch to ${mode === "tech" ? "Wellness" : "Tech"} mode`}
                >
                    <FontAwesomeIcon icon={faExchangeAlt} />
                    <span className="mode-switch-text">Switch to {mode === "tech" ? "Wellness" : "Tech"}</span>
                </button>
                <button
                    className={`${currentMode.buttonClass} ${currentMode.buttonClass}--icon ${currentMode.buttonClass}--theme`}
                    onClick={() => setTheme(
                        mode === "tech"
                            ? (theme === "dark" ? "light" : "dark")
                            : (theme === "calm" ? "bright" : "calm")
                    )}
                    aria-label={mode === "tech" ? (theme === "dark" ? "Switch to light mode" : "Switch to dark mode") : (theme === "calm" ? "Switch to bright mode" : "Switch to calm mode")}
                    title={mode === "tech" ? (theme === "dark" ? "Switch to light mode" : "Switch to dark mode") : (theme === "calm" ? "Switch to bright mode" : "Switch to calm mode")}
                >
                    <FontAwesomeIcon icon={mode === "tech" ? (theme === "dark" ? faSun : faMoon) : (theme === "calm" ? faSun : faMoon)} />
                </button>
                <button className={`${currentMode.buttonClass} ${currentMode.buttonClass}--settings`} aria-label="Settings" title="Settings (coming soon)" disabled>
                    <FontAwesomeIcon icon={faCog} />
                    <span>Settings</span>
                </button>
            </div>
        </header>
    );

    const moodButtonData = [
        { key: "happy", emoji: "😊", label: "Happy" },
        { key: "calm", emoji: "😌", label: "Calm" },
        { key: "anxious", emoji: "😰", label: "Anxious" },
        { key: "sad", emoji: "😢", label: "Sad" },
        { key: "angry", emoji: "😠", label: "Angry" },
    ];

    const MoodSelector = () => (
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
    );

    const MobileMoodSelector = () => (
        mode === "wellness" && isMobile && (
            <div className={`mobile-mood-selector ${isMobileMoodSelectorOpen ? 'open' : ''}`}>
                <button className="mobile-mood-toggle" onClick={() => setIsMobileMoodSelectorOpen(!isMobileMoodSelectorOpen)} aria-expanded={isMobileMoodSelectorOpen}>
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
    );

    const CrisisResources = () => (
        mode === "wellness" && (
            <div className="wellness-resources">
                <h3><FontAwesomeIcon icon={faHeartbeat} /> Crisis Resources</h3>
                <p>If you're in distress or need immediate support, please reach out:</p>
                <ul>
                    <li>National Suicide Prevention Lifeline (US): Call or text 988</li>
                    <li>Crisis Text Line (US): Text HOME to 741741</li>
                    <li>Kids Help Phone (Canada): Call 1-800-668-6868 or text CONNECT to 686868</li>
                    <li>Talk Suicide Canada: Call 1-833-456-4566 (or 45645 in Quebec)</li>
                    <li>Find a local crisis center or call your local emergency number (e.g., 911).</li>
                </ul>
                <p>Remember, MindfulMate is not a substitute for professional help.</p>
            </div>
        )
    );

    const ScrollToBottomButton = () => (
        showScrollToBottom && ( <button className="scroll-to-bottom visible" onClick={scrollToBottom} aria-label="Scroll to newest messages" title="Scroll to bottom"><FontAwesomeIcon icon={faChevronDown} /></button>)
    );

    return (
        <>
            <button onClick={openModal} className={`chat-open-button ${currentMode.buttonClass}`}>
                 <FontAwesomeIcon icon={currentMode.icon} style={{ marginRight: '8px' }} />
                 {currentMode.buttonText}
            </button>

            {isModalOpen && (
                <div className={currentMode.modalClass}> {/* Uses currentMode.modalClass */}
                    <div className={currentMode.modalContentClass}> {/* Uses currentMode.modalContentClass */}
                        <div className={`chat-wrapper ${currentMode.containerClass} ${theme}`}>
                            <button onClick={closeModal} className={currentMode.closeButtonClass} aria-label="Close Chat" title="Close Chat">
                                <FontAwesomeIcon icon={faTimes} />
                            </button>

                            <ChatHeader />

                            {error && <div className={`chat-error-display ${currentMode.errorMessageClass}`}>{error}</div>}

                            <MoodSelector />
                            <MobileMoodSelector />

                            <main className={currentMode.messagesClass} ref={messagesContainerRef} onScroll={handleScroll} aria-live="polite">
                                {messages?.map((msg, index) => (
                                    <div key={index} className={`${currentMode.messageClass} ${msg.role} ${msg.isMoodUpdate ? 'mood-update' : ''}`}>
                                        <div className={currentMode.messageBubbleClass}> {/* Use explicit bubble class from config */}
                                             {msg.role === 'model' && !msg.isMoodUpdate && (
                                                <FontAwesomeIcon icon={currentMode.icon} className="message-icon model-icon" />
                                             )}
                                            <div className="message-text"> {/* Wrapper for ReactMarkdown output */}
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                                            </div>
                                            {msg.role === 'model' && !msg.isMoodUpdate && (
                                                <button
                                                    className={`message-action-button ${currentMode.buttonClass}--icon`}
                                                    onClick={() => handleCopyResponse(msg.text)}
                                                    aria-label={currentMode.copyTooltip}
                                                    title={currentMode.copyTooltip}
                                                >
                                                    <FontAwesomeIcon icon={currentMode.copyIcon} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </main>

                            <ScrollToBottomButton />

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
                                    onClick={() => handleSendMessage()} // Ensures it sends the current userInput
                                    disabled={!userInput.trim() || loading || (subscription === "free" && remainingInteractions <= 0)}
                                    aria-label="Send message"
                                    title="Send message"
                                >
                                    <FontAwesomeIcon icon={faPaperPlane} />
                                </button>
                            </footer>

                            <CrisisResources />

                             {notification && (<div className="chat-notification">{notification}</div>)}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default TechChat;