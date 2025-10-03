// bottle_V1.1/AI_components/Chat.js

import React, { useRef } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faPaperclip } from '@fortawesome/free-solid-svg-icons';
import useChatAgent from "../hooks/useChatAgent";
import MessageList from "./common/MessageList"; // Use the enhanced MessageList component

// A more robust ChatHeader that uses FontAwesome icons
const ChatHeader = ({ title, icon }) => (
  <div className="chat-header">
    {icon && <FontAwesomeIcon icon={icon} className="w-6 h-6" />}
    <h2 className="text-lg font-semibold">{title}</h2>
  </div>
);

// An improved ChatInput with a dedicated file attachment button
const ChatInput = ({ userInput, setUserInput, onSend, disabled, inputRef, onFileSelect }) => {
  const fileInputRef = useRef(null);

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="chat-input">
      <button className="btn-icon" onClick={handleFileClick} disabled={disabled} aria-label="Attach file">
        <FontAwesomeIcon icon={faPaperclip} />
      </button>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={(e) => onFileSelect?.(e.target.files?.[0] || null)}
        disabled={disabled}
      />
      <textarea
        ref={inputRef}
        className="flex-1"
        placeholder="Type your message..."
        value={userInput}
        onChange={(e) => setUserInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSend();
          }
        }}
        disabled={disabled}
        rows="1"
      />
      <button className="btn btn-send" onClick={onSend} disabled={disabled || !userInput.trim()}>
        <FontAwesomeIcon icon={faPaperPlane} />
      </button>
    </div>
  );
};

const Chat = ({ agentId }) => {
  const {
    agentConfig,
    messages,
    userInput,
    setUserInput,
    handleSendMessage,
    loading,
    inputRef,
    setFileAttachment,
    error,
  } = useChatAgent({ agentId });

  if (!agentConfig) {
    // A simple loading state
    return <div className="p-4 text-center">Loading Agent...</div>;
  }

  return (
    <div className={`chat-wrapper flex flex-col h-full retro-chat-theme ${agentConfig?.ui?.containerClass || ""}`}>
      <ChatHeader title={agentConfig?.name || "Chat"} icon={agentConfig?.icon} />
      {error ? (
        <div className="chat-error">{error}</div>
      ) : null}
      <MessageList
        messages={messages}
        agentConfig={agentConfig}
        isSending={loading} // Pass the loading state to show the "thinking" indicator
      />
      <ChatInput
        userInput={userInput}
        setUserInput={setUserInput}
        onSend={handleSendMessage}
        disabled={loading}
        inputRef={inputRef}
        onFileSelect={setFileAttachment}
      />
    </div>
  );
};

export default Chat;