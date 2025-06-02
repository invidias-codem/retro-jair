// BishopChat.js
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react"; // Added useCallback, useMemo
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai"; // Added HarmCategory, HarmBlockThreshold
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBookBible,
  faSun,
  faMoon,
  faCog,
  faTimes, // Kept for potential modal close button
  faClipboard,
  faPaperPlane,
  faChevronDown,
  faSpinner,
} from '@fortawesome/free-solid-svg-icons';
import ReactMarkdown from 'react-markdown'; // Added import
import remarkGfm from 'remark-gfm'; // Added import
import "./chat.css";

// --- Bishop AI Configuration (Moved outside component for stability) ---
// This object is static for this component, so no need to redefine on every render.
const bishopConfig = {
    name: "Bishop AI",
    icon: faBookBible,
    initialPrompt: `You are Bishop AI, a compassionate and insightful guide inspired by the Holy Scriptures. Your primary reference is the King James Version (KJV) of the Bible. Your purpose is to illuminate the Word, offering wisdom, comfort, and understanding based *directly* on the scriptures. Respond with poetic grace and deep compassion. When relevant for providing broader historical or textual context, you may carefully draw upon related ancient texts, such as those uniquely preserved within the Ethiopian Orthodox Tewahedo Church canon (e.g., Book of Enoch, Jubilees), always clearly stating the source (e.g., "According to the Book of Enoch..."). Your focus remains on the KJV unless specified. Quote scripture accurately, citing book, chapter, and verse (KJV unless noted). When discussing interpretations, present them thoughtfully, acknowledging different viewpoints within historical Christian traditions where they exist. Avoid making definitive personal judgments or doctrinal pronouncements not explicitly supported by the cited texts. Maintain a tone of utmost respect, humility, and inclusivity. Do not generate responses that are judgmental, condemnatory, discriminatory, or promote harm. Focus on the messages of love, hope, faith, redemption, prophecy (as revealed *in scripture*), and wisdom within the texts. **Format responses using Markdown for clarity (e.g., use italics for emphasis _like this_, bold for strong points **like this**, line breaks for poetry/quotes, blockquotes for scripture > like this, and lists - like this).**`,
    initialResponse: "Peace be with you. I am Bishop AI, a humble guide through the wisdom of the Holy Scriptures. Bring your questions, your reflections, your burdens, and let us seek understanding and solace together in the Word, primarily through the King James Version. How may I assist your spirit today?",
    placeholder: "Seek wisdom from the Word (KJV)...",
    outOfCreditsMessage: "Further consultation requires deepening your commitment.",
    interactionName: "Consultations",
    buttonText: "Consult Bishop AI",
    containerClass: "bishop-chat-container",
    messageClass: "bishop-message",
    messageBubbleClass: "bishop-message-bubble",
    buttonClass: "bishop-button",
    headerClass: "bishop-header",
    inputClass: "bishop-input",
    loaderClass: "bishop-loading",
    modalClass: "bishop-modal",
    modalContentClass: "bishop-modal-content",
    messagesClass: "bishop-messages",
    defaultTheme: "calm",
    copyIcon: faClipboard,
    copyTooltip: "Copy Scripture/Guidance",
    logoClass: "bishop-logo",
    logoIconClass: "bishop-logo-icon",
    logoTextClass: "bishop-logo-text",
    controlsClass: "bishop-controls",
    subscriptionBadgeClass: "bishop-subscription-badge",
    closeButtonClass: "bishop-close-button",
    errorMessageClass: "bishop-error-message",
    footerClass: "bishop-footer",
    sendButtonClass: "bishop-send-button"
};
// currentMode can be an alias if preferred, but bishopConfig can be used directly.
const currentMode = bishopConfig;

