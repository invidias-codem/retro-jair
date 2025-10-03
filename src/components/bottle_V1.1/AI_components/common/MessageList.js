import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy, faFilePdf } from '@fortawesome/free-solid-svg-icons';
import jsPDF from 'jspdf';
import TypingEffect from './TypingEffect';

// --- Sub-component for Code Blocks with a Copy Button ---
const CodeBlock = ({ node, inline, className, children, ...props }) => {
  // Shows temporary "Copied!" feedback after successful copy
  const [isCopied, setIsCopied] = useState(false);

  // Text content to copy (strip a trailing newline if present)
  const textToCopy = String(children).replace(/\n$/, '');

  // Track and clear the pending timeout on unmount to avoid memory leaks
  const timeoutRef = useRef(null);
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Attempt to copy using Clipboard API; fall back to execCommand when unavailable
  const handleCopy = () => {
    const copy = async () => {
      try {
        if (navigator?.clipboard?.writeText) {
          await navigator.clipboard.writeText(textToCopy);
        } else {
          const textarea = document.createElement('textarea');
          textarea.value = textToCopy;
          textarea.setAttribute('readonly', '');
          textarea.style.position = 'absolute';
          textarea.style.left = '-9999px';
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          document.body.removeChild(textarea);
        }

        setIsCopied(true);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setIsCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy code: ', err);
      }
    };

    copy();
  };

  // Detect "language-*" class to decide block rendering
  const match = /language-(\w+)/.exec(className || '');

  if (!inline && match) {
    return (
      <div className="code-block-wrapper">
        <pre className={className} {...props}>
          {children}
        </pre>
        <button
          type="button"
          className="code-copy-button"
          onClick={handleCopy}
          title="Copy code"
          aria-live="polite"
        >
          <FontAwesomeIcon icon={faCopy} /> {isCopied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    );
  }

  return (
    <code className={className} {...props}>
      {children}
    </code>
  );
};

// --- Main MessageList Component ---
export default function MessageList({ messages, agentConfig, isSending }) {
  const [copyStatus, setCopyStatus] = useState({});
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleExportPDF = useCallback((text, agentName) => {
    const doc = new jsPDF();
    const margin = 15;
    const pageWidth = doc.internal.pageSize.getWidth();
    const usableWidth = pageWidth - 2 * margin;

    doc.setFontSize(16);
    doc.text(`${agentName}'s Response`, margin, 20);

    doc.setFontSize(11);
    const splitText = doc.splitTextToSize(text, usableWidth);
    doc.text(splitText, margin, 30);

    doc.save(`${agentName}-response-${Date.now()}.pdf`);
  }, []);

  return (
    <div className="gemini-chat-area">
      {messages?.map((msg, index) => {
        const isLastMessage = index === messages.length - 1;
        const isModelMessage = msg.role === 'model';
        const messageId = msg.id || msg.timestamp || index;

        return (
          <div key={messageId} className={`gemini-message ${msg.role}`}>
            <div className="gemini-message-bubble">
              {isModelMessage && !isSending && msg.text && msg.text.length > 500 && (
                <div className="message-actions">
                  <button
                    className="action-button export-pdf-button"
                    title="Export as PDF"
                    onClick={() => handleExportPDF(msg.text, agentConfig?.name || 'AI')}
                  >
                    <FontAwesomeIcon icon={faFilePdf} />
                  </button>
                </div>
              )}
              <div className="message-text">
                {isLastMessage && isModelMessage && !msg.imageUrl && !isSending ? (
                  <TypingEffect text={msg.text || ''} />
                ) : (
                  <ReactMarkdown
                    components={{
                      code: CodeBlock, // Use our custom component for code blocks
                    }}
                  >
                    {msg.text || ''}
                  </ReactMarkdown>
                )}
              </div>
              {msg.imageUrl && (
                <img src={msg.imageUrl} alt="Generated content" className="generated-image" />
              )}
            </div>
          </div>
        );
      })}

      {isSending && messages[messages.length - 1]?.role === 'user' && (
        <div className="gemini-message model">
          <div className="gemini-message-bubble">
            <div className="typing-indicator">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}