// src/components/bottle_V1.1/AI_components/agents/Chat.js

import React, { useRef, useCallback } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faPaperclip, faSpinner, faTimes } from '@fortawesome/free-solid-svg-icons'; // Added faSpinner, faTimes
import useChatAgent from "../hooks/useChatAgent"; //
import MessageList from "../common/MessageList"; //
import './Chat.css'; // - Assuming styles might be here or global

// --- Memoized ChatHeader ---
const ChatHeader = React.memo(({ title, icon }) => (
  // Assuming styles for chat-header exist in chatInterface.css or Chat.css
  <div className="chat-header gemini-header">
    {icon && <FontAwesomeIcon icon={icon} size="lg" style={{ marginRight: '10px' }} aria-hidden="true"/>}
    <h2 className="agent-name">{title}</h2>
  </div>
));
ChatHeader.displayName = 'ChatHeader'; // Add display name

// --- Memoized and Enhanced ChatInput ---
const ChatInput = React.memo(({
    userInput,
    setUserInput,
    onSend,
    loading, // Changed from 'disabled' to 'loading' for clarity
    inputRef,
    onFileSelect,
    fileAttachment, // Receive file attachment state
    onRemoveFile // Receive function to remove file
}) => {
  const fileInputRef = useRef(null);

  const handleFileClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleKeyDown = useCallback((e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        onSend();
      }
  }, [onSend]);

  const handleFileChange = useCallback((e) => {
    onFileSelect?.(e.target.files?.[0] || null);
    // Reset file input value
    if(e.target) {
       e.target.value = null;
    }
  }, [onFileSelect]);

  return (
    // Assuming styles for composer exist in chatInterface.css
    <div className="gemini-composer-container">
        {/* File Preview */}
        {fileAttachment && (
            <div className="file-preview">
                 <span>Attached: {fileAttachment.name} ({ (fileAttachment.size / 1024).toFixed(1) } KB)</span>
                 <button onClick={onRemoveFile} aria-label="Remove attached file">
                     <FontAwesomeIcon icon={faTimes} />
                 </button>
            </div>
        )}
        <div className="gemini-composer chat-input"> {/* Combine classes */}
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
                className="gemini-composer__tool-button" // Use consistent class
                onClick={handleFileClick}
                disabled={loading}
                aria-label="Attach file"
                title="Attach file"
             >
                <FontAwesomeIcon icon={faPaperclip} />
            </button>
            {/* Text Input */}
            <textarea
                ref={inputRef}
                className="gemini-composer__input" // Use consistent class
                placeholder="Type your message..."
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                rows="1"
                aria-label="Chat message input"
            />
            {/* Send Button */}
            <button
                className="send-button" // Use consistent class
                onClick={onSend}
                // Update disabled logic
                disabled={loading || (!userInput.trim() && !fileAttachment)}
                aria-label="Send message"
             >
                 {/* Show spinner when loading */}
                 {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faPaperPlane} />}
            </button>
        </div>
    </div>
  );
});
ChatInput.displayName = 'ChatInput'; // Add display name

// --- Main Chat Component ---
const Chat = ({ agentId }) => {
  const {
    agentConfig,
    messages,
    userInput,
    setUserInput,
    handleSendMessage,
    loading,
    error,
    fileAttachment, // Get file state
    setFileAttachment, // Get file setter
    inputRef,
  } = useChatAgent({ agentId }); //

  // --- Loading State ---
  if (!agentConfig) {
    // Consistent loading state
    return (
        <div className="gemini-dashboard loading-state" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <FontAwesomeIcon icon={faSpinner} spin size="2x" />
            <span style={{ marginLeft: '10px' }}>Loading Agent...</span>
        </div>
    );
  }

  // --- Function to Remove File Attachment ---
   const removeFileAttachment = useCallback(() => {
        setFileAttachment(null);
        // Optionally clear the file input ref value if needed, though less critical now
        // if (fileInputRef.current) fileInputRef.current.value = null;
    }, [setFileAttachment]);


  // --- Render Component ---
  return (
    // Apply theme and container classes from config
    <div className={`gemini-dashboard ${agentConfig.defaultTheme || 'retro'} ${agentConfig?.ui?.containerClass || ""}`}>
      {/* Header */}
      <ChatHeader title={agentConfig.name} icon={agentConfig.icon} />

      {/* Main Content Area */}
      <main className="gemini-main-content">
        {/* Error Display */}
        {error && <div className="gemini-error-display" role="alert">{error}</div>}

        {/* Message List */}
        <MessageList
          messages={messages}
          agentConfig={agentConfig}
          isSending={loading} // Pass loading state
        />

        {/* Input Area - Pass all required props */}
        <ChatInput
          userInput={userInput}
          setUserInput={setUserInput}
          onSend={handleSendMessage}
          loading={loading} // Pass loading state
          inputRef={inputRef}
          onFileSelect={setFileAttachment} // Pass file setter
          fileAttachment={fileAttachment} // Pass file state for preview
          onRemoveFile={removeFileAttachment} // Pass remove function
        />
      </main>
    </div>
  );
};

export default React.memo(Chat); // Memoize the main Chat component as well