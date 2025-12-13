
import React, { useState, useRef, useEffect } from 'react';
import { Clipboard, Save, Check, Share2, MoreVertical } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import CodeBlock from './CodeBlock';
import MathBlock from './MathBlock';
import './Message.css';

const Message = ({ message, mode, copyToClipboard, saveToJournal }) => {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
  const bubbleRef = useRef(null);
  const contextMenuRef = useRef(null);
  const longPressTimerRef = useRef(null);

  const isModel = message.role === 'model';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  };

  const handleSave = () => {
    if (saveToJournal) {
      saveToJournal(message.text);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Message',
          text: message.text,
        });
      } catch (err) {
        console.error('Share failed:', err);
      }
    }
    setShowContextMenu(false);
  };

  // Long-press handler for mobile context menu
  const handleTouchStart = (e) => {
    longPressTimerRef.current = setTimeout(() => {
      const touch = e.touches[0];
      setContextMenuPos({ x: touch.clientX, y: touch.clientY });
      setShowContextMenu(true);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
  };

  // Right-click context menu for desktop
  const handleContextMenu = (e) => {
    e.preventDefault();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  // Close context menu on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target)) {
        setShowContextMenu(false);
      }
    };

    if (showContextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showContextMenu]);

  return (
    <div className={`message message--${isModel ? 'model' : 'user'}`}>
      <div
        ref={bubbleRef}
        className="message-bubble"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onContextMenu={handleContextMenu}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex]}
          components={{
            code: CodeBlock,
            math: ({ value }) => <MathBlock value={value} block={false} />,
            mathBlock: ({ value }) => <MathBlock value={value} block={true} />,
          }}
        >
          {message.text}
        </ReactMarkdown>

        {isModel && (
          <div className="message-actions">
            <button
              onClick={handleCopy}
              className="action-btn"
              title={copied ? 'Copied!' : 'Copy message'}
              aria-label="Copy message"
            >
              {copied ? <Check size={16} /> : <Clipboard size={16} />}
            </button>
            {saveToJournal && (
              <button
                onClick={handleSave}
                className="action-btn"
                title={saved ? 'Saved!' : 'Save message'}
                aria-label="Save message"
              >
                {saved ? <Check size={16} /> : <Save size={16} />}
              </button>
            )}
            {navigator.share && (
              <button
                onClick={handleShare}
                className="action-btn"
                title="Share message"
                aria-label="Share message"
              >
                <Share2 size={16} />
              </button>
            )}
            <button
              onClick={() => setShowContextMenu(!showContextMenu)}
              className="action-btn"
              title="More options"
              aria-label="More options"
              aria-expanded={showContextMenu}
            >
              <MoreVertical size={16} />
            </button>
          </div>
        )}

        {/* Context menu for mobile/desktop */}
        {showContextMenu && isModel && (
          <div
            ref={contextMenuRef}
            className="context-menu"
            style={{
              position: 'fixed',
              left: `${contextMenuPos.x}px`,
              top: `${contextMenuPos.y}px`,
            }}
            role="menu"
          >
            <button
              onClick={handleCopy}
              className="context-menu-item"
              role="menuitem"
            >
              <Clipboard size={16} />
              <span>Copy</span>
            </button>
            {saveToJournal && (
              <button
                onClick={handleSave}
                className="context-menu-item"
                role="menuitem"
              >
                <Save size={16} />
                <span>Save</span>
              </button>
            )}
            {navigator.share && (
              <button
                onClick={handleShare}
                className="context-menu-item"
                role="menuitem"
              >
                <Share2 size={16} />
                <span>Share</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Message;
