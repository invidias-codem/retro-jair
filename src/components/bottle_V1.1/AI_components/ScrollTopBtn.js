import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUp } from '@fortawesome/free-solid-svg-icons';
import '../AI_components/agents/chat.css';

const ScrollToPageTopButton = ({ scrollThreshold = 300 }) => {
    const [isVisible, setIsVisible] = useState(false);

    // Show button when page is scrolled down
    const toggleVisibility = () => {
        if (window.pageYOffset > scrollThreshold) {
            setIsVisible(true);
        } else {
            setIsVisible(false);
        }
    };

    // Set up scroll event listener
    useEffect(() => {
        window.addEventListener('scroll', toggleVisibility);
        return () => {
            window.removeEventListener('scroll', toggleVisibility);
        };
    }, [scrollThreshold]);

    // Smooth scroll to top
    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    };

    return (
        <button
            type="button"
            onClick={scrollToTop}
            className={`scroll-to-page-top-button ${isVisible ? 'visible' : ''}`}
            title="Scroll to top"
            aria-label="Scroll to top"
        >
            <FontAwesomeIcon icon={faArrowUp} />
        </button>
    );
};

export default ScrollToPageTopButton;