import React, { useCallback, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faPaperclip, faSpinner, faTimes } from '@fortawesome/free-solid-svg-icons';
// Assuming common styles are imported globally or via parent component
import './chatInterface.css'; // Make sure styles are available

// Added props: fileAttachment, onFileSelect, onRemoveFile
const Composer = ({
    draft,
    onDraftChange,
    onSend,
    sending, // Keep using 'sending' prop name
    fileAttachment,
    onFileSelect,
    onRemoveFile
}) => {
    const inputRef = useRef(null);
    const fileInputRef = useRef(null); // Ref for hidden file input

    // Handle Enter key for sending
    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (onSend) onSend();
        }
    }, [onSend]);

    // Trigger hidden file input click
    const handleFileClick = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    // Handle file selection and reset input
    const handleFileChange = useCallback((e) => {
        onFileSelect?.(e.target.files?.[0] || null);
        if (e.target) {
            e.target.value = null; // Reset input value
        }
    }, [onFileSelect]);

    return (
        // Use consistent CSS classes
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
            {/* Composer Row */}
            <div className="gemini-composer">
                {/* Hidden File Input */}
                <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                    disabled={!!sending} // Use !!sending for boolean conversion
                    aria-hidden="true"
                />
                {/* Attach Button */}
                <button
                    className="gemini-composer__tool-button"
                    onClick={handleFileClick}
                    disabled={!!sending}
                    aria-label="Attach file"
                    title="Attach file"
                 >
                    <FontAwesomeIcon icon={faPaperclip} />
                </button>
                {/* Text Input */}
                <textarea
                    ref={inputRef}
                    className="gemini-composer__input" // Use consistent class
                    value={draft}
                    onChange={(e) => onDraftChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    rows="1"
                    aria-label="Chat message input"
                    disabled={!!sending}
                />
                {/* Send Button */}
                <button
                    className="send-button" // Use consistent class
                    onClick={onSend}
                    // Updated disabled logic: disable if sending OR (no text AND no file)
                    disabled={!!sending || (!draft.trim() && !fileAttachment)}
                    aria-label="Send message"
                 >
                    {/* Show spinner when sending */}
                    {sending ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faPaperPlane} />}
                </button>
            </div>
        </div>
    );
};

// Wrap in React.memo for performance optimization
const MemoizedComposer = React.memo(Composer);
MemoizedComposer.displayName = 'Composer'; // Add display name

export default MemoizedComposer;