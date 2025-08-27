import React, { useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSun, faMoon, faPaperPlane, faChevronDown, faSpinner, faPhone } from '@fortawesome/free-solid-svg-icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import useChatAgent from '../../hooks/useChatAgent';
import { useVapi } from '../../hooks/useVapi';
import CallView from "../common/CallView";
import "./chat.css";

const TechChat = ({ agentId = 'tech-genie' }) => {
    const chat = useChatAgent({ agentId });
    const vapi = useVapi();

    const ChatHeader = useMemo(() => {
        if (!chat.agentConfig) return null;
        const { ui, icon, name } = chat.agentConfig;
        return (
            <header className={ui.headerClass}>
                <div className={ui.logoClass}>
                    <FontAwesomeIcon icon={icon} className={ui.logoIconClass} />
                    <span className={ui.logoTextClass}>{name}</span>
                </div>
                <div className={ui.controlsClass}>
                    <button onClick={chat.toggleTheme} className={`${ui.buttonClass} ${ui.buttonClass}--theme`}>
                        <FontAwesomeIcon icon={chat.theme === 'dark' ? faSun : faMoon} />
                    </button>
                </div>
            </header>
        );
    }, [chat.agentConfig, chat.theme, chat.toggleTheme]);

    if (!chat.agentConfig) {
        return <div className="chat-loading-indicator"><FontAwesomeIcon icon={faSpinner} spin /> Loading Agent...</div>;
    }

    if (vapi.isCallActive || vapi.callStatus === 'connecting') {
        return (
            <CallView
                agent={chat.agentConfig}
                callStatus={vapi.callStatus}
                transcript={vapi.transcript}
                isSpeaking={vapi.isSpeaking}
                isListening={vapi.isListening}
                stopCall={vapi.stopCall}
            />
        );
    }

    const { ui, placeholders, interactionName, actions, icon } = chat.agentConfig;
    const { subscription, remainingInteractions } = chat;

    return (
        <div className={`chat-wrapper ${ui.containerClass} ${chat.theme}`}>
            {ChatHeader}

            {chat.error && <div className={`chat-error-display ${ui.errorMessageClass}`}>{chat.error}</div>}

            <main className={ui.messagesClass} ref={chat.messagesContainerRef} onScroll={chat.handleScroll}>
                {chat.messages.map((msg, index) => (
                    <div key={index} className={`${ui.messageClass} ${msg.role}`}>
                        <div className={ui.messageBubbleClass}>
                            {msg.role === 'model' && <FontAwesomeIcon icon={icon} className="message-icon model-icon" />}
                            <div className="message-text">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                            </div>
                            {msg.role === 'model' && msg.text && (
                                <button
                                    className={`message-action-button`}
                                    onClick={() => chat.handleCopyResponse(msg.text)}
                                    title={actions.copyCode.label}>
                                    <FontAwesomeIcon icon={actions.copyCode.icon} />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
                <div ref={chat.messagesEndRef} />
            </main>

            {chat.showScrollToBottom && (
                 <button className="scroll-to-bottom visible" onClick={chat.scrollToBottom}>
                    <FontAwesomeIcon icon={faChevronDown} />
                </button>
            )}

            {chat.loading && (
                <div className={`chat-loading-indicator ${ui.loaderClass}`}>
                    <FontAwesomeIcon icon={faSpinner} spin /> Thinking...
                </div>
            )}

            {subscription === "free" && remainingInteractions <= 0 && !chat.loading && (
                <div className={`chat-limit-message ${ui.errorMessageClass}`}>
                    You've reached your limit of {interactionName} for today. {placeholders.noCredits}
                </div>
            )}

            <footer className={`chat-footer ${ui.footerClass}`}>
                <textarea
                    ref={chat.inputRef}
                    className={ui.inputClass}
                    value={chat.userInput}
                    onChange={(e) => chat.setUserInput(e.target.value)}
                    onKeyDown={chat.handleKeyDown}
                    placeholder={placeholders.input}
                    rows="1"
                    disabled={chat.loading || (subscription === "free" && remainingInteractions <= 0)}
                />
                <button
                    className={`${ui.buttonClass}`}
                    onClick={() => vapi.startCall(chat.agentConfig.vapiAssistantId)}
                    title={`Start Voice Call with ${chat.agentConfig.name}`}
                    disabled={chat.loading}
                >
                    <FontAwesomeIcon icon={faPhone} />
                </button>
                <button
                    className={`${ui.sendButtonClass}`}
                    onClick={chat.handleSendMessage}
                    disabled={!chat.userInput.trim() || chat.loading || (subscription === "free" && remainingInteractions <= 0)}
                >
                    <FontAwesomeIcon icon={faPaperPlane} />
                </button>
            </footer>

            {chat.notification && <div className="chat-notification">{chat.notification}</div>}
        </div>
    );
};

export default TechChat;