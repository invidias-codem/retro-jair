import React, { useState } from 'react';
import './Speaker.css';

function Speaker() {
  const [messages] = useState([
    "Welcome to my Portfolio!",
    "Now Featuring TradeFlow: The AI-Powered Job Management Tool"
  ]);

  return (
    <div className="speaker-banner">
      <div className="speaker-content">
        {messages.map((message, index) => (
          <span key={index} className="speaker-message">{message}</span>
        ))}
        {messages.map((message, index) => (
          <span key={index + messages.length} className="speaker-message">{message}</span>
        ))}
      </div>
    </div>
  );
}

export default Speaker;