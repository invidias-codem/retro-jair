import React, { useState, useEffect, useRef } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot, faSun, faMoon, faCog, faTimes } from '@fortawesome/free-solid-svg-icons';
import './chat.css';
import './oci.css'; 

const Chat = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [userInput, setUserInput] = useState("");
    const [chat, setChat] = useState(null);
    const [theme, setTheme] = useState("dark");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [subscription, setSubscription] = useState("free");
    const [questionsLeft, setQuestionsLeft] = useState(5);
    const [isUserScrolled, setIsUserScrolled] = useState(false);
    const inputRef = useRef(null);
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);

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
                    { role: "user", parts: [{ text: "You are TechGenie, an expert computer technology consultant. Assist users with their tech-related questions." }] },
                    { role: "model", parts: [{ text: "Hello! I'm TechGenie, your expert tech consultant. I can help you with hardware recommendations, software troubleshooting, coding questions, and any other tech-related inquiries. What can I assist you with today?" }] },
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
                    text: "Hello! I'm TechGenie, Jair's expert tech consultant. How can I help you today?",
                    timestamp: Date.now()
                }]);
            } catch (err) {
                setError("Failed to initialize chat. Check your API key and try again.");
                console.error("Chat initialization error:", err);
            }
        };

        initializeChat();
    }, []); 

    const handleSendMessage = async () => {
        if (!userInput.trim() || (subscription === "free" && questionsLeft <= 0) || !chat) return;

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

            if (subscription === "free") {
                setQuestionsLeft(prev => prev - 1);
            }
        } catch (err) {
            setError("Error sending message. Please try again.");
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

    const ChatHeader = ({ theme, setTheme }) => (
        <header className="tech-header">
            <div className="tech-logo">
                <div className="tech-logo-icon"><FontAwesomeIcon icon={faRobot} /></div>
                <span className="tech-logo-text">TechGenie</span>
                <div className={`tech-subscription-badge ${subscription}`}>
                    {subscription.charAt(0).toUpperCase() + subscription.slice(1)} Tier
                </div>
            </div>
            <div className="tech-controls">
                <button 
                    className="tech-button tech-button--icon tech-button--theme"
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                >
                    <FontAwesomeIcon icon={theme === "dark" ? faSun : faMoon} />
                </button>
                <button className="tech-button tech-button--settings" aria-label="Settings">
                    <FontAwesomeIcon icon={faCog} /> 
                    <span>Settings</span>
                </button>
            </div>
        </header>
    );

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

    // Copy Response to Clipboard
    const copyResponseToClipboard = (text) => {
        navigator.clipboard.writeText(text)
            .then(() => {
                // Show toast or notification
                console.log('Text copied to clipboard');
            })
            .catch(err => {
                console.error('Failed to copy text: ', err);
            });
    };

    return (
        <div className={`tech-chat-container ${theme}`}>
            <button onClick={openModal} className="tech-chat-button"> 
                Chat with TechGenie 
            </button>

            {isModalOpen && ( 
                <div className="tech-modal">
                    <div className="tech-modal-content">
                        <button onClick={closeModal} className="tech-close-button" aria-label="Close">
                            <FontAwesomeIcon icon={faTimes} /> 
                        </button>

                        <ChatHeader theme={theme} setTheme={setTheme} />
                        {error && <div className="tech-error-message">{error}</div>}

                        <main 
                            className="tech-messages" 
                            ref={messagesContainerRef}
                            onScroll={handleScroll}
                        >
                            {messages?.map((msg, index) => (
                                <div key={index} className={`tech-message ${msg.role}`}>
                                    <div className="tech-message-content">
                                        {msg.text.split('\n').map((line, i) =>
                                            line.startsWith('```')? (
                                                <div key={i} className="tech-code-block">
                                                    <pre><code>{line.slice(3)}</code></pre>
                                                </div>
                                            ): (
                                                <p key={i}>{line}</p>
                                            )
                                        )}
                                    </div>
                                    <div className="tech-message-meta">
                                        {msg.role === "model" ? (
                                            <>
                                                <span>TechGenie • {new Date(msg.timestamp).toLocaleTimeString()}</span>
                                                <button 
                                                    className="tech-message-copy" 
                                                    onClick={() => copyResponseToClipboard(msg.text)}
                                                    aria-label="Copy message"
                                                >
                                                    <FontAwesomeIcon icon="copy" />
                                                </button>
                                            </>
                                        ) : (
                                            `You • ${new Date(msg.timestamp).toLocaleTimeString()}`
                                        )}
                                    </div>
                                </div>
                            ))}

                            {loading && (
                                <div className="tech-loading">
                                    <div className="tech-loading-dot" />
                                    <div className="tech-loading-dot" />
                                    <div className="tech-loading-dot" />
                                </div>
                            )}

                            <div ref={messagesEndRef} /> 
                        </main>

                        <footer className="tech-input-container">
                            <div className="tech-input-wrapper">
                                <textarea
                                    className="tech-input"
                                    ref={inputRef}
                                    placeholder={subscription === "free" && questionsLeft <= 0
                                    ? "Upgrade to continue asking questions!"
                                    : "Ask me anything about technology..."}
                                    value={userInput}
                                    onChange={(e) => setUserInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    disabled={subscription === "free" && questionsLeft <= 0}
                                    rows={3}
                                    aria-label="Chat input"
                                />
                            </div>
                            
                            <div className="send-button-wrapper">
                                <button
                                    className="tech-button"
                                    onClick={handleSendMessage}
                                    disabled={!userInput.trim() || (subscription === "free" && questionsLeft <= 0)}
                                >
                                    Send
                                </button>
                                
                                {subscription === "free" && (
                                    <div className="questions-counter">
                                        <span>Questions remaining:</span>
                                        <span className="counter-number">{questionsLeft}</span>
                                    </div>
                                )}
                            </div>
                        </footer>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Chat;