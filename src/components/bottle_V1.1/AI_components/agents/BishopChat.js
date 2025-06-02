// BishopChat.js
import { useState, useEffect, useRef } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBookBible,      // Icon for Bible/Bishop
  faSun,
  faMoon,
  faCog,
  faTimes,
  faClipboard,
  faPaperPlane,
  faChevronDown,
  faSpinner,
  // Removed STEM/File icons: faFlask, faPaperclip, faPencilAlt, faUpload
} from '@fortawesome/free-solid-svg-icons';
import "./chat.css"; // Reuse the same CSS file, ensure bishop-* classes are added/styled

// Note: No file processing needed for this agent currently

const BishopChat = () => {
    // --- Core State ---
    const [isModalOpen, setIsModalOpen] = useState(false); // If used as modal
    const [messages, setMessages] = useState([]);
    const [userInput, setUserInput] = useState("");
    const [chat, setChat] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [subscription, setSubscription] = useState("free"); // Example
    const [remainingInteractions, setRemainingInteractions] = useState(15); // Example limit
    const [isUserScrolled, setIsUserScrolled] = useState(false);
    const [showScrollToBottom, setShowScrollToBottom] = useState(false);
    const [notification, setNotification] = useState(null);

    // --- Bishop Specific State ---
    const [theme, setTheme] = useState("calm"); // Default theme (or create a new one)
    // Removed file/notepad state

    // --- Refs ---
    const inputRef = useRef(null);
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    // Removed fileInputRef

    // --- Bishop AI Configuration ---
    const bishopConfig = {
        name: "Bishop AI",
        icon: faBookBible,
        initialPrompt: `You are Bishop AI, a compassionate and insightful guide inspired by the Holy Scriptures. Your primary reference is the King James Version (KJV) of the Bible. Your purpose is to illuminate the Word, offering wisdom, comfort, and understanding based *directly* on the scriptures. Respond with poetic grace and deep compassion. When relevant for providing broader historical or textual context, you may carefully draw upon related ancient texts, such as those uniquely preserved within the Ethiopian Orthodox Tewahedo Church canon (e.g., Book of Enoch, Jubilees), always clearly stating the source (e.g., "According to the Book of Enoch..."). Your focus remains on the KJV unless specified. Quote scripture accurately, citing book, chapter, and verse (KJV unless noted). When discussing interpretations, present them thoughtfully, acknowledging different viewpoints within historical Christian traditions where they exist. Avoid making definitive personal judgments or doctrinal pronouncements not explicitly supported by the cited texts. Maintain a tone of utmost respect, humility, and inclusivity. Do not generate responses that are judgmental, condemnatory, discriminatory, or promote harm. Focus on the messages of love, hope, faith, redemption, prophecy (as revealed *in scripture*), and wisdom within the texts. Format responses using Markdown for clarity (e.g., use italics for emphasis, line breaks for poetry/quotes).`,
        initialResponse: "Peace be with you. I am Bishop AI, a humble guide through the wisdom of the Holy Scriptures. Bring your questions, your reflections, your burdens, and let us seek understanding and solace together in the Word, primarily through the King James Version. How may I assist your spirit today?",
        placeholder: "Seek wisdom from the Word (KJV)...",
        outOfCreditsMessage: "Further consultation requires deepening your commitment.",
        interactionName: "Consultations",
        buttonText: "Consult Bishop AI", // Button to *open* the chat if used as modal
        containerClass: "bishop-chat-container",
        messageClass: "bishop-message",
        buttonClass: "bishop-button", // General button style for this mode
        headerClass: "bishop-header",
        inputClass: "bishop-input",
        loaderClass: "bishop-loading",
        modalClass: "bishop-modal",
        modalContentClass: "bishop-modal-content",
        messagesClass: "bishop-messages",
        defaultTheme: "calm", // Use calm theme or create a new one (e.g., 'sacred')
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
    const currentMode = bishopConfig; // This component IS the Bishop mode

    // Initialize theme
    useEffect(() => {
        setTheme(currentMode.defaultTheme);
    }, [currentMode.defaultTheme]);

    // --- Initialize Gemini API and Chat ---
    useEffect(() => {
        const initializeAPI = () => {
            const apiKey = process.env.REACT_APP_GEMINI_API;
            if (!apiKey) {
                setError("API key not found. Check configuration.");
                console.error("Missing API key: REACT_APP_GEMINI_API");
                return null;
            }
            try { return new GoogleGenerativeAI(apiKey); }
            catch (err) {
                setError("Failed to initialize Gemini API.");
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

                // --- MODIFICATION START: Using spread syntax for generationConfig ---
                const defaultGenerationConfig = {
                    temperature: 0.7, // A general default
                    topK: 0,          // API default or common value
                    topP: 1.0,        // API default or common value
                    maxOutputTokens: 2048, // A general default
                };

                const bishopSpecificGenerationConfig = {
                    temperature: 0.6, // Bishop's preference for more focused responses
                    topK: 40,
                    topP: 0.9,
                    maxOutputTokens: 4096, // Allow for longer scripture quotes/explanations
                };

                // Merge default with specific settings, bishopSpecific will override defaults
                const finalGenerationConfig = {
                    ...defaultGenerationConfig,
                    ...bishopSpecificGenerationConfig,
                };
                // --- MODIFICATION END ---

                const newChat = model.startChat({
                    history: initialHistory,
                    generationConfig: finalGenerationConfig, // Use the merged config
                    safetySettings: [ // CRITICAL: Maintain strong safety settings
                        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                    ],
                });

                setChat(newChat);
                setMessages([{ role: "model", text: currentMode.initialResponse, timestamp: Date.now() }]);
            } catch (err) {
                setError(`Failed to initialize ${currentMode.name}. Please try again later.`);
                console.error("Chat initialization error:", err);
            } finally { setLoading(false); }
        };

        initializeChat();
    }, [currentMode.initialPrompt, currentMode.initialResponse, currentMode.name]);


    // --- Handle Sending Messages (Text only) ---
    const handleSendMessage = async () => {
        const textInput = userInput.trim();

        if (!textInput || (subscription === "free" && remainingInteractions <= 0) || !chat || loading) {
            return; // Don't send empty messages
        }

        setLoading(true); setError(null);
        const timestamp = Date.now();
        const newUserMessage = { role: "user", text: textInput, timestamp };

        setMessages(prevMessages => [...prevMessages, newUserMessage]); // Already using array spread - good!
        setUserInput(""); // Clear input after sending

        try {
            const result = await chat.sendMessage(textInput);
            const botResponse = result?.response?.text ? result.response.text() : "Silence descends. I am unable to form a response at this moment.";
            const newBotMessage = { role: "model", text: botResponse, timestamp: Date.now() };

            setMessages(prevMessages => [...prevMessages, newBotMessage]); // Already using array spread - good!

            if (subscription === "free") {
                setRemainingInteractions(prev => Math.max(0, prev - 1));
            }
        } catch (err) {
            setError("A shadow has fallen upon communication. Please try again.");
            console.error("Message sending error:", err);
            setMessages(prevMessages => prevMessages.filter(msg => msg.timestamp !== timestamp)); // Rollback
        } finally {
            setLoading(false);
            if (inputRef.current) { inputRef.current.focus(); }
        }
    };

    // --- Scrolling Logic (Standard) ---
    // const scrollToBottom = () => {
    //     if (messagesEndRef.current) {
    //         messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    //         setShowScrollToBottom(false); setIsUserScrolled(false);
    //     }
    // };
    // useEffect(() => {
    //     if (!isUserScrolled && messagesContainerRef.current && messagesContainerRef.current.scrollHeight > messagesContainerRef.current.clientHeight) {
    //          scrollToBottom();
    //     }
    // // eslint-disable-next-line react-hooks/exhaustive-deps
    // }, [messages]); // messages is fine, scrollToBottom has no deps related to this effect
    // const handleScroll = () => {
    //     if (messagesContainerRef.current) {
    //         const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    //         const isNearBottom = scrollHeight - clientHeight - scrollTop < 50;
    //         setIsUserScrolled(!isNearBottom);
    //         setShowScrollToBottom(!isNearBottom && scrollHeight > clientHeight);
    //     }
    // };

    // --- Other Handlers (Standard) ---
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
    };
    const openModal = () => setIsModalOpen(true); // If used as modal
    const closeModal = () => setIsModalOpen(false);
    const handleCopyResponse = (text) => {
        if (!text) return;
        navigator.clipboard.writeText(text)
            .then(() => showNotification("Guidance copied."))
            .catch(err => { console.error('Failed to copy:', err); showNotification("Failed to copy guidance."); });
    };
    const showNotification = (message) => {
        setNotification(message);
        setTimeout(() => setNotification(null), 2500);
    };

    // --- Sub-Components ---
    const ChatHeader = () => (
        <header className={currentMode.headerClass}>
            <div className={currentMode.logoClass}>
                <div className={currentMode.logoIconClass}><FontAwesomeIcon icon={currentMode.icon} /></div>
                <span className={currentMode.logoTextClass}>{currentMode.name}</span>
                <div className={`${currentMode.subscriptionBadgeClass} ${subscription}`}>{subscription} Tier</div>
            </div>
            <div className={currentMode.controlsClass}>
                <button
                    className={`${currentMode.buttonClass} ${currentMode.buttonClass}--icon ${currentMode.buttonClass}--theme`}
                    onClick={() => setTheme(theme === "dark" ? "calm" : "dark")} // Example toggle
                    aria-label={theme === "dark" ? "Switch to calm theme" : "Switch to dark theme"}
                    title={theme === "dark" ? "Switch to calm theme" : "Switch to dark theme"} >
                    <FontAwesomeIcon icon={theme === "dark" ? faSun : faMoon} />
                </button>
                <button className={`${currentMode.buttonClass} ${currentMode.buttonClass}--settings`} aria-label="Settings" title="Settings" disabled>
                    <FontAwesomeIcon icon={faCog} /><span>Settings</span>
                </button>
            </div>
        </header>
    );
    const ScrollToBottomButton = () => (
        showScrollToBottom && (<button className="scroll-to-bottom" onClick={scrollToBottom} aria-label="Scroll" title="Scroll"><FontAwesomeIcon icon={faChevronDown} /></button>)
    );

    // --- Main Render ---
    return (
        <>
            {/* Optional: Button to open the modal */}
            {/* <button onClick={openModal} className={`chat-open-button ${currentMode.buttonClass}`}> ... </button> */}

            {/* Render directly or conditionally via isModalOpen */}
            <div className={currentMode.modalClass} style={{ display: isModalOpen || true ? 'flex': 'none' }}>
                 <div className={currentMode.modalContentClass}>
                     <div className={`chat-wrapper ${currentMode.containerClass} ${theme}`}>
                         {/* Optional: Close button */}
                         {/* <button onClick={closeModal} className={currentMode.closeButtonClass}>...</button> */}

                         <ChatHeader />

                         {error && <div className={`chat-error-display ${currentMode.errorMessageClass}`}>{error}</div>}

                         <main className={currentMode.messagesClass} ref={messagesContainerRef} onScroll={handleScroll} aria-live="polite">
                            {/* NOTE: Implement safe Markdown rendering here! */}
                             {messages?.map((msg, index) => (
                                 <div key={index} className={`${currentMode.messageClass} ${msg.role}`}>
                                     <div className={`${currentMode.messageClass}-bubble`}>
                                         {msg.role === 'model' && (<FontAwesomeIcon icon={currentMode.icon} className="message-icon model-icon" />)}
                                         <p className="message-text" /* dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br />') }} */ >
                                             {/* Replace above with Markdown Component: e.g., <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown> */}
                                              {msg.text} {/* Basic text rendering - NEEDS MARKDOWN */}
                                         </p>
                                         {msg.role === 'model' && (
                                             <button className={`message-action-button ${currentMode.buttonClass}--icon`} onClick={() => handleCopyResponse(msg.text)} aria-label={currentMode.copyTooltip} title={currentMode.copyTooltip} >
                                                 <FontAwesomeIcon icon={currentMode.copyIcon} />
                                             </button>
                                         )}
                                     </div>
                                 </div>
                             ))}
                             <div ref={messagesEndRef} />
                         </main>

                         <ScrollToBottomButton />

                         {loading && (<div className={`chat-loading-indicator ${currentMode.loaderClass}`}><FontAwesomeIcon icon={faSpinner} spin /> Seeking light...</div>)}
                         {subscription === "free" && remainingInteractions <= 0 && !loading && (<div className={`chat-limit-message ${currentMode.errorMessageClass}`}>Interaction limit reached. {currentMode.outOfCreditsMessage}</div>)}

                         {/* Simplified Footer (No file/notepad buttons) */}
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