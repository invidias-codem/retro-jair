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
  faExchangeAlt
} from '@fortawesome/free-solid-svg-icons';
import "../../styles/base.css"
import "../../styles/mindful.css"
import "./chat.css"


const Chat = () => {
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
    
    // Mode specific state
    const [mode, setMode] = useState("tech"); // "tech" or "wellness"
    const [mood, setMood] = useState("neutral"); // For wellness mode
    const [journalEntries, setJournalEntries] = useState([]); // For wellness mode
    const [theme, setTheme] = useState("dark"); // Default for tech mode
    
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
            defaultTheme: "dark"
        },
        wellness: {
            name: "MindfulMate",
            icon: faBrain,
            initialPrompt: "You are MindfulMate, a supportive mental wellness companion. You provide evidence-based self-help techniques, coping strategies, and mindfulness exercises. You carefully avoid making medical diagnoses or replacing professional mental health care. For serious concerns, you always recommend seeking professional help.",
            initialResponse: "Hello! I'm MindfulMate, your supportive mental wellness companion. I'm here to listen and provide evidence-based coping skills as well as help be someone to talk to. How are you feeling today?",
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
            defaultTheme: "calm"
        }
    };

    // Get the current mode configuration
    const currentMode = modeConfig[mode];

    // Initialize theme based on mode
    useEffect(() => {
        setTheme(mode === "tech" ? "dark" : "calm");
    }, [mode]);

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
                    { role: "user", parts: [{ text: currentMode.initialPrompt }] },
                    { role: "model", parts: [{ text: currentMode.initialResponse }] },
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
                    text: currentMode.initialResponse,
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
    }, [mode]); 

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
                setRemainingInteractions(prev => prev - 1);
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

    // const handleMoodChange = (newMood) => {
    //     setMood(newMood);
        
    //     // Add the mood selection as a user message
    //     const moodMessage = { 
    //         role: "user", 
    //         text: `I'm feeling ${newMood} today.`, 
    //         timestamp: Date.now(),
    //         isMoodUpdate: true
    //     };
        
    //     setMessages(prev => [...prev, moodMessage]);
        
    //     // Trigger AI response to the mood
    //     setTimeout(() => {
    //         handleSendMessage();
    //     }, 300);
    // };

    const ChatHeader = () => (
        <header className={currentMode.headerClass}>
            <div className={mode === "tech" ? "tech-logo" : "mindful-logo"}>
                <div className={mode === "tech" ? "tech-logo-icon" : "mindful-logo-icon"}>
                    <FontAwesomeIcon icon={currentMode.icon} />
                </div>
                <span className={mode === "tech" ? "tech-logo-text" : "mindful-logo-text"}>
                    {currentMode.name}
                </span>
                <div className={`${mode === "tech" ? "tech" : "mindful"}-subscription-badge ${subscription}`}>
                    {subscription.charAt(0).toUpperCase() + subscription.slice(1)} Tier
                </div>
            </div>
            <div className={mode === "tech" ? "tech-controls" : "mindful-controls"}>
                <button 
                    className={`${currentMode.buttonClass} ${currentMode.buttonClass}--icon ${currentMode.buttonClass}--mode`}
                    onClick={() => setMode(mode === "tech" ? "wellness" : "tech")}
                    aria-label={`Switch to ${mode === "tech" ? "wellness" : "tech"} mode`}
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
                    aria-label={
                        mode === "tech"
                            ? (theme === "dark" ? "Switch to light mode" : "Switch to dark mode")
                            : (theme === "calm" ? "Switch to bright mode" : "Switch to calm mode")
                    }
                >
                    <FontAwesomeIcon icon={
                        mode === "tech"
                            ? (theme === "dark" ? faSun : faMoon)
                            : (theme === "calm" ? faSun : faMoon)
                    } />
                </button>
                <button className={`${currentMode.buttonClass} ${currentMode.buttonClass}--settings`} aria-label="Settings">
                    <FontAwesomeIcon icon={faCog} /> 
                    <span>Settings</span>
                </button>
            </div>
        </header>
    );

    // const MoodSelector = () => (
    //     mode === "wellness" && (
    //         <div className="mood-selector">
    //             <p>How are you feeling right now?</p>
    //             <div className="mood-buttons">
    //                 <button 
    //                     className={`mood-button ${mood === "happy" ? "active" : ""}`} 
    //                     onClick={() => handleMoodChange("happy")}
    //                 >
    //                     <span role="img" aria-label="Happy">😊</span>
    //                     <span>Happy</span>
    //                 </button>
    //                 <button 
    //                     className={`mood-button ${mood === "calm" ? "active" : ""}`} 
    //                     onClick={() => handleMoodChange("calm")}
    //                 >
    //                     <span role="img" aria-label="Calm">😌</span>
    //                     <span>Calm</span>
    //                 </button>
    //                 <button 
    //                     className={`mood-button ${mood === "anxious" ? "active" : ""}`} 
    //                     onClick={() => handleMoodChange("anxious")}
    //                 >
    //                     <span role="img" aria-label="Anxious">😰</span>
    //                     <span>Anxious</span>
    //                 </button>
    //                 <button 
    //                     className={`mood-button ${mood === "sad" ? "active" : ""}`} 
    //                     onClick={() => handleMoodChange("sad")}
    //                 >
    //                     <span role="img" aria-label="Sad">😢</span>
    //                     <span>Sad</span>
    //                 </button>
    //                 <button 
    //                     className={`mood-button ${mood === "angry" ? "active" : ""}`} 
    //                     onClick={() => handleMoodChange("angry")}
    //                 >
    //                     <span role="img" aria-label="Angry">😠</span>
    //                     <span>Angry</span>
    //                 </button>
    //             </div>
    //         </div>
    //     )
    // );

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // Function to open the modal
    const openModal = () => {
        setIsModalOpen(true);
    };

    // Function to close the modal
    const closeModal = () => {
        setIsModalOpen(false);
    };

    // Copy Response handler
    const handleCopyResponse = (text) => {
        if (mode === "tech") {
            // Copy to clipboard for tech mode
            navigator.clipboard.writeText(text)
                .then(() => {
                    console.log('Text copied to clipboard');
                })
                .catch(err => {
                    console.error('Failed to copy text: ', err);
                });
        } else {
            // Save to journal for wellness mode
            const newEntry = {
                text: "Saved from conversation",
                timestamp: Date.now(),
                response: text
            };
            
            setJournalEntries(prev => [...prev, newEntry]);
            console.log('Entry saved to journal');
        }
    };

    // Crisis resources section for wellness mode
    const CrisisResources = () => (
        mode === "wellness" && (
            <div className="wellness-resources">
                <h3><FontAwesomeIcon icon={faHeartbeat} /> Crisis Resources</h3>
                <p>If you're experiencing a mental health emergency:</p>
                <ul>
                    <li>National Suicide Prevention Lifeline: 988 or 1-800-273-8255</li>
                    <li>Crisis Text Line: Text HOME to 741741</li>
                    <li>Call your local emergency number: 911</li>
                </ul>
            </div>
        )
    );

    return (
        <div className={`${currentMode.containerClass} ${
            mode === "tech" ? theme : theme
        }`}>
            <button onClick={openModal} className={mode === "tech" ? "tech-chat-button" : "mindful-chat-button"}> 
                {currentMode.buttonText}
            </button>

            {isModalOpen && ( 
                <div className={currentMode.modalClass}>
                    <div className={currentMode.modalContentClass}>
                        <button onClick={closeModal} className={mode === "tech" ? "tech-close-button" : "mindful-close-button"} aria-label="Close">
                            <FontAwesomeIcon icon={faTimes} /> 
                        </button>

                        <ChatHeader />
                        {error && <div className={mode === "tech" ? "tech-error-message" : "mindful-error-message"}>{error}</div>}

                        {/* <MoodSelector /> */}

                        <main 
                            className={currentMode.messagesClass} 
                            ref={messagesContainerRef}
                            onScroll={handleScroll}
                        >
                            {messages?.map((msg, index) => (
                                <div key={index} className={`${currentMode.messageClass} ${msg.role} ${msg.isMoodUpdate ? 'mood-update' : ''}`}>
                                    <div className={mode === "tech" ? "tech-message-content" : "mindful-message-content"}>
                                        {msg.text.split('\n').map((line, i) =>
                                            line.startsWith('```')? (
                                                <div key={i} className={mode === "tech" ? "tech-code-block" : "mindful-code-block"}>
                                                    <pre><code>{line.slice(3)}</code></pre>
                                                </div>
                                            ): (
                                                <p key={i}>{line}</p>
                                            )
                                        )}
                                    </div>
                                    <div className={mode === "tech" ? "tech-message-meta" : "mindful-message-meta"}>
                                        {msg.role === "model" ? (
                                            <>
                                                <span>{currentMode.name} • {new Date(msg.timestamp).toLocaleTimeString()}</span>
                                                <button 
                                                    className={mode === "tech" ? "tech-message-copy" : "mindful-message-copy"} 
                                                    onClick={() => handleCopyResponse(msg.text)}
                                                    aria-label={mode === "tech" ? "Copy message" : "Save to journal"}
                                                >
                                                    <FontAwesomeIcon icon={mode === "tech" ? "copy" : faClipboard} />
                                                </button>
                                            </>
                                        ) : (
                                            `You • ${new Date(msg.timestamp).toLocaleTimeString()}`
                                        )}
                                    </div>
                                </div>
                            ))}

                            {loading && (
                                <div className={currentMode.loaderClass}>
                                    <div className={mode === "tech" ? "tech-loading-dot" : "mindful-loading-dot"} />
                                    <div className={mode === "tech" ? "tech-loading-dot" : "mindful-loading-dot"} />
                                    <div className={mode === "tech" ? "tech-loading-dot" : "mindful-loading-dot"} />
                                </div>
                            )}

                            <div ref={messagesEndRef} /> 
                        </main>

                        <footer className={mode === "tech" ? "tech-input-container" : "mindful-input-container"}>
                            <div className={mode === "tech" ? "tech-input-wrapper" : "mindful-input-wrapper"}>
                                <textarea
                                    className={currentMode.inputClass}
                                    ref={inputRef}
                                    placeholder={subscription === "free" && remainingInteractions <= 0
                                        ? currentMode.outOfCreditsMessage
                                        : currentMode.placeholder}
                                    value={userInput}
                                    onChange={(e) => setUserInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    disabled={subscription === "free" && remainingInteractions <= 0}
                                    rows={3}
                                    aria-label="Chat input"
                                />
                            </div>
                            
                            <div className="send-button-wrapper">
                                <button
                                    className={currentMode.buttonClass}
                                    onClick={handleSendMessage}
                                    disabled={!userInput.trim() || (subscription === "free" && remainingInteractions <= 0)}
                                >
                                    Send
                                </button>
                                
                                {subscription === "free" && (
                                    <div className={mode === "tech" ? "questions-counter" : "sessions-counter"}>
                                        <span>{currentMode.interactionName} remaining:</span>
                                        <span className="counter-number">{remainingInteractions}</span>
                                    </div>
                                )}
                            </div>
                        </footer>

                        <CrisisResources />
                    </div>
                </div>
            )}
        </div>
    );
};

export default Chat;