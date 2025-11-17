// Skills.js
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GameCanvas } from './GameCanvas';
import { GameMessages } from './GameMessages';
import { GameControls } from './GameControls';
import './Skills.css';
import { GAME_CONFIG } from './gameLogic';

const SkillGame = () => {
    const [gameState, setGameState] = useState('idle');
    const [isMobile, setIsMobile] = useState(false);
    const [countdown, setCountdown] = useState(10);
    const gameInstanceRef = useRef(null);
    const [score, setScore] = useState(0);
    const [difficultyLevel, setDifficultyLevel] = useState(1);
    const [currentWinningScore, setCurrentWinningScore] = useState(
        GAME_CONFIG.BASE_WINNING_SCORE + (difficultyLevel - 1) * GAME_CONFIG.WINNING_SCORE_DIFFICULTY_MULTIPLIER
    );
    
    // --- NEW: Audio State ---
    const [isMuted, setIsMuted] = useState(false);
    const audioRef = useRef(null);
    // --- END NEW ---

    // Ref to store the countdown value at the moment the game ends, for logging purposes
    const initialCountdownForLogRef = useRef(countdown);

    useEffect(() => {
        setCurrentWinningScore(GAME_CONFIG.BASE_WINNING_SCORE + (difficultyLevel - 1) * GAME_CONFIG.WINNING_SCORE_DIFFICULTY_MULTIPLIER);
    }, [difficultyLevel]);

    const handleStateChange = useCallback(({ gameOver, won, score: newScore }) => {
        setScore(newScore);
        if (gameOver) {
            setGameState('lost');
            setCountdown(10); // Reset countdown for the message
        } else if (won) {
            setGameState('won');
            setDifficultyLevel(prevDifficulty => prevDifficulty + 1);
            setCountdown(10); // Reset countdown for the message
        }
    }, []); // No dependencies needed as it only uses setters or prev values

    const handleStart = useCallback(() => {
        console.log("Skills.js: handleStart called");
        setGameState('playing');
        // Countdown is primarily for win/loss messages, reset by handleStateChange.
    }, []);

    const handleReplay = useCallback(() => {
        console.log("Skills.js: handleReplay called");
        if (gameInstanceRef.current?.resetGame) {
            gameInstanceRef.current.resetGame(difficultyLevel);
            setGameState('playing');
            // Countdown state will be reset by handleStateChange when the next game ends.
        } else {
            console.error("Skills.js: gameInstanceRef.current.resetGame is not available. Attempting fallback.");
            setGameState('idle'); // Go to idle then playing to try to force re-mount/re-init of GameCanvas
            setTimeout(() => setGameState('playing'), 0);
        }
    }, [difficultyLevel]);

    useEffect(() => {
        const handleResize = () => {
            const isMobileView = window.innerWidth <= 768;
            setIsMobile(isMobileView);
            gameInstanceRef.current?.handleResize?.();
        };
        handleResize(); // Initial check
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Effect to update the initialCountdownForLogRef when game state changes to won/lost
    useEffect(() => {
        if (gameState === 'won' || gameState === 'lost') {
            // `countdown` state would have just been set to 10 by `handleStateChange`
            initialCountdownForLogRef.current = countdown;
        }
    }, [gameState, countdown]); // This effect correctly depends on countdown for updating the ref

    // Countdown timer for win/loss states and auto-restart
    // This is the effect previously around line 100
    useEffect(() => {
        let timerId = null;

        if (gameState === 'won' || gameState === 'lost') {
            // Log the countdown value that was current when this state began
            console.log(`Skills.js: Game ended (${gameState}). Starting countdown from ${initialCountdownForLogRef.current}.`);

            timerId = setInterval(() => {
                setCountdown(prevCountdown => {
                    if (prevCountdown <= 1) {
                        clearInterval(timerId);
                        console.log("Skills.js: Countdown finished. Calling handleReplay.");
                        handleReplay();
                        return 0; // Visually show 0 briefly
                    }
                    return prevCountdown - 1;
                });
            }, 1000);
        }
        // No else block needed to clear timer; the cleanup function handles it.

        return () => { // Cleanup function
            if (timerId) {
                clearInterval(timerId);
                // console.log("Skills.js: Countdown timer cleared."); // Optional: for debugging
            }
        };
    }, [gameState, handleReplay]); // `countdown` is NOT needed here for the timer logic itself due to `setCountdown(prev => ...)`.
                                   // `initialCountdownForLogRef.current` is used for the log, which is stable within this effect's run.

    // --- NEW: Audio Playback Effect ---
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.muted = isMuted;
            if (gameState === 'playing' && audioRef.current.paused) {
                audioRef.current.play().catch(e => console.warn("Audio play failed:", e));
            } else if (gameState !== 'playing' && !audioRef.current.paused) {
                audioRef.current.pause();
                // audioRef.current.currentTime = 0; // Optional: reset music on game over
            }
        }
    }, [gameState, isMuted]);
    // --- END NEW ---
    
    // --- NEW: Toggle Mute Function ---
    const toggleMute = () => {
        setIsMuted(prevMuted => !prevMuted);
    };
    // --- END NEW ---

    // GameCanvas instance cleanup on unmount
    useEffect(() => {
        const gameInst = gameInstanceRef.current;
        return () => {
            if (gameInst?.cleanup) {
                console.log("Skills.js: Cleaning up game instance on unmount");
                gameInst.cleanup();
            }
        };
    }, []); // Empty dependency array means this runs once on mount and cleans up on unmount.

    return (
        <div className={`skill-game ${gameState === 'idle' ? 'idle' : ''}`}>
            {/* --- NEW: Audio Element and Mute Button --- */}
            <audio ref={audioRef} src="/retro.wav" loop preload="auto" />
            <button onClick={toggleMute} className="mute-button" aria-label="Toggle Mute">
                {isMuted ? 'Unmute' : 'Mute'}
            </button>
            {/* --- END NEW --- */}
            
            <GameMessages
                gameState={gameState}
                countdown={countdown}
                isMobile={isMobile}
                currentWinningScore={currentWinningScore}
                score={score}
            />
            <div className="canvas-container">
                {gameState !== 'idle' && (
                    <GameCanvas
                        onStateChange={handleStateChange}
                        gameState={gameState}
                        difficultyLevel={difficultyLevel}
                        ref={gameInstanceRef}
                    />
                )}
            </div>
            <GameControls
                onReplay={handleReplay}
                onStart={handleStart}
                gameState={gameState}
                difficultyLevel={difficultyLevel}
            />
        </div>
    );
};

export default SkillGame;