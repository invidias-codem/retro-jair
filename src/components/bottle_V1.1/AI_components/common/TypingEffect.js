import React, { useState, useEffect } from 'react';

const TypingEffect = ({ text, onDone }) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    if (displayedText.length === text.length) {
      if (onDone) onDone();
      return;
    }

    const typingSpeed = 50; // Approx. 250 WPM
    const timer = setTimeout(() => {
      setDisplayedText(text.substring(0, displayedText.length + 1));
    }, typingSpeed);

    return () => clearTimeout(timer);
  }, [displayedText, text, onDone]);

  // Use a span for the cursor so it flows with the text
  return <>{displayedText}<span className="typing-cursor" /></>;
};

export default TypingEffect;