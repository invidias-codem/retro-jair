// TypingText.js
import React, { useState, useEffect, useCallback } from 'react';
import './TypingText.css'; // We'll create this next

const TypingText = ({ fullText, typingSpeed = 30, onDone }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTypingComplete, setIsTypingComplete] = useState(false);

  // Reset when fullText changes
  useEffect(() => {
    setDisplayedText('');
    setCurrentIndex(0);
    setIsTypingComplete(false);
  }, [fullText]);

  useEffect(() => {
    if (isTypingComplete || currentIndex >= fullText.length) {
      if (!isTypingComplete) { // Ensure onDone is called if we reached the end by typing
          setIsTypingComplete(true);
          if (onDone) onDone();
      }
      return;
    }

    const timer = setTimeout(() => {
      setDisplayedText((prev) => prev + fullText[currentIndex]);
      setCurrentIndex((prev) => prev + 1);
    }, typingSpeed);

    return () => clearTimeout(timer);
  }, [currentIndex, fullText, typingSpeed, isTypingComplete, onDone]);

  const handleCompleteTyping = useCallback(() => {
    setIsTypingComplete(true);
    setDisplayedText(fullText);
    setCurrentIndex(fullText.length); // Make sure index is at the end
    if (onDone) onDone();
  }, [fullText, onDone]);

  // Function to render text with actual line breaks and the cursor
  const renderText = () => {
    // Split by explicit '\n' and then create spans for each line
    const lines = displayedText.split('\n');
    return lines.map((line, index) => (
      <React.Fragment key={index}>
        {line}
        {index < lines.length - 1 && <br />}
      </React.Fragment>
    ));
  };

  return (
    <div className="typing-text-container">
      <div className="typed-output">
        {renderText()}
        {!isTypingComplete && <span className="typing-effect-cursor">_</span>}
      </div>
      {!isTypingComplete && fullText && fullText.length > 0 && (
        <button onClick={handleCompleteTyping} className="complete-typing-button">
          COMPLETE TYPING
        </button>
      )}
    </div>
  );
};

export default TypingText;