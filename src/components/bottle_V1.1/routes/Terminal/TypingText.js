// TypingText.js (Optimized)
import React, { useState, useEffect, useCallback } from 'react';
import './TypingText.css';

const TypingText = ({ fullText = '', typingSpeed = 30, onDone }) => {
  const [displayedText, setDisplayedText] = useState('');

  // We can derive whether the typing is complete directly from the state.
  // This removes the need for a separate `isTypingComplete` state variable.
  const isTypingComplete = displayedText.length === fullText.length;

  // This single useEffect hook now handles the entire typing lifecycle.
  useEffect(() => {
    // If typing is done, call the onDone callback and stop.
    if (isTypingComplete) {
      if (onDone) {
        onDone();
      }
      return;
    }

    // The timer adds one character at a time from the fullText.
    const timer = setTimeout(() => {
      setDisplayedText(fullText.substring(0, displayedText.length + 1));
    }, typingSpeed);

    // Cleanup function to clear the timer.
    return () => clearTimeout(timer);
  }, [displayedText, fullText, isTypingComplete, typingSpeed, onDone]);

  // A separate effect to reset the component when the text prop changes.
  useEffect(() => {
    setDisplayedText('');
  }, [fullText]);

  // A simplified callback to immediately display the full text.
  const handleCompleteTyping = useCallback(() => {
    setDisplayedText(fullText);
  }, [fullText]);

  return (
    <div className="typing-text-container">
      <div className="typed-output">
        {displayedText}
        {/* The cursor is now an empty span. 
          Its block appearance and blinking are controlled entirely by your CSS,
          which is more performant and flexible.
        */}
        {!isTypingComplete && <span className="typing-effect-cursor" />}
      </div>

      {!isTypingComplete && fullText.length > 0 && (
        <button onClick={handleCompleteTyping} className="complete-typing-button">
          COMPLETE TYPING
        </button>
      )}
    </div>
  );
};

export default TypingText;