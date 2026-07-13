import React from 'react';
import { useNavigate } from 'react-router-dom';

export const GameControls = ({ onReplay, onStart, gameState, difficultyLevel }) => {
    const navigate = useNavigate();

    const handleExit = () => {
        navigate('/'); // Navigate to the home page or main menu
    };

    // If the game is idle, show the "Start Game" button
    if (gameState === 'idle') {
        return (
            <div className="game-controls">
                <button
                    className="control-button start-button"
                    onClick={onStart}
                    aria-label={`Start Game at Difficulty ${difficultyLevel}`}
                >
                    Start Game (Level {difficultyLevel})
                </button>
            </div>
        );
    }

    // If the game is won or lost, show "Play Again" and "Exit" buttons
    if (gameState === 'won' || gameState === 'lost') {
        // When playing again, the difficulty level might have incremented if the player won.
        // The difficultyLevel prop should reflect the level for the *next* game.
        const nextGameDifficulty = difficultyLevel;

        return (
            <div className="game-controls">
                <button
                    className="control-button replay-button"
                    onClick={onReplay}
                    aria-label={`Play Again at Difficulty ${nextGameDifficulty}`}
                >
                    Play Again (Level {nextGameDifficulty})
                </button>
                <button
                    className="control-button exit-button"
                    onClick={handleExit}
                >
                    Exit to Home
                </button>
            </div>
        );
    }

    // If gameState is 'playing' or any other state, render no controls from this component.
    // Returning null is cleaner than an empty div if there's no specific styling for the empty container.
    return null;
};