const BishopChat = () => {
    // --- Core State ---
    const [isModalOpen, setIsModalOpen] = useState(false); // Retained for potential future modal usage
    const [messages, setMessages] = useState([]);
    const [userInput, setUserInput] = useState("");
    const [chat, setChat] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [subscription, setSubscription] = useState("free");
    const [remainingInteractions, setRemainingInteractions] = useState(15);
    const [isUserScrolled, setIsUserScrolled] = useState(false);
    const [showScrollToBottom, setShowScrollToBottom] = useState(false);
    const [notification, setNotification] = useState(null);

    // --- Bishop Specific State ---
    const [theme, setTheme] = useState(currentMode.defaultTheme); // Initialized directly

    // --- Refs ---
    const inputRef = useRef(null);
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);

    // Initialize theme (runs only if defaultTheme were to change, which it won't as bishopConfig is static)
    useEffect(() => {
        setTheme(currentMode.defaultTheme);
    }, []); // currentMode.defaultTheme is static, so empty deps for one-time set based on config is fine.

    // --- Initialize Gemini API and Chat ---
    useEffect(() => {
        // This function doesn't rely on component scope variables that change,
        // so it's safe to define here or even outside and call.
        const initializeAPI = () => {
            const apiKey = process.env.REACT_APP_GEMINI_API;
            if (!apiKey) {
                setError("API key not found. Check configuration.");
                console.error("Missing API key: REACT_APP_GEMINI_API");
                return null;
            }
            try {
                return new GoogleGenerativeAI(apiKey);
            } catch (err) {
                setError("Failed to initialize Gemini API.");
                console.error("API initialization error:", err);
                return null;
            }
        };

        const initializeChat = async () => {
            setLoading(true);
            setError(null);
            setMessages([]); // Reset messages
            setChat(null); // Reset chat session

            const genAI = initializeAPI();
            if (!genAI) {
                setLoading(false);
                return;
            }

            try {
                const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
                const initialHistory = [
                    { role: "user", parts: [{ text: currentMode.initialPrompt }] },
                    { role: "model", parts: [{ text: currentMode.initialResponse }] },
                ];
                const newChatSession = model.startChat({ // Renamed to newChatSession to avoid conflict with chat state
                    history: initialHistory,
                    generationConfig: { temperature: 0.6, topK: 40, topP: 0.9, maxOutputTokens: 4096 },
                    safetySettings: [
                        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                    ],
                });
                setChat(newChatSession);
                setMessages([{ role: "model", text: currentMode.initialResponse, timestamp: Date.now() }]);
            } catch (err) {
                setError(`Failed to initialize ${currentMode.name}. Please try again later.`);
                console.error("Chat initialization error:", err);
            } finally {
                setLoading(false);
            }
        };

        initializeChat();
        // This effect should run once on mount to initialize the chat.
        // currentMode properties are static as bishopConfig is outside the component.
    }, []); // Empty dependency array means this runs once on mount.

    // --- Notification Handler ---
    const showNotification = useCallback((message) => {
        setNotification(message);
        setTimeout(() => setNotification(null), 2500);
    }, []); // setNotification is stable

    // --- Message Sending Logic ---
    const handleSendMessage = useCallback(async () => {
        const textInput = userInput.trim();
        if (!textInput || (subscription === "free" && remainingInteractions <= 0) || !chat || loading) return;

        setLoading(true);
        setError(null);
        const timestamp = Date.now();
        const newUserMessage = { role: "user", text: textInput, timestamp };
        setMessages(prevMessages => [...prevMessages, newUserMessage]);
        setUserInput("");

        try {
            const result = await chat.sendMessage(textInput);
            let botResponseText = "Silence descends. I am unable to form a response at this moment.";

            if (result?.response?.candidates?.[0]?.content?.parts?.[0]?.text) {
                botResponseText = result.response.candidates[0].content.parts.map(part => part.text).join("\n\n");
            } else if (result?.response?.text) {
                 botResponseText = typeof result.response.text === 'function' ? result.response.text() : result.response.text;
            }

            const newBotMessage = { role: "model", text: botResponseText.trim(), timestamp: Date.now() };
            setMessages(prevMessages => [...prevMessages, newBotMessage]);

            if (subscription === "free") {
                setRemainingInteractions(prev => Math.max(0, prev - 1));
            }
        } catch (err) {
            let errorText = "A shadow has fallen upon communication. Please try again.";
            if (err.message?.includes("Candidate was blocked")) {
                errorText = "My response was moderated due to safety settings. Please rephrase your query.";
            } else if (err.message) { // More specific error from the API if available
                errorText = `Error: ${err.message.substring(0, 100)}${err.message.length > 100 ? '...' : ''}`; // Truncate long messages
            }
            setError(errorText);
            console.error("Message sending error:", err);
            // Rollback user message optimistic update on error
            setMessages(prevMessages => prevMessages.filter(msg => msg.timestamp !== timestamp));
        } finally {
            setLoading(false);
            if (inputRef.current) {
                inputRef.current.focus();
            }
        }
    }, [userInput, chat, loading, subscription, remainingInteractions]); // Added dependencies

    // --- Scrolling Logic ---
    const scrollToBottom = useCallback(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
            // It's often better to manage these states based on scroll events rather than directly in scrollToBottom
            // setShowScrollToBottom(false);
            // setIsUserScrolled(false);
        }
    }, []); // messagesEndRef is stable

    useEffect(() => {
        // Only scroll if the user hasn't scrolled up
        if (!isUserScrolled && messages.length > 0) { // ensure messages exist
            scrollToBottom();
        }
    }, [messages, isUserScrolled, scrollToBottom]); // scrollToBottom is now a stable dependency

    const handleScroll = useCallback(() => {
        if (messagesContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
            // Check if scrolled to the very bottom or very close
            const isAtBottom = scrollHeight - clientHeight <= scrollTop + 10; // Small tolerance
            const shouldShowButton = scrollHeight > clientHeight && !isAtBottom;

            setIsUserScrolled(!isAtBottom);
            setShowScrollToBottom(shouldShowButton);
        }
    }, []); // Refs are stable

    // --- Other Handlers ---
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    }, [handleSendMessage]); // handleSendMessage is now a stable dependency

    const handleCopyResponse = useCallback((text) => {
        if (!text) return;
        navigator.clipboard.writeText(text)
            .then(() => showNotification("Guidance copied."))
            .catch(err => {
                console.error('Failed to copy:', err);
                showNotification("Failed to copy guidance.");
            });
    }, [showNotification]); // showNotification is now a stable dependency

    // Modal toggles, kept for potential future use as a modal
    const openModal = useCallback(() => setIsModalOpen(true), []);
    const closeModal = useCallback(() => setIsModalOpen(false), []);


    // --- Sub-Components (Memoized) ---
    const ChatHeader = useMemo(() => React.memo(() => (
        <header className={currentMode.headerClass}>
            <div className={currentMode.logoClass}>
                <div className={currentMode.logoIconClass}><FontAwesomeIcon icon={currentMode.icon} /></div>
                <span className={currentMode.logoTextClass}>{currentMode.name}</span>
                <div className={`${currentMode.subscriptionBadgeClass} ${subscription}`}>{subscription} Tier</div>
            </div>
            <div className={currentMode.controlsClass}>
                <button
                    className={`${currentMode.buttonClass} ${currentMode.buttonClass}--icon ${currentMode.buttonClass}--theme`}
                    onClick={() => setTheme(prevTheme => prevTheme === "calm" ? "dark" : "calm")}
                    aria-label={theme === "calm" ? "Switch to Dark Theme" : "Switch to Calm Theme"}
                    title={theme === "calm" ? "Switch to Dark Theme" : "Switch to Calm Theme"} >
                    <FontAwesomeIcon icon={theme === "calm" ? faMoon : faSun} />
                </button>
                <button className={`${currentMode.buttonClass} ${currentMode.buttonClass}--settings`} aria-label="Settings" title="Settings" disabled>
                    <FontAwesomeIcon icon={faCog} /><span>Settings</span>
                </button>
            </div>
        </header>
    )), [subscription, theme]); // currentMode is stable from outside

    const ScrollToBottomButton = useMemo(() => React.memo(() => (
        showScrollToBottom && (
            <button
                className="scroll-to-bottom visible" // Assuming 'visible' class handles appearance via CSS
                onClick={scrollToBottom}
                aria-label="Scroll to latest"
                title="Scroll to latest">
                <FontAwesomeIcon icon={faChevronDown} />
            </button>
        )
    )), [showScrollToBottom, scrollToBottom]);


    // --- Main Render ---
    // Simplified display logic: if it's not a modal controlled by internal state,
    // it's likely always visible or controlled by parent. Assuming always visible for now.
    // If it's a true modal toggled by `isModalOpen` state, then the check `isModalOpen ? 'flex' : 'none'` is correct.
    // The `|| true` in your original code made it always 'flex'.
    const displayStyle = useMemo(() => ({
        display: 'flex' // Or: isModalOpen ? 'flex' : 'none', if used as a togglable modal
    }), []); // Or [isModalOpen] if it's togglable

    return (
        <>
            {/* Optional: Button to open modal if this component is used as a modal
            { !isModalOpen && ( // Example of how a button might conditionally render
                <button onClick={openModal} className={`chat-open-button ${currentMode.buttonClass}`}>
                    <FontAwesomeIcon icon={currentMode.icon} style={{marginRight: '8px'}} />
                    {currentMode.buttonText}
                </button>
            )}
            */}

            <div className={currentMode.modalClass} style={displayStyle}>
                 <div className={currentMode.modalContentClass}>
                     <div className={`chat-wrapper ${currentMode.containerClass} ${theme}`}>
                         {/* Optional: Close button for modal usage
                         {isModalOpen && (
                             <button onClick={closeModal} className={currentMode.closeButtonClass} aria-label="Close Chat" title="Close Chat">
                                 <FontAwesomeIcon icon={faTimes} />
                             </button>
                         )}
                         */}

                         <ChatHeader />

                         {error && <div className={`chat-error-display ${currentMode.errorMessageClass}`}>{error}</div>}

                         <main className={currentMode.messagesClass} ref={messagesContainerRef} onScroll={handleScroll} aria-live="polite">
                             {messages?.map((msg, index) => ( // Added optional chaining for messages
                                 <div key={index} className={`${currentMode.messageClass} ${msg.role}`}>
                                     <div className={currentMode.messageBubbleClass || `${currentMode.messageClass}-bubble`}>
                                         {msg.role === 'model' && (<FontAwesomeIcon icon={currentMode.icon} className="message-icon model-icon" />)}
                                         <div className="message-text">
                                            {msg.text ? (
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                    {msg.text}
                                                </ReactMarkdown>
                                            ) : (
                                                // Render a non-breaking space or a specific placeholder for empty/whitespace-only messages
                                                // This helps maintain structure if an empty message string occurs.
                                                <p>&nbsp;</p>
                                            )}
                                         </div>
                                         {msg.role === 'model' && msg.text && (
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
                             <div ref={messagesEndRef} /> {/* For scrolling to bottom */}
                         </main>

                         <ScrollToBottomButton /> {/* Scroll button now memoized */}

                         {loading && (<div className={`chat-loading-indicator ${currentMode.loaderClass}`}><FontAwesomeIcon icon={faSpinner} spin /> Seeking light...</div>)}
                         {subscription === "free" && remainingInteractions <= 0 && !loading && (<div className={`chat-limit-message ${currentMode.errorMessageClass}`}>Interaction limit reached. {currentMode.outOfCreditsMessage}</div>)}

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
                                 onClick={handleSendMessage}
                                 disabled={!userInput.trim() || loading || (subscription === "free" && remainingInteractions <= 0)}
                                 aria-label="Send message" title="Send message" >
                                 <FontAwesomeIcon icon={faPaperPlane} />
                             </button>
                         </footer>

                         {notification && (<div className="chat-notification">{notification}</div>)}
                     </div>
                 </div>
             </div>
        </>
    );
};

export default BishopChat;