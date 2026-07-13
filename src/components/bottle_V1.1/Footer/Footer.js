import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGithub, faLinkedin } from '@fortawesome/free-brands-svg-icons';
import './Footer.css';

function Footer() {
  return (
    <footer className="footer jj-footer">
      <div className="jj-footer-inner">
        <div className="jj-footer-brand">
          <span className="jj-footer-mark">JJ</span>
          <span>Joshua-Jair “JJ” Mohammed</span>
        </div>
        <div className="social-media-links jj-social">
          <a href="https://github.com/invidias-codem" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
            <FontAwesomeIcon icon={faGithub} className="icon github" />
          </a>
          <a href="https://www.linkedin.com/in/joshua-mohammed14/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
            <FontAwesomeIcon icon={faLinkedin} className="icon linkedin" />
          </a>
        </div>
        <p className="jj-copy">© {new Date().getFullYear()} Joshua-Jair Mohammed · DevSecOps & AI Infrastructure</p>
      </div>
    </footer>
  );
}

export default Footer;
