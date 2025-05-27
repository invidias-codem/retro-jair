// BishopChat.js
import React, { useState, useEffect, useRef } from "react";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai"; // Assuming HarmCategory and HarmBlockThreshold are used in your safety settings if not explicitly shown below
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBookBible,
  faSun,
  faMoon,
  faCog,
  faTimes,
  faClipboard,
  faPaperPlane,
  faChevronDown,
  faSpinner,
} from '@fortawesome/free-solid-svg-icons';

// ***** ADD THESE IMPORTS for Markdown *****
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm'; // For GitHub Flavored Markdown (tables, strikethrough, etc.)
// *****************************************

import "./chat.css";

const BishopChat = () => {
    // --- Core State ---
    const [isModalOpen, setIsModalOpen] = useState(false);
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
    const [theme, setTheme] = useState("calm");

    // --- Refs ---
    const inputRef = useRef(null);
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);

    // --- Bishop AI Configuration ---
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
        messageClass: "bishop-message", // Used as base for message bubble class
        messageBubbleClass: "bishop-message-bubble", // Explicit class for styling the bubble itself
        buttonClass: "bishop-button",
        headerClass: "bishop-header",
        inputClass: "bishop-input",
        loaderClass: "bishop-loading",
        modalClass: "bishop-modal", // Assuming this is your main modal class from chat.css
        modalContentClass: "bishop-modal-content", // Assuming this is from chat.css
        messagesClass: "bishop-messages",
        defaultTheme: "calm",
        copyIcon: faClipboard,
        copyTooltip: "Copy Scripture/Guidance",
        logoClass: "bishop-logo",
        logoIconClass: "bishop-logo-icon",
        logoTextClass: "bishop-logo-text",
        controlsClass: "bishop-controls",
        subscriptionBadgeClass: "bishop-subscription-badge",
        closeButtonClass: "bishop-close-button", // General close button style from chat.css
        errorMessageClass: "bishop-error-message",
        footerClass: "bishop-footer",
        sendButtonClass: "bishop-send-button"
    };
    const currentMode = bishopConfig;

    useEffect(() => {
        setTheme(currentMode.defaultTheme);
    }, [currentMode.defaultTheme]);

    useEffect(() => {
        const initializeAPI = () => {
            const apiKey = process.env.REACT_APP_GEMINI_API;
            if (!apiKey) { setError("API key not found. Check configuration."); console.error("Missing API key: REACT_APP_GEMINI_API"); return null; }
            try { return new GoogleGenerativeAI(apiKey); }
            catch (err) { setError("Failed to initialize Gemini API."); console.error("API initialization error:", err); return null; }
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
                    generationConfig: { temperature: 0.6, topK: 40, topP: 0.9, maxOutputTokens: 4096 },
                    safetySettings: [ // Ensure these use HarmCategory and HarmBlockThreshold correctly
                        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentMode.initialPrompt, currentMode.initialResponse, currentMode.name]); // Removed currentMode from deps, specific properties are better

    const handleSendMessage = async () => {
        const textInput = userInput.trim();
        if (!textInput || (subscription === "free" && remainingInteractions <= 0) || !chat || loading) return;

        setLoading(true); setError(null);
        const timestamp = Date.now();
        const newUserMessage = { role: "user", text: textInput, timestamp };
        setMessages(prevMessages => [...prevMessages, newUserMessage]);
        setUserInput("");

        try {
            const result = await chat.sendMessage(textInput);
            // The Gemini API typically returns response.candidates[0].content.parts[0].text for simple text.
            // Ensure your model and SDK version provide response.text() directly or adjust access.
            // Based on your previous code, response.text() seems to be the expected path.
            let botResponseText = "Silence descends. I am unable to form a response at this moment.";
            if (result?.response?.candidates?.[0]?.content?.parts?.[0]?.text) {
                botResponseText = result.response.candidates[0].content.parts.map(part => part.text).join("\n\n"); // Join parts if multiple
            } else if (result?.response?.text) { // Fallback if text() method exists (less common for structured parts)
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
            } else if (err.message) {
                errorText = `Error: ${err.message}`;
            }
            setError(errorText);
            console.error("Message sending error:", err);
            setMessages(prevMessages => prevMessages.filter(msg => msg.timestamp !== timestamp));
        } finally {
            setLoading(false);
            if (inputRef.current) { inputRef.current.focus(); }
        }
    };

    // --- Scrolling Logic (Standard - no changes) ---
    const scrollToBottom = () => { /* ... */ };
    useEffect(() => { /* ... */ }, [messages, isUserScrolled]); // Added isUserScrolled dependency
    const handleScroll = () => { /* ... */ };

    // --- Other Handlers (Standard - no changes) ---
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    useEffect(() => { /* ... */ }, []);
    const handleKeyDown = (e) => { /* ... */ };
    const openModal = () => setIsModalOpen(true);
    const closeModal = () => setIsModalOpen(false);
    const handleCopyResponse = (text) => { /* ... */ };
    const showNotification = (message) => { /* ... */ };


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
                    onClick={() => setTheme(theme === "calm" ? "dark" : "calm")} // Cycle between calm and dark
                    aria-label={theme === "calm" ? "Switch to Dark Theme" : "Switch to Calm Theme"}
                    title={theme === "calm" ? "Switch to Dark Theme" : "Switch to Calm Theme"} >
                    <FontAwesomeIcon icon={theme === "calm" ? faMoon : faSun} /> {/* Icon reflects what it will switch TO */}
                </button>
                <button className={`${currentMode.buttonClass} ${currentMode.buttonClass}--settings`} aria-label="Settings" title="Settings" disabled>
                    <FontAwesomeIcon icon={faCog} /><span>Settings</span>
                </button>
            </div>
        </header>
    );
    const ScrollToBottomButton = () => (
        showScrollToBottom && (<button className="scroll-to-bottom visible" onClick={scrollToBottom} aria-label="Scroll to latest" title="Scroll to latest"><FontAwesomeIcon icon={faChevronDown} /></button>)
    );

    return (
        <>
            {/* Example: Button to open modal if this component is used as a modal */}
            {/* <button onClick={openModal} className={`chat-open-button ${currentMode.buttonClass}`}>
                <FontAwesomeIcon icon={currentMode.icon} style={{marginRight: '8px'}} />
                {currentMode.buttonText}
            </button> */}

            <div className={currentMode.modalClass} style={{ display: isModalOpen || true ? 'flex' : 'none' }}> {/* Assuming always visible for now or isModalOpen controls it */}
                 <div className={currentMode.modalContentClass}>
                     <div className={`chat-wrapper ${currentMode.containerClass} ${theme}`}>
                         {/* If used as a true modal, a close button like this would be typical */}
                         {/* <button onClick={closeModal} className={currentMode.closeButtonClass} aria-label="Close Chat" title="Close Chat">
                             <FontAwesomeIcon icon={faTimes} />
                         </button> */}

                         <ChatHeader />

                         {error && <div className={`chat-error-display ${currentMode.errorMessageClass}`}>{error}</div>}

                         <main className={currentMode.messagesClass} ref={messagesContainerRef} onScroll={handleScroll} aria-live="polite">
                             {messages?.map((msg, index) => (
                                 <div key={index} className={`${currentMode.messageClass} ${msg.role}`}>
                                     {/* Use explicit messageBubbleClass from config */}
                                     <div className={currentMode.messageBubbleClass || `${currentMode.messageClass}-bubble`}>
                                         {msg.role === 'model' && (<FontAwesomeIcon icon={currentMode.icon} className="message-icon model-icon" />)}
                                         
                                         {/* ***** REVISED MESSAGE RENDERING ***** */}
                                         <div className="message-text"> {/* Wrapper for ReactMarkdown styling */}
                                            {msg.text ? (
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                    {msg.text}
                                                </ReactMarkdown>
                                            ) : (
                                                <p>&nbsp;</p> /* Render a non-breaking space or placeholder for empty messages */
                                            )}
                                         </div>
                                         {/* ************************************* */}

                                         {msg.role === 'model' && msg.text && ( // Ensure msg.text exists before showing copy button
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