import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInstagram, faGithub, faLinkedin } from '@fortawesome/free-brands-svg-icons';
import { faComment } from '@fortawesome/free-solid-svg-icons';
import './Footer.css';

function Footer() {
    return (
        <footer className="footer">
          <h3>Connect with me</h3>
          <div className="social-media-links">
            <a href="https://www.instagram.com/invidious.voidrem/" target="_blank" rel="noopener noreferrer">
              <FontAwesomeIcon icon={faInstagram} className="icon instagram" />
            </a>
            <a href="https://www.threads.net/@invidious.voidrem" target="_blank" rel="noopener noreferrer">
              <FontAwesomeIcon icon={faComment} className="icon comment" />
            </a>
            <a href="https://github.com/invidias-codem" target="_blank" rel="noopener noreferrer">
              <FontAwesomeIcon icon={faGithub} className="icon github" />
            </a>
            <a href="https://www.linkedin.com/in/joshua-mohammed14/" target="_blank" rel="noopener noreferrer">
              <FontAwesomeIcon icon={faLinkedin} className="icon linkedin" />
            </a>
          </div>
          <p>© 2024 Joshua-Jair Emmanuel Mohammed</p>
        </footer>
      );
}

export default Footer;