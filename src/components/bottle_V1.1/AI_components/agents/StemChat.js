// stem.js
import React, { useState, useEffect, useRef } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFlask,          // Icon for STEM
  faSun,
  faMoon,
  faCog,
  faTimes,
  faClipboard,
  faPaperPlane,
  faChevronDown,
  faSpinner,
  faPaperclip,      // Icon for file upload
  faPencilAlt,      // Icon for notepad/draw
  faUpload          // Alias/Alternative for upload
} from '@fortawesome/free-solid-svg-icons';
import "./chat.css"; // Reuse the same CSS file, but ensure stem-* classes are added/styled

// Helper function to convert file to base64 (required for Gemini API)
// Note: Needs error handling in a real implementation
const fileToGenerativePart = async (file) => {
    const base64EncodedDataPromise = new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]); // Get base64 part
      reader.readAsDataURL(file);
    });
    return {
      inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
    };
};


const StemChat = () => {
    // --- Core State ---
    const [isModalOpen, setIsModalOpen] = useState(false); // Controls visibility if used as a modal
    const [messages, setMessages] = useState([]);
    const [userInput, setUserInput] = useState("");
    const [chat, setChat] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [subscription, setSubscription] = useState("free"); // Example: "free" or "premium"
    const [remainingInteractions, setRemainingInteractions] = useState(10); // Example limit
    const [isUserScrolled, setIsUserScrolled] = useState(false);
    const [showScrollToBottom, setShowScrollToBottom] = useState(false);
    const [notification, setNotification] = useState(null);

    // --- STEM Specific State ---
    const [theme, setTheme] = useState("light"); // Default theme for STEM
    const [uploadedFile, setUploadedFile] = useState(null); // State for uploaded file
    const [isNotepadOpen, setIsNotepadOpen] = useState(false); // State for virtual notepad visibility
    // const [notepadData, setNotepadData] = useState(null); // State to hold drawing data (if needed)

    // --- Refs ---
    const inputRef = useRef(null);
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const fileInputRef = useRef(null); // Ref for the hidden file input

    // --- STEM Mode Configuration --- (Simplified as this component IS the STEM mode)
    // Removed wellness mode config
    const stemConfig = {
        name: "Professor AI",
        icon: faFlask,
        initialPrompt: "You are Professor AI, a knowledgeable and patient STEM tutor. Explain complex topics in Science, Technology, Engineering, and Math clearly using Markdown for formatting (especially for code blocks and math notation like LaTeX within $...$ or $$...$$). Help students understand concepts, solve problems, and review study material. When presented with an image (like notes or a problem), analyze it and respond relevantly to the user's query about it. Be encouraging and break down difficult concepts.",
        initialResponse: "Hello! I'm Professor AI 👨‍🏫🔬, your STEM tutor. Whether you're tackling physics problems, exploring biology concepts, diving into code, or unraveling mathematical theorems, I'm here to help. Ask me a question, or upload an image of your notes or problem!",
        placeholder: "Ask a STEM question or describe your upload...",
        outOfCreditsMessage: "Upgrade for unlimited STEM help!",
        interactionName: "Lessons",
        buttonText: "Ask Professor AI", // Button to *open* the chat if used as modal
        containerClass: "stem-chat-container",
        messageClass: "stem-message",
        buttonClass: "stem-button", // General button style for this mode
        headerClass: "stem-header",
        inputClass: "stem-input",
        loaderClass: "stem-loading",
        modalClass: "stem-modal", // Class for the modal container itself
        modalContentClass: "stem-modal-content", // Class for the content area within modal
        messagesClass: "stem-messages",
        defaultTheme: "light", // Default theme for STEM mode
        copyIcon: faClipboard,
        copyTooltip: "Copy explanation",
        logoClass: "stem-logo",
        logoIconClass: "stem-logo-icon",
        logoTextClass: "stem-logo-text",
        controlsClass: "stem-controls",
        subscriptionBadgeClass: "stem-subscription-badge",
        closeButtonClass: "stem-close-button",
        errorMessageClass: "stem-error-message",
        footerClass: "stem-footer",
        sendButtonClass: "stem-send-button"
    };
    // Directly use stemConfig as this component is only for STEM mode
    const currentMode = stemConfig;

    // Initialize theme
    useEffect(() => {
        setTheme(currentMode.defaultTheme);
    }, [currentMode.defaultTheme]);

    // --- Initialize Gemini API and Chat ---
    useEffect(() => {
        const initializeAPI = () => {
            const apiKey = process.env.REACT_APP_GEMINI_API; // Ensure this is configured
            if (!apiKey) {
                setError("API key not found. Check environment configuration.");
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
            setMessages([]);
            setChat(null);

            const genAI = initializeAPI();
            if (!genAI) {
                setLoading(false);
                return;
            }

            try {
                // Use a model that supports multimodal input (text + image)
                const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

                const initialHistory = [
                    { role: "user", parts: [{ text: currentMode.initialPrompt }] },
                    { role: "model", parts: [{ text: currentMode.initialResponse }] },
                ];

                // Note: Safety settings might need adjustment for educational content (e.g., medical diagrams)
                const newChat = model.startChat({
                    history: initialHistory,
                    generationConfig: { temperature: 0.6, topK: 40, topP: 0.9, maxOutputTokens: 4096 }, // Increased tokens potentially needed for STEM
                    safetySettings: [ // Consider adjusting safety settings if needed for specific STEM topics
                        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                    ],
                });

                setChat(newChat);
                setMessages([{ role: "model", text: currentMode.initialResponse, timestamp: Date.now() }]);
            } catch (err) {
                setError(`Failed to initialize ${currentMode.name}. API key/model issue?`);
                console.error("Chat initialization error:", err);
            } finally {
                setLoading(false);
            }
        };

        initializeChat();
        // No dependency on 'mode' as it's fixed here
    }, [currentMode.initialPrompt, currentMode.initialResponse, currentMode.name]);

    // --- Handle Sending Messages (Text and Files) ---
    const handleSendMessage = async () => {
        // Combine text input and potential file
        const textInput = userInput.trim();
        const fileInput = uploadedFile;

        if ((!textInput && !fileInput) || (subscription === "free" && remainingInteractions <= 0) || !chat || loading) {
            if(!textInput && !fileInput) {
                setError("Please enter a question or upload a file.");
                setTimeout(() => setError(null), 3000);
            }
            return;
        }

        setLoading(true);
        setError(null);
        const timestamp = Date.now();

        let userMessageContent = [];
        let userMessageDisplay = textInput; // What to show in the chat bubble

        // Prepare parts for Gemini API
        if (textInput) {
            userMessageContent.push({ text: textInput });
        }

        if (fileInput) {
             // Basic validation (add more robust checks)
            if (!fileInput.type.startsWith("image/")) {
                 setError("Only image files are currently supported.");
                 setUploadedFile(null); // Clear invalid file
                 setLoading(false);
                 setTimeout(() => setError(null), 3000);
                 return;
             }
            try {
                const filePart = await fileToGenerativePart(fileInput);
                userMessageContent.push(filePart);
                // Add indication of file upload to display message
                userMessageDisplay += `\n[File attached: ${fileInput.name}]`;
            } catch (err) {
                 setError("Error processing file.");
                 console.error("File processing error:", err);
                 setLoading(false);
                 return;
            }
        }

        const newUserMessage = {
            role: "user",
            // Display combines text and file indicator
            text: userMessageDisplay || "[Uploaded File]",
            timestamp
            // Add file info here if needed for rendering later
            // fileInfo: fileInput ? { name: fileInput.name, type: fileInput.type } : null
         };

        // Optimistically add user message
        setMessages(prevMessages => [...prevMessages, newUserMessage]);

        // Clear inputs after preparing message
        setUserInput("");
        setUploadedFile(null);
        if(fileInputRef.current) fileInputRef.current.value = ""; // Reset file input visually


        try {
             console.log("Sending parts:", userMessageContent); // Debugging: Check payload
            // Send message with potentially multiple parts (text + image)
            const result = await chat.sendMessage(userMessageContent);

            const botResponse = result?.response?.text ? result.response.text() : "Sorry, I couldn't generate a response for that.";
            const newBotMessage = {
                role: "model",
                text: botResponse,
                timestamp: Date.now()
            };

            setMessages(prevMessages => [...prevMessages, newBotMessage]);

            if (subscription === "free") {
                setRemainingInteractions(prev => Math.max(0, prev - 1));
            }
        } catch (err) {
            setError("Message failed to send. Check connection or API limits.");
            console.error("Message sending error:", err);
            // Rollback user message
            setMessages(prevMessages => prevMessages.filter(msg => msg.timestamp !== timestamp));
        } finally {
            setLoading(false);
            if (inputRef.current) {
                inputRef.current.focus();
            }
        }
    };

    // --- File Handling ---
    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            // Basic validation (add size limits, etc.)
            if (file.type.startsWith("image/")) {
                 setUploadedFile(file);
                 showNotification(`Selected: ${file.name}`);
                 setError(null); // Clear previous errors
            } else {
                 showNotification("Please select an image file.");
                 event.target.value = ""; // Reset file input
            }
        }
    };

    const triggerFileInput = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    // --- Virtual Notepad Handling (Placeholder) ---
    const toggleNotepad = () => {
        setIsNotepadOpen(!isNotepadOpen);
        // If opening, maybe load existing data?
        // If closing, maybe save data or ask to save?
        showNotification(isNotepadOpen ? "Notepad closed" : "Notepad opened (Feature coming soon!)");
        // Placeholder: Implement actual notepad component display logic here
    };

    // --- Scrolling Logic ---
    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
            setShowScrollToBottom(false);
            setIsUserScrolled(false);
        }
    };

    useEffect(() => {
        if (!isUserScrolled && messagesContainerRef.current) {
            if (messagesContainerRef.current.scrollHeight > messagesContainerRef.current.clientHeight) {
                scrollToBottom();
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [messages]);

    const handleScroll = () => {
        if (messagesContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
            const isNearBottom = scrollHeight - clientHeight - scrollTop < 50;
            setIsUserScrolled(!isNearBottom);
            setShowScrollToBottom(!isNearBottom && scrollHeight > clientHeight);
        }
    };

    // --- Other Handlers ---
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const openModal = () => setIsModalOpen(true); // If using StemChat as a modal
    const closeModal = () => setIsModalOpen(false);

    const handleCopyResponse = (text) => {
        if (!text) return;
        navigator.clipboard.writeText(text)
            .then(() => showNotification("Copied to clipboard"))
            .catch(err => {
                console.error('Failed to copy text: ', err);
                showNotification("Failed to copy");
            });
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
                <div className={`${currentMode.subscriptionBadgeClass} ${subscription}`}>
                    {subscription} Tier
                </div>
            </div>
            <div className={currentMode.controlsClass}>
                {/* Theme Toggle Button */}
                <button
                    className={`${currentMode.buttonClass} ${currentMode.buttonClass}--icon ${currentMode.buttonClass}--theme`}
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                    title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                >
                    <FontAwesomeIcon icon={theme === "dark" ? faSun : faMoon} />
                </button>
                {/* Settings Button (Placeholder) */}
                <button className={`${currentMode.buttonClass} ${currentMode.buttonClass}--settings`} aria-label="Settings" title="Settings (coming soon)" disabled>
                    <FontAwesomeIcon icon={faCog} />
                    <span>Settings</span>
                </button>
            </div>
        </header>
    );

    const ScrollToBottomButton = () => (
        showScrollToBottom && (
            <button className="scroll-to-bottom" onClick={scrollToBottom} aria-label="Scroll to newest messages" title="Scroll to bottom">
                <FontAwesomeIcon icon={faChevronDown} />
            </button>
        )
    );

    // --- Main Render ---
    return (
        <>
            {/* Button to open the modal (if StemChat is used as a modal) */}
            {/* <button onClick={openModal} className={`chat-open-button ${currentMode.buttonClass}`}>
                 <FontAwesomeIcon icon={currentMode.icon} style={{ marginRight: '8px' }} />
                 {currentMode.buttonText}
            </button> */}

            {/* --- If used directly without modal, render this part --- */}
            {/* {isModalOpen && ( // Keep modal structure if needed */}
             <div className={currentMode.modalClass} style={{ display: isModalOpen || true ? 'flex': 'none' }}> {/* Always show if not using modal logic */}
                 <div className={currentMode.modalContentClass}>
                     <div className={`chat-wrapper ${currentMode.containerClass} ${theme}`}>
                         {/* Optional: Add close button back if needed */}
                         {/* <button onClick={closeModal} className={currentMode.closeButtonClass} aria-label="Close Chat" title="Close Chat">
                             <FontAwesomeIcon icon={faTimes} />
                         </button> */}

                         <ChatHeader />

                         {error && <div className={`chat-error-display ${currentMode.errorMessageClass}`}>{error}</div>}

                         <main className={currentMode.messagesClass} ref={messagesContainerRef} onScroll={handleScroll} aria-live="polite">
                             {messages?.map((msg, index) => (
                                 <div key={index} className={`${currentMode.messageClass} ${msg.role}`}>
                                     <div className={`${currentMode.messageClass}-bubble`}> {/* Use specific class */}
                                         {msg.role === 'model' && (
                                             <FontAwesomeIcon icon={currentMode.icon} className="message-icon model-icon" />
                                         )}
                                         {/* TODO: Render message content, potentially handling Markdown or file previews */}
                                         <p className="message-text" dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br />') }}></p> {/* Basic rendering, needs Markdown processor */}

                                         {msg.role === 'model' && (
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

                         <ScrollToBottomButton />

                         {loading && (
                             <div className={`chat-loading-indicator ${currentMode.loaderClass}`}>
                                 <FontAwesomeIcon icon={faSpinner} spin /> Thinking...
                             </div>
                         )}

                         {subscription === "free" && remainingInteractions <= 0 && !loading && (
                             <div className={`chat-limit-message ${currentMode.errorMessageClass}`}>
                                 Interaction limit reached. {currentMode.outOfCreditsMessage}
                             </div>
                         )}

                         {/* --- Footer with Input, File Upload, and Notepad --- */}
                         <footer className={`chat-footer ${currentMode.footerClass}`}>
                              {/* Hidden File Input */}
                             <input
                                type="file"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                onChange={handleFileChange}
                                accept="image/*" // Accept images only for now
                             />
                             {/* File Upload Button */}
                             <button
                                className={`${currentMode.buttonClass} ${currentMode.buttonClass}--icon`}
                                onClick={triggerFileInput}
                                aria-label="Attach file"
                                title="Attach image file"
                                disabled={loading || (subscription === "free" && remainingInteractions <= 0)}
                            >
                                 <FontAwesomeIcon icon={faPaperclip} />
                             </button>

                             {/* Notepad Button (Placeholder) */}
                             <button
                                className={`${currentMode.buttonClass} ${currentMode.buttonClass}--icon`}
                                onClick={toggleNotepad}
                                aria-label="Open virtual notepad"
                                title="Open virtual notepad (Coming Soon)"
                                disabled={loading || (subscription === "free" && remainingInteractions <= 0)}
                            >
                                 <FontAwesomeIcon icon={faPencilAlt} />
                             </button>


                             <textarea
                                 ref={inputRef}
                                 className={currentMode.inputClass}
                                 value={userInput}
                                 onChange={(e) => setUserInput(e.target.value)}
                                 onKeyDown={handleKeyDown}
                                 placeholder={uploadedFile ? `Describe ${uploadedFile.name}...` : currentMode.placeholder}
                                 rows="1"
                                 aria-label="Chat input"
                                 disabled={loading || (subscription === "free" && remainingInteractions <= 0)}
                             />
                             <button
                                 className={`${currentMode.sendButtonClass} ${currentMode.buttonClass}--icon`}
                                 onClick={handleSendMessage}
                                 disabled={(!userInput.trim() && !uploadedFile) || loading || (subscription === "free" && remainingInteractions <= 0)}
                                 aria-label="Send message"
                                 title="Send message"
                             >
                                 <FontAwesomeIcon icon={faPaperPlane} />
                             </button>
                         </footer>

                          {/* Placeholder for Virtual Notepad Component */}
                          {isNotepadOpen && (
                            <div className="virtual-notepad-placeholder" style={{ padding: '1rem', borderTop: `1px solid ${theme === 'dark' ? '#444' : '#ddd'}`, background: theme === 'dark' ? '#222' : '#f9f9f9' }}>
                                Virtual Notepad Area (Implement Canvas Here)
                                <button onClick={toggleNotepad}>Close Notepad</button>
                            </div>
                          )}


                         {notification && (
                             <div className="chat-notification">{notification}</div>
                         )}
                     </div>
                 </div>
             </div>
            {/* )} */}
        </>
    );
};

export default StemChat;