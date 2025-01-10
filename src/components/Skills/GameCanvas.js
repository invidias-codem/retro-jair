// GameCanvas.js
import React, { useRef, useEffect, forwardRef, useImperativeHandle, useCallback } from 'react';
import { GameState } from './gameLogic';

export const GameCanvas = forwardRef(({ onStateChange, gameState }, ref) => {
    const canvasRef = useRef(null);
    const gameStateRef = useRef(null);
    const animationFrameRef = useRef(null);
    const lastTimeRef = useRef(0);

    // Expose methods to parent component
    useImperativeHandle(ref, () => ({
        resetGame: () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            
            lastTimeRef.current = 0;
            
            if (canvasRef.current) {
                gameStateRef.current = new GameState(canvasRef.current);
                startGameLoop();
            }
        },
        handleResize: () => {
            const canvas = canvasRef.current;
            if (!canvas) return;

            const container = canvas.parentElement;
            if (container) {
                canvas.width = container.clientWidth;
                canvas.height = container.clientHeight;
            }

            // Reinitialize game state with new dimensions if needed
            if (gameStateRef.current) {
                gameStateRef.current.handleCanvasResize(canvas);
            }
        }
    }));

    const startGameLoop = useCallback(() => {
        const gameLoop = (timestamp) => {
            if (!lastTimeRef.current) {
                lastTimeRef.current = timestamp;
            }

            const deltaTime = (timestamp - lastTimeRef.current) / 1000; // Convert to seconds
            lastTimeRef.current = timestamp;

            const gameState = gameStateRef.current;
            if (!gameState) return;

            // Update game state
            const { gameOver, won } = gameState.update(deltaTime);
            
            // Draw frame
            gameState.draw();

            // Notify parent of state changes
            if (onStateChange) {
                onStateChange({
                    gameOver,
                    won,
                    score: gameState.score
                });
            }

            // Continue game loop if game is still active
            if (!gameOver && !won) {
                animationFrameRef.current = requestAnimationFrame(gameLoop);
            }
        };

        animationFrameRef.current = requestAnimationFrame(gameLoop);
    }, [onStateChange]);
    
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Initialize game state
        gameStateRef.current = new GameState(canvas);

        const handleKeyDown = (e) => {
            if (gameStateRef.current) {
                gameStateRef.current.handleKeyDown(e.key);
            }
        };

        const handleKeyUp = (e) => {
            if (gameStateRef.current) {
                gameStateRef.current.handleKeyUp(e.key);
            }
        };

        const preventScroll = (e) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
                e.preventDefault();
            }
        };

        // Start game loop
        startGameLoop();

        // Add event listeners
        window.addEventListener('keydown', preventScroll, false);
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        // Cleanup
        return () => {
            window.removeEventListener('keydown', preventScroll, false);
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [onStateChange, startGameLoop]);

    return (
        <canvas
            ref={canvasRef}
            className="game-canvas"
            tabIndex="0"
        />
    );
});

export default GameCanvas;