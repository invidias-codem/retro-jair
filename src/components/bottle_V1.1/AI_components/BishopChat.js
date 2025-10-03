// BishopChat.js
import React, { useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSun, faMoon, faPaperPlane, faChevronDown, faSpinner } from '@fortawesome/free-solid-svg-icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import useChatAgent from '../hooks/useChatAgent';


const BishopChat = ({ agentId = 'bishop-ai' }) => {
    const {
        agentConfig,
        messages,
        userInput,
        loading,
        error,
        theme,
        showScrollToBottom,
        notification,
        setUserInput,
        handleSendMessage,
        handleKeyDown,
        handleScroll,
        scrollToBottom,
        handleCopyResponse,
        toggleTheme,
        inputRef,
        messagesEndRef,
        messagesContainerRef,
        remainingInteractions,
        subscription
    } = useChatAgent({ agentId });

    const ChatHeader = useMemo(() => agentConfig ? (
        <header className={agentConfig.ui.headerClass}>
            <div className={agentConfig.ui.logoClass}>
                <FontAwesomeIcon icon={agentConfig.icon} className={agentConfig.ui.logoIconClass} />
                <span className={agentConfig.ui.logoTextClass}>{agentConfig.name}</span>
                <div className={`${agentConfig.ui.subscriptionBadgeClass} ${subscription}`}>{subscription} Tier</div>
            </div>
            <div className={agentConfig.ui.controlsClass}>
                
            </div>
        </header>
    ) : null, [agentConfig, theme, toggleTheme, subscription]);

    if (!agentConfig) {
        return <div className="chat-loading-indicator"><FontAwesomeIcon icon={faSpinner} spin /> Loading Agent...</div>;
    }

    const { ui, placeholders, interactionName, actions, icon } = agentConfig;

    return (
        <div className={`chat-wrapper ${ui.containerClass} ${theme}`}>
            {ChatHeader} {/* CORRECTED: Render the element directly */}

            {error && <div className={`chat-error-display ${ui.errorMessageClass}`}>{error}</div>}

            <main className={ui.messagesClass} ref={messagesContainerRef} onScroll={handleScroll}>
                {messages.map((msg, index) => (
                    <div key={index} className={`${ui.messageClass} ${msg.role}`}>
                        <div className={ui.messageBubbleClass}>
                            {msg.role === 'model' && <FontAwesomeIcon icon={icon} className="message-icon model-icon" />}
                            <div className="message-text">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                            </div>
                            {msg.role === 'model' && msg.text && (
                                <button
                                    className={`message-action-button`}
                                    onClick={() => handleCopyResponse(msg.text)}
                                    title={actions.saveToJournal.label}>
                                    <FontAwesomeIcon icon={actions.saveToJournal.icon} />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </main>

            {showScrollToBottom && (
                 <button className="scroll-to-bottom visible" onClick={scrollToBottom}>
                    <FontAwesomeIcon icon={faChevronDown} />
                </button>
            )}

            {loading && (
                <div className={`chat-loading-indicator ${ui.loaderClass}`}>
                    <FontAwesomeIcon icon={faSpinner} spin /> Seeking wisdom...
                </div>
            )}

            {subscription === "free" && remainingInteractions <= 0 && !loading && (
                <div className={`chat-limit-message ${ui.errorMessageClass}`}>
                    You've reached your limit of {interactionName} for today. {placeholders.noCredits}
                </div>
            )}

            <footer className={`chat-footer ${ui.footerClass}`}>
                <textarea
                    ref={inputRef}
                    className={ui.inputClass}
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholders.input}
                    rows="1"
                    disabled={loading || (subscription === "free" && remainingInteractions <= 0)}
                />
                <button
                    className={`${ui.sendButtonClass}`}
                    onClick={handleSendMessage}
                    disabled={!userInput.trim() || loading || (subscription === "free" && remainingInteractions <= 0)}
                    >
                    <FontAwesomeIcon icon={faPaperPlane} />
                </button>
            </footer>

            {notification && <div className="chat-notification">{notification}</div>}
        </div>
    );
};

export default BishopChat;