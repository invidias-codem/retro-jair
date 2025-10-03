import React, { useCallback, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons';

export default function Composer({ draft, onDraftChange, onSend, sending }) {
    const inputRef = useRef(null);

    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (onSend) onSend();
        }
    }, [onSend]);

    return (
        <footer className="tech-footer">
            <textarea
                ref={inputRef}
                className="tech-input"
                value={draft}
                onChange={(e) => onDraftChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                rows="1"
                aria-label="Chat input"
                disabled={!!sending}
            />
            <button
                className="tech-send-button"
                onClick={onSend}
                disabled={!draft.trim() || !!sending}
            >
                <FontAwesomeeIcon icon={faPaperPlane} />
            </button>
        </footer>
    );
}