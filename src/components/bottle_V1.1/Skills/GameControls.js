import React from 'react';
import { useNavigate } from 'react-router-dom';

export const GameControls = ({ onReplay, onStart, gameState }) => {
    const navigate = useNavigate();

    const handleExit = () => {
        navigate('/');
    };

    if (gameState === 'idle') {
        return (
            <div className="game-controls">
                <button 
                    className="control-button start-button" 
                    onClick={onStart}
                >
                    Start Game
                </button>
            </div>
        );
    }

    return (
        <div className="game-controls">
            {(gameState === 'won' || gameState === 'lost') && (
                <>
                    <button 
                        className="control-button replay-button" 
                        onClick={onReplay}
                    >
                        Play Again
                    </button>
                    <button 
                        className="control-button exit-button" 
                        onClick={handleExit}
                    >
                        Exit to Home
                    </button>
                </>
            )}
        </div>
    );
};