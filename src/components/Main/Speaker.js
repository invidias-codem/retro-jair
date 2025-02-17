import React, { useState } from 'react';
import './Speaker.css';

function Speaker() {
  const [messages] = useState([
    "Welcome to my Portfolio!",
    "Check out this awesome menu!",
    "Sheeeeesh!",
    "Don't forget to peep my special projects!",
    "Looking to collab?",
    "Feel free to contact Me anytime!"
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