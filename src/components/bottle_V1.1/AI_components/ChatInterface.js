// ./components/bottle_V1.1/AI_components/ChatInterface.js
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faPaperPlane, faPaperclip, faPhone, faSearch, faSpinner } from '@fortawesome/free-solid-svg-icons';

import { agentConfig as allAgentConfigs } from '../config/agent-config';
import MessageList from './common/MessageList';
import './common/chatInterface.css';

const ChatInterface = () => {
    const [activeAgentKey, setActiveAgentKey] = useState('tech');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    
    const [messages, setMessages] = useState([]);
    const [userInput, setUserInput] = useState("");
    const [chatSession, setChatSession] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const dropdownRef = useRef(null);
    const inputRef = useRef(null);

    const AGENT_CONFIGS = useMemo(() => allAgentConfigs.getAllAsObject(), []);
    const activeAgentConfig = useMemo(() => AGENT_CONFIGS[activeAgentKey] || Object.values(AGENT_CONFIGS)[0], [activeAgentKey, AGENT_CONFIGS]);

    useEffect(() => {
        const initializeChat = async () => {
            if (!activeAgentConfig) return;

            setLoading(true);
            setError(null);
            setChatSession(null);

            try {
                const apiKey = process.env.REACT_APP_GEMINI_API;
                if (!apiKey) throw new Error("API key not found.");

                const genAI = new GoogleGenerativeAI(apiKey);
                const model = genAI.getGenerativeModel({ model: activeAgentConfig.api.model });

                const newChat = model.startChat({
                    history: [
                        { role: "user", parts: [{ text: activeAgentConfig.initialPrompt }] },
                        { role: "model", parts: [{ text: activeAgentConfig.initialResponse }] },
                    ],
                    generationConfig: { temperature: activeAgentConfig.api.temperature },
                    safetySettings: activeAgentConfig.api.safetySettings,
                });
                
                setChatSession(newChat);
                setMessages([{ role: "model", text: activeAgentConfig.initialResponse, timestamp: Date.now() }]);
            } catch (err) {
                console.error("Failed to initialize AI model:", err);
                setError(`Failed to initialize AI: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };

        initializeChat();
    }, [activeAgentKey, activeAgentConfig]);
    
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsDropdownOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleAgentSelect = useCallback((agentKey) => {
        if (agentKey !== activeAgentKey) setActiveAgentKey(agentKey);
        setIsDropdownOpen(false);
    }, [activeAgentKey]);

    const handleSendMessage = useCallback(async (promptOverride) => {
        const textInput = (typeof promptOverride === 'string' ? promptOverride : userInput).trim();
        if (!textInput || loading || !chatSession) return;

        setLoading(true);
        setError(null);

        const userMessage = { role: 'user', text: textInput, timestamp: Date.now() };
        setMessages(prev => [...prev, userMessage]);
        
        if (typeof promptOverride !== 'string') {
            setUserInput("");
        }

        try {
            const result = await chatSession.sendMessage(textInput);
            const responseText = result.response.text();
            setMessages(prev => [...prev, { role: 'model', text: responseText, timestamp: Date.now() }]);
        } catch (err) {
            console.error("Error sending message:", err);
            setError(`Sorry, an error occurred: ${err.message}`);
            setMessages(prev => prev.filter(msg => msg.timestamp !== userMessage.timestamp));
        } finally {
            setLoading(false);
            inputRef.current?.focus();
        }
    }, [userInput, loading, chatSession]);

    const handleSuggestionClick = useCallback((prompt) => {
        if (loading) return;
        handleSendMessage(prompt);
    }, [loading, handleSendMessage]);

    if (!activeAgentConfig) {
        return <div className="loading-screen"><FontAwesomeIcon icon={faSpinner} spin /> Loading Agent...</div>;
    }

    return (
        <div className="gemini-dashboard" data-theme={activeAgentConfig.defaultTheme || 'retro'}>
            <header className="gemini-header">
                <div className="agent-dropdown" ref={dropdownRef}>
                    <button className="agent-dropdown-toggle" onClick={() => setIsDropdownOpen(p => !p)}>
                        <FontAwesomeIcon icon={activeAgentConfig.icon} />
                        <span>{activeAgentConfig.name}</span>
                        <FontAwesomeIcon icon={faChevronDown} />
                    </button>
                    {isDropdownOpen && (
                        <ul className="agent-dropdown-menu">
                            {Object.values(AGENT_CONFIGS).map((agent) => (
                                <li key={agent.key} className="agent-dropdown-item">
                                    <button onClick={() => handleAgentSelect(agent.key)} className={activeAgentKey === agent.key ? 'active' : ''}>
                                        <FontAwesomeIcon icon={agent.icon} />
                                        {agent.name}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </header>

            <main className="gemini-main-content">
                {/* --- RENDER SUGGESTIONS HERE --- */}
                {messages.length <= 1 && !loading && activeAgentConfig.suggestions?.length > 0 && (
                    <div className="suggestion-prompts-container">
                        {activeAgentConfig.suggestions.map((prompt, index) => (
                            <button key={index} className="suggestion-prompt" onClick={() => handleSuggestionClick(prompt)}>
                                {prompt}
                            </button>
                        ))}
                    </div>
                )}
                
                <MessageList messages={messages} agentConfig={activeAgentConfig} isSending={loading} />

                {error && <div className="gemini-error-display">{error}</div>}

                <div className="gemini-composer-container">
                    <div className="gemini-composer">
                        <textarea
                            ref={inputRef}
                            className="gemini-composer__input"
                            placeholder={activeAgentConfig.placeholders.input}
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }}}
                            rows="1"
                            disabled={loading}
                        />
                        <button className="send-button" onClick={() => handleSendMessage()} disabled={loading || !userInput.trim()}>
                            <FontAwesomeIcon icon={faPaperPlane} />
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ChatInterface;