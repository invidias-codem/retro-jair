// stem.js
import React, { useState, useEffect, useRef } from "react";
// Corrected import for HarmCategory and HarmBlockThreshold
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
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
} from '@fortawesome/free-solid-svg-icons';
import "./chat.css"; // Reuse the same CSS file, but ensure stem-* classes are added/styled

// Helper function to convert file to base64 (required for Gemini API)
const fileToGenerativePart = async (file) => {
    const base64EncodedDataPromise = new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          resolve(reader.result.toString().split(',')[1]); // Get base64 part
        } else {
          reject(new Error("Failed to read file."));
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
    try {
        const data = await base64EncodedDataPromise;
        return {
          inlineData: { data, mimeType: file.type },
        };
    } catch (error) {
        console.error("Error in fileToGenerativePart:", error);
        throw error; // Re-throw to be caught by caller
    }
};


const StemChat = () => {
    // --- Core State ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [userInput, setUserInput] = useState("");
    const [chat, setChat] = useState(null); // State for the standard chat session
    const [imageGenModel, setImageGenModel] = useState(null); // State for the image generation model
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [subscription, setSubscription] = useState("free");
    const [remainingInteractions, setRemainingInteractions] = useState(10);
    const [isUserScrolled, setIsUserScrolled] = useState(false);
    const [showScrollToBottom, setShowScrollToBottom] = useState(false);
    const [notification, setNotification] = useState(null);

    // --- STEM Specific State ---
    const [theme, setTheme] = useState("light");
    // Renamed uploadedFile to fileAttachment to handle both uploads and pastes
    const [fileAttachment, setFileAttachment] = useState(null);
    const [isNotepadOpen, setIsNotepadOpen] = useState(false);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false); // New state for image generation loading

    // --- Refs ---
    const inputRef = useRef(null);
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const fileInputRef = useRef(null);

    const stemConfig = {
        name: "Professor AI",
        icon: faFlask,
        // Updated initialPrompt to guide users about image generation and combined requests
        initialPrompt: "You are Professor AI, a knowledgeable and patient STEM tutor. Explain complex topics in Science, Technology, Engineering, and Math clearly using Markdown for formatting (especially for code blocks and math notation like LaTeX within $...$ or $$...$$). Help students understand concepts, solve problems, and review study material. To request an image or diagram along with an explanation, type '/draw <your description and question/request>'. You can also paste or upload images for analysis. When presented with an image (like notes or a problem), analyze it and respond relevantly to the user's query about it. Be encouraging and break down difficult concepts.",
        initialResponse: "Hello! I'm Professor AI, your STEM tutor. Whether you're tackling physics problems, exploring biology concepts, diving into code, or unraveling mathematical theorems, I'm here to help. Ask me a question, upload or paste an image of your notes, or try asking me to draw something (e.g., '/draw a simple diagram of a plant cell and explain its main parts').",
        placeholder: "Ask a STEM question, paste/upload an image, or type '/draw ...'",
        outOfCreditsMessage: "Upgrade for unlimited STEM help!",
        interactionName: "Lessons",
        buttonText: "Ask Professor AI",
        containerClass: "stem-chat-container",
        messageClass: "stem-message",
        buttonClass: "stem-button",
        headerClass: "stem-header",
        inputClass: "stem-input",
        loaderClass: "stem-loading",
        modalClass: "stem-modal",
        modalContentClass: "stem-modal-content",
        messagesClass: "stem-messages",
        defaultTheme: "light",
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
    const currentMode = stemConfig;

    useEffect(() => {
        setTheme(currentMode.defaultTheme);
    }, [currentMode.defaultTheme]);

    useEffect(() => {
        const initializeAPI = () => {
            const apiKey = process.env.REACT_APP_GEMINI_API;
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

        const initializeModels = async () => {
            setLoading(true);
            setError(null);
            setMessages([]);
            setChat(null);
            setImageGenModel(null); // Reset image gen model state

            const genAI = initializeAPI();
            if (!genAI) {
                setLoading(false);
                return;
            }

            try {
                // 1. Initialize the standard chat model
                // Using gemini-1.5-flash-latest for general chat
                const chatModelInstance = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Or "gemini-1.5-pro" for more complex tasks
                const initialHistory = [
                    { role: "user", parts: [{ text: currentMode.initialPrompt }] },
                    { role: "model", parts: [{ text: currentMode.initialResponse }] },
                ];
                const newChat = chatModelInstance.startChat({
                    history: initialHistory,
                    generationConfig: { temperature: 0.6, topK: 40, topP: 0.9, maxOutputTokens: 4096 },
                    safetySettings: [
                        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                    ],
                });
                setChat(newChat);

                // 2. Initialize the image generation model
                // This model is specifically for the /draw command and multimodal output
                const imageGenModelInstance = genAI.getGenerativeModel({ model: "gemini-2.0-flash-preview-image-generation" });
                setImageGenModel(imageGenModelInstance);


                setMessages([{ role: "model", text: currentMode.initialResponse, timestamp: Date.now() }]);
            } catch (err) {
                setError(`Failed to initialize AI models for ${currentMode.name}. API key/model issue?`);
                console.error("Model initialization error:", err);
            } finally {
                setLoading(false);
            }
        };

        initializeModels();
    }, [currentMode.initialPrompt, currentMode.initialResponse, currentMode.name]);


    const handleSendMessage = async () => {
        const textInput = userInput.trim();
        // Use fileAttachment state which can be from upload or paste
        const currentFileAttachment = fileAttachment;

        // Check if the user is trying to send an empty message with no file attachment
        if (!textInput && !currentFileAttachment) {
             setError("Please enter a question or upload/paste a file.");
             setTimeout(() => setError(null), 3000);
             return;
        }

        const imageCommandMatch = textInput.toLowerCase().match(/^\/(generate image|draw)\s*(.+)?/);

        if (imageCommandMatch) {
             // Use the full user input after the command as the prompt
            const fullPrompt = imageCommandMatch[2] ? imageCommandMatch[2].trim() : "";

            if (!fullPrompt) {
                 setError("Please provide a description for the image and/or a text query after /draw.");
                 setTimeout(() => setError(null), 3000);
                 return;
            }


            // Check if image generation model is initialized
            if (!imageGenModel || (subscription === "free" && remainingInteractions <= 0) || loading) {
                 if (!imageGenModel && !loading) setError("Image generation AI model not initialized. Please wait or refresh.");
                return;
            }

            setLoading(true);
            setIsGeneratingImage(true);
            setError(null);
            const userMessageTimestamp = Date.now();

            const newUserMessage = {
                role: "user",
                text: textInput, // Show the full command in the user message
                // Note: For /draw, currently only sending text prompt to generate image.
                // Attached file is ignored by this block's API call.
                timestamp: userMessageTimestamp
            };
            setMessages(prevMessages => [...prevMessages, newUserMessage]);
            setUserInput("");
            // Clear file attachment after sending, regardless of whether it was used by /draw
            setFileAttachment(null);
             if (fileInputRef.current) fileInputRef.current.value = "";


            try {
                console.log("Sending multimodal generation request to Gemini with prompt:", fullPrompt);

                // Use imageGenModel to generate content
                const result = await imageGenModel.generateContent({
                    contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
                    generationConfig: {
                        responseModalities: ["TEXT", "IMAGE"],
                         temperature: 0.6,
                         topK: 40,
                         topP: 0.9,
                         maxOutputTokens: 4096,
                    },
                     safetySettings: [ // Apply safety settings for generation
                        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                    ],
                });


                let botTextResponse = "";
                let generatedImageUrl = null;

                if (result?.response?.candidates?.[0]?.content?.parts) {
                    for (const part of result.response.candidates[0].content.parts) {
                        if (part.text) {
                            botTextResponse += (botTextResponse ? "\n" : "") + part.text;
                        } else if (part.inlineData?.data && part.inlineData?.mimeType) {
                            generatedImageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                            console.log("Base64 image data received from Gemini.");
                        }
                    }
                }

                 // Add a default text response if only an image is returned but text was expected
                if (generatedImageUrl && !botTextResponse && fullPrompt.toLowerCase().includes("explain")) {
                     botTextResponse = "Here is the image. I was unable to generate a detailed explanation based on your prompt.";
                 } else if (!generatedImageUrl && !botTextResponse) {
                    botTextResponse = "Sorry, I couldn't generate an image or a description for that request.";
                } else if (generatedImageUrl && !botTextResponse) {
                     // If only image is returned and no specific text was requested beyond the image prompt
                     botTextResponse = `Here's the image you requested based on: "${fullPrompt}"`;
                } else if (!generatedImageUrl && botTextResponse) {
                    console.warn("Image generation: Received text but no image data from Gemini.");
                    botTextResponse = `I was unable to generate an image for "${fullPrompt}", but here's some related information:\n${botTextResponse}`;
                }


                const newBotMessage = {
                    role: "model",
                    text: botTextResponse.trim(),
                    imageUrl: generatedImageUrl,
                    type: generatedImageUrl ? 'image_response' : 'text',
                    timestamp: Date.now()
                };
                setMessages(prevMessages => [...prevMessages, newBotMessage]);

                if (subscription === "free") {
                    setRemainingInteractions(prev => Math.max(0, prev - 1));
                }

            } catch (err) {
                console.error("Error during Gemini image generation or response processing:", err);
                const errorText = err.message?.includes("Candidate was blocked") || err.toString().includes("SAFETY")
                    ? "The image could not be generated due to safety settings or the nature of the prompt."
                    : (err.message || "Sorry, there was an error generating the diagram/image and explanation.");
                setError(errorText);
                const errorBotMessage = { role: "model", text: errorText, timestamp: Date.now() };
                setMessages(prevMessages => [...prevMessages, errorBotMessage]);
            } finally {
                setLoading(false);
                setIsGeneratingImage(false);
                if (inputRef.current) inputRef.current.focus();
            }
        } else { // Standard text and file uploads/pastes
             // Check if chat is initialized for standard messages
            if ((!textInput && !currentFileAttachment) || (subscription === "free" && remainingInteractions <= 0) || !chat || loading) {
                if (!chat && !loading) setError("Chat not initialized. Please wait or refresh.");
                return;
            }

            setLoading(true);
            setError(null);
            const timestamp = Date.now();
            let messagePartsForApi = [];
            let userMessageDisplay = textInput;

            if (textInput) {
                messagePartsForApi.push({ text: textInput });
            }

            // Include file attachment in standard messages
            if (currentFileAttachment) {
                 // Basic client-side security: Validate image type and size.
                 // Note: Robust security against malicious metadata requires server-side processing
                 // to strip or sanitize metadata and potentially re-encode the image.
                 // Client-side checks are not a complete solution against all threats.
                if (!currentFileAttachment.type.startsWith("image/") || currentFileAttachment.size > 4 * 1024 * 1024) {
                     setError("Invalid or oversized file. Only image files up to 4MB are supported for analysis.");
                     setFileAttachment(null); // Clear invalid file
                     if (fileInputRef.current) fileInputRef.current.value = "";
                     setLoading(false);
                     setTimeout(() => setError(null), 3000);
                     return;
                }
                try {
                    const filePart = await fileToGenerativePart(currentFileAttachment);
                    messagePartsForApi.push(filePart);
                    userMessageDisplay += `\n[File attached: ${currentFileAttachment.name || 'Pasted Image'}]`;
                } catch (err) {
                    setError("Error processing file. Please try a different file.");
                    console.error("File processing error:", err);
                    setLoading(false);
                    setFileAttachment(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                    return;
                }
            }

            if (messagePartsForApi.length === 0) {
                setLoading(false);
                return;
            }

            const newUserMessage = {
                role: "user",
                // Use userMessageDisplay which includes file info if attached
                text: userMessageDisplay || "[Empty Message]",
                timestamp,
                // Optionally store file info if needed for display
                // fileInfo: currentFileAttachment ? { name: currentFileAttachment.name, type: currentFileAttachment.type } : null
            };
            setMessages(prevMessages => [...prevMessages, newUserMessage]);

            setUserInput("");
            // Clear file attachment after sending
            setFileAttachment(null);
            if (fileInputRef.current) fileInputRef.current.value = "";

            try {
                // Use the 'chat' session for standard messages (text or multimodal input for analysis)
                const result = await chat.sendMessage(messagePartsForApi);
                let botTextResponse = "";
                if (result?.response?.candidates?.[0]?.content?.parts) {
                    result.response.candidates[0].content.parts.forEach(part => {
                        if (part.text) {
                            botTextResponse += (botTextResponse ? "\n" : "") + part.text;
                        }
                    });
                }

                if (!botTextResponse) {
                    botTextResponse = "Sorry, I couldn't formulate a response to that.";
                }

                const newBotMessage = { role: "model", text: botTextResponse.trim(), timestamp: Date.now() };
                setMessages(prevMessages => [...prevMessages, newBotMessage]);

                if (subscription === "free") {
                    setRemainingInteractions(prev => Math.max(0, prev - 1));
                }
            } catch (err) {
                console.error("Standard message sending error:", err);
                let errorText = "Message failed to send. Check connection or API limits.";
                 if (err.message?.includes("Candidate was blocked") || err.toString().includes("SAFETY")) {
                    errorText = "My response was blocked due to safety settings.";
                } else if (err.message?.includes("quota")) {
                    errorText = "API quota exceeded. Please try again later.";
                } else if (err.message) {
                    errorText = `Error: ${err.message}`;
                }
                setError(errorText);
                 // Remove the user message if the bot fails to respond to avoid confusion
                setMessages(prevMessages => prevMessages.filter(msg => msg.timestamp !== timestamp));
            } finally {
                setLoading(false);
                if (inputRef.current) inputRef.current.focus();
            }
        }
    };


    // *** MODIFIED: Handle copying text or image ***
    const handleCopyResponse = async (msg) => {
        // Check if ClipboardItem is supported and if the message has image data
        if (typeof ClipboardItem !== 'undefined' && msg.imageUrl) {
            // Copy image to clipboard
            try {
                const response = await fetch(msg.imageUrl);
                const blob = await response.blob();
                await navigator.clipboard.write([
                    new ClipboardItem({
                        [blob.type]: blob,
                    }),
                ]);
                showNotification("Image copied to clipboard");
            } catch (err) {
                console.error('Failed to copy image: ', err);
                showNotification("Failed to copy image");
            }
        } else if (msg.text) {
            // Copy text to clipboard
            navigator.clipboard.writeText(msg.text)
                .then(() => showNotification("Text copied to clipboard"))
                .catch(err => {
                    console.error('Failed to copy text: ', err);
                    showNotification("Failed to copy text");
                });
        } else {
             showNotification("Nothing to copy");
        }
    };
    // *** END MODIFIED SECTION ***

    // *** NEW: Handle image paste event ***
    const handlePaste = (event) => {
        // Basic client-side security: Prevent default paste if image data is found,
        // and perform validation. This doesn't sanitize metadata.
        // Robust security requires server-side processing.
        const items = event.clipboardData?.items;
        if (items) {
            for (const item of items) {
                if (item.kind === 'file' && item.type.startsWith('image/')) {
                    const file = item.getAsFile();
                    if (file) {
                        // Validate file type and size similar to file upload
                        if (!file.type.startsWith("image/") || file.size > 4 * 1024 * 1024) {
                            showNotification("Pasted file is invalid or too large. Only image files up to 4MB are supported for analysis.");
                            event.preventDefault(); // Prevent pasting invalid file data
                            return;
                        }
                        // Prevent default paste to avoid pasting string representation
                        event.preventDefault();
                        setFileAttachment(file); // Set the pasted file as the attachment
                        showNotification(`Pasted image: ${file.name || 'image.png'}`);
                        setError(null); // Clear any previous error
                        return; // Process only the first image found
                    }
                }
            }
        }
        // If no image file data is found, allow the default paste behavior (text)
    };
    // *** END NEW SECTION ***


    // *** MODIFIED: Handle file input change - now sets fileAttachment ***
    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            if (file.type.startsWith("image/")) {
                if (file.size > 4 * 1024 * 1024) { // Example: 4MB limit
                    showNotification("File is too large. Max 4MB allowed for images.");
                    event.target.value = ""; // Reset file input
                    setFileAttachment(null); // Clear any previous attachment
                    return;
                }
                setFileAttachment(file); // Set the uploaded file as the attachment
                showNotification(`Selected: ${file.name}`);
                setError(null);
            } else {
                showNotification("Please select an image file (e.g., PNG, JPG).");
                event.target.value = "";
                 setFileAttachment(null); // Clear any previous attachment
            }
        }
    };
    // *** END MODIFIED SECTION ***

    const triggerFileInput = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const toggleNotepad = () => {
        setIsNotepadOpen(!isNotepadOpen);
        showNotification(isNotepadOpen ? "Notepad closed" : "Notepad opened (Feature coming soon!)");
    };

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
    }, [messages]); // isUserScrolled removed as per original, to always scroll on new messages unless user scrolled up

    const handleScroll = () => {
        if (messagesContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
            const isNearBottom = scrollHeight - clientHeight - scrollTop < 100; // Increased threshold
            setIsUserScrolled(!isNearBottom);
            setShowScrollToBottom(!isNearBottom && scrollHeight > clientHeight + 50); // Only show if significantly scrolled up
        }
    };

    // eslint-disable-next-line no-unused-vars
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768); // isMobile currently not used, but kept
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

    // eslint-disable-next-line no-unused-vars
    const openModal = () => setIsModalOpen(true);
    // eslint-disable-next-line no-unused-vars
    const closeModal = () => setIsModalOpen(false);


    const showNotification = (message) => {
        setNotification(message);
        setTimeout(() => setNotification(null), 2500);
    };


    const ChatHeader = () => (
        <header className={currentMode.headerClass}>
            <div className={currentMode.logoClass}>
                <div className={currentMode.logoIconClass}><FontAwesomeIcon icon={currentMode.icon} /></div>
                <span className={currentMode.logoTextClass}>{currentMode.name}</span>
                <div className={`${currentMode.subscriptionBadgeClass} ${subscription}`}>
                    {subscription} Tier {subscription === "free" && `(${remainingInteractions} left)`}
                </div>
            </div>
            <div className={currentMode.controlsClass}>
                <button
                    className={`${currentMode.buttonClass} ${currentMode.buttonClass}--icon ${currentMode.buttonClass}--theme`}
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                    title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                >
                    <FontAwesomeIcon icon={theme === "dark" ? faSun : faMoon} />
                </button>
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

    return (
        <>
             {/* Wrapped the entire content inside a single div within the Fragment */}
             <div className={currentMode.modalClass} style={{ display: isModalOpen || true ? 'flex': 'none' }}>
                 <div className={currentMode.modalContentClass}>
                     <div className={`chat-wrapper ${currentMode.containerClass} ${theme}`}>
                         <ChatHeader />

                         {error && <div className={`chat-error-display ${currentMode.errorMessageClass}`}>{error}</div>}

                         <main className={currentMode.messagesClass} ref={messagesContainerRef} onScroll={handleScroll} aria-live="polite">
                             {messages?.map((msg, index) => (
                                 <div key={index} className={`${currentMode.messageClass} ${msg.role}`}>
                                     <div className={`${currentMode.messageClass}-bubble`}>
                                         {msg.role === 'model' && (
                                             <FontAwesomeIcon icon={currentMode.icon} className="message-icon model-icon" />
                                         )}
                                         {/* Updated message rendering */}
                                         <div className="message-content-wrapper">
                                            {msg.text && (
                                                // Ideally, use a Markdown renderer here instead of dangerouslySetInnerHTML
                                                // For example: <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{msg.text}</ReactMarkdown>
                                                // Using basic rendering for now as Markdown libs are not in this file.
                                                <p className="message-text" dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n\n/g, '<p/><p>').replace(/\n/g, '<br />') }}></p>
                                            )}
                                            {/* Render image if imageUrl exists (for AI generated images) */}
                                            {msg.type === 'image_response' && msg.imageUrl && (
                                                <div className="message-image-container">
                                                    <img src={msg.imageUrl} alt={msg.text || `Generated Diagram for ${userInput}`} className="generated-image" />
                                                </div>
                                            )}
                                             {/* TODO: Optionally render user-uploaded image previews here if msg.fileInfo and msg.fileInfo.dataUrl exists */}
                                        </div>

                                         {msg.role === 'model' && (msg.text || msg.imageUrl) && ( // Show copy button if there's text OR image
                                             <button
                                                 className={`message-action-button ${currentMode.buttonClass}--icon`}
                                                 onClick={() => handleCopyResponse(msg)} // Pass the entire message object
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

                         {/* Updated loading indicator */}
                         {loading && (
                             <div className={`chat-loading-indicator ${currentMode.loaderClass}`}>
                                 <FontAwesomeIcon icon={faSpinner} spin />{' '}
                                 {isGeneratingImage ? "Generating diagram, please wait..." : "Thinking..."}
                             </div>
                         )}

                         {subscription === "free" && remainingInteractions <= 0 && !loading && (
                             <div className={`chat-limit-message ${currentMode.errorMessageClass}`}>
                                 Interaction limit reached. {currentMode.outOfCreditsMessage}
                             </div>
                         )}

                         <footer className={`chat-footer ${currentMode.footerClass}`}>
                             <input
                                type="file"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                onChange={handleFileChange} // Use modified handleFileChange
                                accept="image/png, image/jpeg, image/webp, image/gif" // More specific image types
                             />
                             <button
                                className={`${currentMode.buttonClass} ${currentMode.buttonClass}--icon`}
                                onClick={triggerFileInput}
                                aria-label="Attach file"
                                title="Attach image file (PNG, JPG, WEBP, GIF)"
                                disabled={loading || (subscription === "free" && remainingInteractions <= 0)}
                            >
                                 <FontAwesomeIcon icon={faPaperclip} />
                             </button>
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
                                 onPaste={handlePaste} // *** ADDED: Handle paste event ***
                                 placeholder={fileAttachment ? `Describe ${fileAttachment.name || 'Pasted Image'}... or type /draw ...` : currentMode.placeholder}
                                 rows="1"
                                 aria-label="Chat input"
                                 disabled={loading || (subscription === "free" && remainingInteractions <= 0)}
                             />
                            {/* Optional: Display attached file name next to input */}
                            {fileAttachment && (
                                <span className="file-attachment-name" style={{ marginLeft: '8px', fontStyle: 'italic' }}>
                                    {fileAttachment.name || 'Pasted Image'}
                                </span>
                            )}
                             <button
                                 className={`${currentMode.sendButtonClass} ${currentMode.buttonClass}--icon`}
                                 onClick={handleSendMessage}
                                 disabled={(!userInput.trim() && !fileAttachment) || loading || (subscription === "free" && remainingInteractions <= 0)}
                                 aria-label="Send message"
                                 title="Send message"
                             >
                                 <FontAwesomeIcon icon={faPaperPlane} />
                             </button>
                         </footer>

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
        </>
    );
};

export default StemChat;