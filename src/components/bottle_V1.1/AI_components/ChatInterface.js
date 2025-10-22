// ./components/bottle_V1.1/AI_components/ChatInterface.js
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faPaperPlane, faPaperclip, faSpinner, faTimes } from '@fortawesome/free-solid-svg-icons';

// --- Local Imports ---
import useChatAgent from '../hooks/useChatAgent'; //
import { agentConfig as allAgentConfigs } from '../config/agent-config'; //
import MessageList from './common/MessageList'; //
import './common/chatInterface.css'; //

// --- Main Component ---
const ChatInterface = React.memo(() => {
    // --- State ---
    const [activeAgentKey, setActiveAgentKey] = useState('tech'); // Default agent key
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // --- Refs ---
    const dropdownRef = useRef(null);
    const fileInputRef = useRef(null);

    // --- Memoized Agent Configurations ---
    const AGENT_CONFIGS = useMemo(() => allAgentConfigs.getAllAsObject(), [allAgentConfigs]);
    const activeAgentConfig = useMemo(() => AGENT_CONFIGS[activeAgentKey] || Object.values(AGENT_CONFIGS)[0], [activeAgentKey, AGENT_CONFIGS]);

    // --- Custom Hook for Chat Logic ---
    const {
        messages,
        userInput,
        loading,
        error,
        fileAttachment,
        setUserInput,
        setFileAttachment,
        handleSendMessage,
        inputRef // Provided by the hook
    } = useChatAgent({ agentId: activeAgentConfig.id }); // Use the agent's unique ID

    // --- Effects ---
    // Effect for Closing Dropdown on Outside Click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []); // Empty dependency array is correct here

    // --- Event Handlers ---
    const handleAgentSelect = useCallback((agentKey) => {
        if (agentKey !== activeAgentKey) {
            setActiveAgentKey(agentKey); // This triggers the useChatAgent hook to re-initialize
        }
        setIsDropdownOpen(false);
    }, [activeAgentKey]);

    const handleSuggestionClick = useCallback((prompt) => {
        if (loading) return;
        setUserInput(prompt);
        // Directly call handleSendMessage after setting state. The hook manages the latest state.
        handleSendMessage();
    }, [loading, handleSendMessage, setUserInput]);

    const handleFileChange = useCallback((e) => {
        setFileAttachment(e.target.files?.[0] || null);
        // Reset file input value so selecting the same file again triggers onChange
        if (e.target) {
            e.target.value = null;
        }
    }, [setFileAttachment]);

    const removeFileAttachment = useCallback(() => {
        setFileAttachment(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = null; // Clear the input field value as well
        }
    }, [setFileAttachment]);

    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    }, [handleSendMessage]);

    // --- Loading State ---
    if (!activeAgentConfig) {
        return (
            <div className="gemini-dashboard loading-state" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <FontAwesomeIcon icon={faSpinner} spin size="2x" />
                <span style={{ marginLeft: '10px' }}>Loading Agent Configuration...</span>
            </div>
        );
    }

    // --- Render Component ---
    return (
        <div className="gemini-dashboard" data-theme={activeAgentConfig.defaultTheme || 'retro'}>
            {/* Header */}
            <header className="gemini-header">
                <div className="agent-dropdown" ref={dropdownRef}>
                    <button className="agent-dropdown-toggle" onClick={() => setIsDropdownOpen(p => !p)} aria-haspopup="true" aria-expanded={isDropdownOpen}>
                        <FontAwesomeIcon icon={activeAgentConfig.icon} aria-hidden="true" />
                        <span>{activeAgentConfig.name}</span>
                        <FontAwesomeIcon icon={faChevronDown} aria-hidden="true" />
                    </button>
                    {isDropdownOpen && (
                        <ul className="agent-dropdown-menu" role="menu">
                            {Object.values(AGENT_CONFIGS).map((agent) => (
                                <li key={agent.key} className="agent-dropdown-item" role="none">
                                    <button
                                        onClick={() => handleAgentSelect(agent.key)}
                                        className={activeAgentKey === agent.key ? 'active' : ''}
                                        role="menuitem"
                                    >
                                        <FontAwesomeIcon icon={agent.icon} aria-hidden="true" />
                                        {agent.name}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                {/* Placeholder for other header controls */}
            </header>

            {/* Main Content */}
            <main className="gemini-main-content">
                {/* Suggestions Area */}
                {messages.length <= 1 && !loading && activeAgentConfig.suggestions?.length > 0 && (
                    <div className="suggestion-prompts-container">
                        {activeAgentConfig.suggestions.map((prompt, index) => (
                            <button key={index} className="suggestion-prompt" onClick={() => handleSuggestionClick(prompt)}>
                                {prompt}
                            </button>
                        ))}
                    </div>
                )}

                {/* Message List */}
                <MessageList messages={messages} agentConfig={activeAgentConfig} isSending={loading} />

                {/* Error Display */}
                {error && <div className="gemini-error-display" role="alert">{error}</div>}

                {/* Composer Area */}
                <div className="gemini-composer-container">
                    {/* File Preview */}
                    {fileAttachment && (
                        <div className="file-preview">
                            <span>Attached: {fileAttachment.name} ({ (fileAttachment.size / 1024).toFixed(1) } KB)</span>
                            <button onClick={removeFileAttachment} aria-label="Remove attached file">
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                        </div>
                    )}

                    {/* Composer Input Row */}
                    <div className="gemini-composer">
                        {/* Hidden File Input */}
                        <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            onChange={handleFileChange}
                            disabled={loading}
                            aria-hidden="true"
                        />

                        {/* Attach Button */}
                        <button
                            className="gemini-composer__tool-button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={loading}
                            title="Attach file"
                            aria-label="Attach file"
                        >
                            <FontAwesomeIcon icon={faPaperclip} />
                        </button>

                        {/* Text Input */}
                        <textarea
                            ref={inputRef}
                            className="gemini-composer__input"
                            placeholder={activeAgentConfig.placeholders.input}
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            rows="1"
                            disabled={loading}
                            aria-label="Chat message input"
                        />

                        {/* Send Button */}
                        <button
                            className="send-button"
                            onClick={handleSendMessage}
                            disabled={loading || (!userInput.trim() && !fileAttachment)}
                            aria-label="Send message"
                        >
                           {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faPaperPlane} />}
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}); // End of React.memo

ChatInterface.displayName = 'ChatInterface'; // Add display name for better debugging

export default ChatInterface;