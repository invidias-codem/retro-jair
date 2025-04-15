import React, { useState, useEffect, useRef } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
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
  faSpinner // Added for loading state
} from '@fortawesome/free-solid-svg-icons';
import "./chat.css"; // Ensure this CSS file exists and contains necessary styles

const Chat = () => {
    // Core state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [userInput, setUserInput] = useState("");
    const [chat, setChat] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [subscription, setSubscription] = useState("free"); // Example: "free" or "premium"
    const [remainingInteractions, setRemainingInteractions] = useState(5); // Example limit for free tier
    const [isUserScrolled, setIsUserScrolled] = useState(false);
    const [showScrollToBottom, setShowScrollToBottom] = useState(false);
    const [notification, setNotification] = useState(null); // For copy/save notifications

    // Mode specific state
    const [mode, setMode] = useState("tech"); // "tech" or "wellness"
    const [mood, setMood] = useState("neutral"); // For wellness mode
    const [journalEntries, setJournalEntries] = useState([]); // For wellness mode
    const [theme, setTheme] = useState("dark"); // Default theme
    const [isMobileMoodSelectorOpen, setIsMobileMoodSelectorOpen] = useState(false); // For mobile mood selector toggle

    // Refs
    const inputRef = useRef(null);
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);

    // Mode-specific properties
    const modeConfig = {
        tech: {
            name: "TechGenie",
            icon: faRobot,
            initialPrompt: "You are TechGenie, an expert computer technology consultant. Assist users with their tech-related questions.",
            initialResponse: "Hello! I'm TechGenie, your expert tech consultant. I can help you with hardware recommendations, software troubleshooting, coding questions, and any other tech-related inquiries. What can I assist you with today?",
            placeholder: "Ask me anything about technology...",
            outOfCreditsMessage: "Upgrade to continue asking questions!",
            interactionName: "Questions",
            buttonText: "Chat with TechGenie",
            containerClass: "tech-chat-container",
            messageClass: "tech-message",
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
            initialPrompt: "You are MindfulMate, a supportive mental wellness companion. You provide evidence-based self-help techniques, coping strategies, and mindfulness exercises. You carefully avoid making medical diagnoses or replacing professional mental health care. For serious concerns, you always recommend seeking professional help.",
            initialResponse: "Hello! I'm MindfulMate, your supportive mental wellness companion. I'm here to listen and provide evidence-based coping strategies, mindfulness exercises, and self-help techniques. Remember that I'm not a replacement for professional mental healthcare - if you're experiencing severe distress, please reach out to a qualified mental health professional. How are you feeling today?",
            placeholder: "Share what's on your mind...",
            outOfCreditsMessage: "Upgrade to continue your wellness journey",
            interactionName: "Sessions",
            buttonText: "Talk with MindfulMate",
            containerClass: "mindful-chat-container",
            messageClass: "mindful-message",
            buttonClass: "mindful-button",
            headerClass: "mindful-header",
            inputClass: "mindful-input",
            loaderClass: "mindful-loading",
            modalClass: "mindful-modal",
            modalContentClass: "mindful-modal-content",
            messagesClass: "mindful-messages",
            defaultTheme: "calm",
            copyIcon: faClipboard, // Changed to clipboard for saving to journal visual consistency
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

    // Get the current mode configuration
    const currentMode = modeConfig[mode];

    // Initialize theme based on mode
    useEffect(() => {
        // Set theme based on the default for the selected mode
        setTheme(currentMode.defaultTheme);
    }, [mode, currentMode.defaultTheme]); // Depend on mode and the default theme itself

    // Initialize chat with the selected mode
    useEffect(() => {
        const initializeAPI = () => {
            const apiKey = process.env.REACT_APP_GEMINI_API;
            if (!apiKey) {
                setError("API key not found. Check your environment configuration.");
                console.error("Missing API key in environment variables (REACT_APP_GEMINI_API)");
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
            setLoading(true); // Show loading indicator during initialization
            setError(null);   // Clear previous errors
            setMessages([]); // Clear previous messages immediately
            setChat(null);    // Clear previous chat instance

            const genAI = initializeAPI();
            if (!genAI) {
                setLoading(false);
                return; // Stop if API failed to initialize
            }

            try {
                // Use a specific model - ensure this model identifier is correct and available
                const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" }); // Updated model name

                const initialHistory = [
                    { role: "user", parts: [{ text: currentMode.initialPrompt }] },
                    { role: "model", parts: [{ text: currentMode.initialResponse }] },
                ];

                const newChat = model.startChat({
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

                // Add only the initial response from the model to the visible chat
                setMessages([{
                    role: "model",
                    text: currentMode.initialResponse,
                    timestamp: Date.now()
                }]);

            } catch (err) {
                setError(`Failed to initialize ${currentMode.name} chat. Please ensure the API key is valid and the model is available. Try again later.`);
                console.error("Chat initialization error:", err);
                // Optionally keep the modal open to show the error, or close it
            } finally {
                setLoading(false); // Hide loading indicator
                // Reset mood selector on mode change if applicable
                if (mode === 'wellness') setMood('neutral');
                setIsMobileMoodSelectorOpen(false); // Close mobile mood selector
            }
        };

        initializeChat();

        // Cleanup function (optional, if needed)
        // return () => { console.log("Cleaning up chat for mode:", mode); };

    // Re-initialize whenever the mode changes
    }, [mode, currentMode.initialPrompt, currentMode.initialResponse, currentMode.name]); // Added dependencies

    const handleSendMessage = async (messageToSend = userInput) => { // Allow passing message directly
        if (!messageToSend.trim() || (subscription === "free" && remainingInteractions <= 0) || !chat || loading) return;

        setLoading(true);
        setError(null); // Clear previous errors on new message send
        const timestamp = Date.now();
        const newUserMessage = { role: "user", text: messageToSend, timestamp };

        // Optimistically add user message
        setMessages(prevMessages => [...prevMessages, newUserMessage]);
        const currentInput = messageToSend; // Store the input being sent
        if (messageToSend === userInput) { // Only clear input if it came from the input field
             setUserInput("");
        }

        try {
            const result = await chat.sendMessage(currentInput);
            // Make sure response and text() exist before calling
            const botResponse = result?.response?.text ? result.response.text() : "Sorry, I received an empty response.";
            const newBotMessage = {
                role: "model",
                text: botResponse,
                timestamp: Date.now()
            };

            setMessages(prevMessages => [...prevMessages, newBotMessage]);

            // Save significant messages to journal in wellness mode
            if (mode === "wellness" && (
                currentInput.length > 50 || // Adjusted length threshold
                currentInput.toLowerCase().includes("feel") ||
                currentInput.toLowerCase().includes("emotion") ||
                currentInput.toLowerCase().includes("anxiety") ||
                currentInput.toLowerCase().includes("depress") || // Broader match
                currentInput.toLowerCase().includes("stress"))
            ) {
                const newEntry = {
                    text: currentInput,
                    timestamp: timestamp, // Use user message timestamp
                    response: botResponse.substring(0, 150) + (botResponse.length > 150 ? "..." : "")
                };
                setJournalEntries(prev => [...prev, newEntry]);
                 // Optionally show notification: showNotification("Entry added to journal");
            }

            if (subscription === "free") {
                setRemainingInteractions(prev => Math.max(0, prev - 1)); // Ensure it doesn't go below 0
            }
        } catch (err) {
            setError("I couldn't process your message. Please check your connection or try again.");
            console.error("Message sending error:", err);
            // Rollback: Remove the optimistically added user message if sending failed
            setMessages(prevMessages => prevMessages.filter(msg => msg.timestamp !== timestamp));
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
            // Automatically hide the button when scrolled to bottom
            setShowScrollToBottom(false);
            setIsUserScrolled(false); // Update state to reflect we are at the bottom
        }
    };

    // Auto-scroll effect when messages update ONLY if the user wasn't scrolled up
    useEffect(() => {
        if (!isUserScrolled && messagesContainerRef.current) {
             // Check if the container is actually scrollable before scrolling
             if (messagesContainerRef.current.scrollHeight > messagesContainerRef.current.clientHeight) {
                scrollToBottom();
             }
        }
        // No else needed here, handleScroll determines if button should show
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [messages]); // Rerun only when messages change

    // Handle scroll events to detect if user scrolled up
    const handleScroll = () => {
        if (messagesContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
            // Consider scrolled up if more than ~half a message height from bottom
            const isNearBottom = scrollHeight - clientHeight - scrollTop < 50;
            setIsUserScrolled(!isNearBottom);
            setShowScrollToBottom(!isNearBottom && scrollHeight > clientHeight); // Show button only if scrolled up AND content overflows
        }
    };

    // Detect if user is on mobile
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Handle mood selection in wellness mode
    const handleMoodChange = (newMood) => {
        if (loading) return; // Don't allow mood change while processing
        setMood(newMood);
        setIsMobileMoodSelectorOpen(false); // Close selector after selection on mobile

        const moodText = `I'm feeling ${newMood} today.`;
        // Add the mood selection *only* as a user message to be sent
        // Avoid adding directly to messages state here, let handleSendMessage do it
        // setUserInput(moodText); // Set input field value

        // Immediately trigger send message with the mood text
        // Use the callback version of setUserInput if needed, but directly calling handleSendMessage is cleaner
        handleSendMessage(moodText);
    };


    const ChatHeader = () => (
        <header className={currentMode.headerClass}>
            <div className={currentMode.logoClass}>
                <div className={currentMode.logoIconClass}>
                    <FontAwesomeIcon icon={currentMode.icon} />
                </div>
                <span className={currentMode.logoTextClass}>
                    {currentMode.name}
                </span>
                <div className={`${currentMode.subscriptionBadgeClass} ${subscription}`}>
                    {subscription.charAt(0).toUpperCase() + subscription.slice(1)} Tier
                </div>
            </div>
            <div className={currentMode.controlsClass}>
                <button
                    className={`${currentMode.buttonClass} ${currentMode.buttonClass}--icon ${currentMode.buttonClass}--mode`}
                    onClick={() => setMode(mode === "tech" ? "wellness" : "tech")}
                    aria-label={`Switch to ${mode === "tech" ? "Wellness" : "Tech"} mode`}
                    title={`Switch to ${mode === "tech" ? "Wellness" : "Tech"} mode`} // Tooltip
                >
                    <FontAwesomeIcon icon={faExchangeAlt} />
                    <span className="mode-switch-text">Switch to {mode === "tech" ? "Wellness" : "Tech"}</span>
                </button>
                <button
                    className={`${currentMode.buttonClass} ${currentMode.buttonClass}--icon ${currentMode.buttonClass}--theme`}
                    onClick={() => setTheme(
                        mode === "tech"
                            ? (theme === "dark" ? "light" : "dark")
                            // Example wellness themes, adjust as needed in CSS
                            : (theme === "calm" ? "bright" : "calm")
                    )}
                    aria-label={
                        mode === "tech"
                            ? (theme === "dark" ? "Switch to light mode" : "Switch to dark mode")
                            : (theme === "calm" ? "Switch to bright mode" : "Switch to calm mode")
                    }
                     title={ // Tooltip
                        mode === "tech"
                            ? (theme === "dark" ? "Switch to light mode" : "Switch to dark mode")
                            : (theme === "calm" ? "Switch to bright mode" : "Switch to calm mode")
                    }
                >
                    <FontAwesomeIcon icon={
                        // Ensure icons match the state AFTER click
                         mode === "tech"
                            ? (theme === "dark" ? faSun : faMoon) // If dark, show Sun (to switch to light)
                            : (theme === "calm" ? faSun : faMoon)  // If calm, show Sun (to switch to bright)
                    } />
                </button>
                <button className={`${currentMode.buttonClass} ${currentMode.buttonClass}--settings`} aria-label="Settings" title="Settings (coming soon)" disabled>
                    <FontAwesomeIcon icon={faCog} />
                    <span>Settings</span>
                </button>
            </div>
        </header>
    );

    const MoodSelector = () => (
        mode === "wellness" && !isMobile && (
            <div className="mood-selector">
                <p>How are you feeling right now?</p>
                <div className="mood-buttons">
                    {/* Refactored buttons for brevity */}
                    {["happy", "calm", "anxious", "sad", "angry"].map(m => (
                       <button
                            key={m}
                            className={`mood-button ${mood === m ? "active" : ""}`}
                            onClick={() => handleMoodChange(m)}
                            disabled={loading} // Disable when loading
                       >
                           <span role="img" aria-label={m.charAt(0).toUpperCase() + m.slice(1)}>
                                { { happy: '😊', calm: '😌', anxious: '😰', sad: '😢', angry: '😠' }[m] }
                            </span>
                           <span>{m.charAt(0).toUpperCase() + m.slice(1)}</span>
                       </button>
                    ))}
                </div>
            </div>
        )
    );

    // Collapsible mood selector for mobile
    const MobileMoodSelector = () => (
        mode === "wellness" && isMobile && (
            <div className={`mobile-mood-selector ${isMobileMoodSelectorOpen ? 'open' : ''}`}>
                <button
                    className="mobile-mood-toggle"
                    onClick={() => setIsMobileMoodSelectorOpen(!isMobileMoodSelectorOpen)}
                    aria-expanded={isMobileMoodSelectorOpen}
                >
                    <FontAwesomeIcon icon={faChevronDown} className="toggle-icon" />
                    <span>How are you feeling? {mood !== 'neutral' && `(${mood})`}</span>
                </button>
                {isMobileMoodSelectorOpen && (
                    <div className="mobile-mood-buttons">
                         {["happy", "calm", "anxious", "sad", "angry"].map(m => (
                            <button
                                key={m}
                                className={`mobile-mood-button ${mood === m ? "active" : ""}`}
                                onClick={() => handleMoodChange(m)}
                                disabled={loading} // Disable when loading
                            >
                                <span role="img" aria-label={m.charAt(0).toUpperCase() + m.slice(1)}>
                                    { { happy: '😊', calm: '😌', anxious: '😰', sad: '😢', angry: '😠' }[m] }
                                </span>
                            </button>
                         ))}
                    </div>
                )}
            </div>
        )
    );

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); // Prevent newline
            handleSendMessage();
        }
    };

    // Function to open the modal
    const openModal = () => {
        setIsModalOpen(true);
        // Re-initialize chat when opening modal IF chat is not already initialized
        // This handles cases where initialization might have failed previously
        if (!chat && !loading) {
            // Trigger re-initialization by changing the mode slightly (or use a dedicated init function)
            // This might be too aggressive; consider just showing error if !chat
             console.log("Modal opened, re-checking chat initialization status.");
             // Optionally, you could try re-initializing here if needed:
             // useEffect(() => { ... }, [mode]) dependency will handle it if mode changes.
             // Or call a dedicated init function: initializeChat(); (ensure it handles loading states correctly)
        }
    };

    // Function to close the modal
    const closeModal = () => {
        setIsModalOpen(false);
        // Optional: Reset state when closing modal if desired
        // setError(null);
        // setUserInput("");
    };

    // Copy Response handler
    const handleCopyResponse = (text) => {
        if (!text) return; // Don't do anything if text is empty

        if (mode === "tech") {
            // Copy to clipboard for tech mode
            navigator.clipboard.writeText(text)
                .then(() => {
                    showNotification("Copied to clipboard");
                })
                .catch(err => {
                    console.error('Failed to copy text: ', err);
                    showNotification("Failed to copy"); // Notify user of failure
                });
        } else {
            // Save to journal for wellness mode
            const newEntry = {
                text: "Saved from conversation", // Or use a snippet of the preceding user msg if available
                timestamp: Date.now(),
                response: text
            };

            setJournalEntries(prev => [...prev, newEntry]);
            showNotification("Saved to journal");
        }
    };

    // Simple toast notification display
    const showNotification = (message) => {
        setNotification(message);
        setTimeout(() => {
            setNotification(null);
        }, 2500); // Slightly longer duration
    };

    // Crisis resources section for wellness mode
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

    // Scroll to bottom button that appears when user scrolls up
    const ScrollToBottomButton = () => (
        showScrollToBottom && (
            <button className="scroll-to-bottom" onClick={scrollToBottom} aria-label="Scroll to newest messages" title="Scroll to bottom">
                <FontAwesomeIcon icon={faChevronDown} />
            </button>
        )
    );

    // ---- MAIN RENDER ----
    return (
        // Use a fragment or a container div for the initial button
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

                            <ChatHeader />

                            {/* Central Error Display Area */}
                             {error && <div className={`chat-error-display ${currentMode.errorMessageClass}`}>{error}</div>}

                            {/* Conditional rendering for mood selectors */}
                            <MoodSelector />
                            <MobileMoodSelector />

                            <main
                                className={currentMode.messagesClass}
                                ref={messagesContainerRef}
                                onScroll={handleScroll}
                                aria-live="polite" // Announce new messages
                            >
                                {messages?.map((msg, index) => (
                                    <div key={index} className={`${currentMode.messageClass} ${msg.role} ${msg.isMoodUpdate ? 'mood-update' : ''}`}>
                                        <div className={`${mode === "tech" ? "tech" : "mindful"}-message-bubble`}>
                                             {/* Display Icon conditionally based on role */}
                                             {msg.role === 'model' && !msg.isMoodUpdate && (
                                                <FontAwesomeIcon icon={currentMode.icon} className="message-icon model-icon" />
                                             )}
                                             {/* Basic User Icon (Optional) */}
                                             {/* {msg.role === 'user' && ( <FontAwesomeIcon icon={faUser} className="message-icon user-icon" /> )} */}

                                            <p className="message-text">{msg.text}</p>
                                            {/* Timestamp (Optional display) */}
                                            {/* <span className="message-timestamp">{new Date(msg.timestamp).toLocaleTimeString()}</span> */}

                                            {/* Add Copy/Save button for model responses only, excluding initial/mood updates */}
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
                                {/* Element to help scroll to bottom */}
                                <div ref={messagesEndRef} />
                            </main>

                             {/* Scroll to Bottom Button - positioned relative to message container */}
                            <ScrollToBottomButton />

                            {/* Loading indicator */}
                            {loading && (
                                <div className={`chat-loading-indicator ${currentMode.loaderClass}`}>
                                    <FontAwesomeIcon icon={faSpinner} spin /> Thinking...
                                </div>
                            )}

                             {/* Out of Credits Message */}
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
                                    rows="1" // Start with 1 row, CSS can handle expansion
                                    aria-label="Chat input"
                                    disabled={loading || (subscription === "free" && remainingInteractions <= 0)} // Disable when loading or out of credits
                                />
                                <button
                                    className={`${currentMode.sendButtonClass} ${currentMode.buttonClass}--icon`}
                                    onClick={() => handleSendMessage()} // Ensure it uses current userInput
                                    disabled={!userInput.trim() || loading || (subscription === "free" && remainingInteractions <= 0)}
                                    aria-label="Send message"
                                    title="Send message"
                                >
                                    <FontAwesomeIcon icon={faPaperPlane} />
                                </button>
                            </footer>

                            <CrisisResources />

                             {/* Toast Notification Area */}
                             {notification && (
                                <div className="chat-notification">
                                    {notification}
                                </div>
                             )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Chat;