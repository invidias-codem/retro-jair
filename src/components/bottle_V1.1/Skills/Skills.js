// Skills.js
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GameCanvas } from './GameCanvas';
import { GameMessages } from './GameMessages';
import { GameControls } from './GameControls';
import './Skills.css';

const SkillGame = () => {
    const [gameState, setGameState] = useState('idle');
    const [isMobile, setIsMobile] = useState(false);
    const [countdown, setCountdown] = useState(10);
    const gameInstanceRef = useRef(null);

    // Handle game state changes
    const handleStateChange = useCallback(({ gameOver, won, score }) => {
        if (gameOver) {
            setGameState('lost');
        } else if (won) {
            setGameState('won');
        }
    }, []);

    // Handle game start
    const handleStart = useCallback(() => {
        setGameState('playing');
        setCountdown(10);
    }, []);

    // Handle game replay
    const handleReplay = useCallback(() => {
        if (gameInstanceRef.current) {
            gameInstanceRef.current.resetGame();
            setGameState('playing');
            setCountdown(10);
        }
    }, []);

    // Handle screen resize and mobile detection
    useEffect(() => {
        const handleResize = () => {
            const isMobileView = window.innerWidth <= 768;
            setIsMobile(isMobileView);
            
            // Only try to resize if game instance exists and has handleResize method
            if (gameInstanceRef.current?.handleResize) {
                try {
                    gameInstanceRef.current.handleResize();
                } catch (error) {
                    console.error('Error handling resize:', error);
                }
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    // Handle countdown and game state transitions
    useEffect(() => {
        let timer;
        if (gameState === 'won' || gameState === 'lost') {
            timer = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        // Optional: Auto-restart game
                        // handleReplay();
                        return 10;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        // Cleanup timer
        return () => {
            if (timer) {
                clearInterval(timer);
            }
        };
    }, [gameState]);

    // Cleanup game instance on unmount
    useEffect(() => {
        let gameInstance = gameInstanceRef.current;
        return () => {
            if (gameInstance) {
                // Cleanup any game resources
                gameInstance.cleanup && gameInstance.cleanup();
            }
        };
    }, []);

    return (
        <div className="skill-game">
            <GameMessages 
                gameState={gameState}
                countdown={countdown}
                isMobile={isMobile}
            />
            <div className="canvas-container">
                {gameState !== 'idle' && (
                    <GameCanvas 
                        onStateChange={handleStateChange}
                        gameState={gameState}
                        ref={gameInstanceRef}
                    />
                )}
            </div>
            <GameControls 
                onReplay={handleReplay}
                onStart={handleStart}
                gameState={gameState}
            />
        </div>
    );
};

export default SkillGame;