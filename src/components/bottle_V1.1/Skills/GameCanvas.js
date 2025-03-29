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
            if (!canvasRef.current) return;
            const container = canvasRef.current.parentElement;
            if (container) {
                canvasRef.current.width = container.clientWidth;
                canvasRef.current.height = container.clientHeight;
            }
            if (gameStateRef.current?.handleCanvasResize) {
                gameStateRef.current.handleCanvasResize(canvasRef.current);
            }
        }
    }));

    const startGameLoop = useCallback(() => {
        const gameLoop = (timestamp) => {
            if (!lastTimeRef.current) {
                lastTimeRef.current = timestamp;
            }

            const deltaTime = (timestamp - lastTimeRef.current) / 1000;
            lastTimeRef.current = timestamp;

            if (!gameStateRef.current) return;

            const { gameOver, won } = gameStateRef.current.update(deltaTime);
            gameStateRef.current.draw();

            if (onStateChange) {
                onStateChange({
                    gameOver,
                    won,
                    score: gameStateRef.current.score
                });
            }

            if (!gameOver && !won) {
                animationFrameRef.current = requestAnimationFrame(gameLoop);
            }
        };

        animationFrameRef.current = requestAnimationFrame(gameLoop);
    }, [onStateChange]);

    // Setup touch event handlers with proper options
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Initialize game state
        gameStateRef.current = new GameState(canvas);

        const handleTouch = (event) => {
            if (!gameStateRef.current) return;
            
            switch (event.type) {
                case 'touchstart':
                    gameStateRef.current.handleTouchStart(event);
                    break;
                case 'touchmove':
                    gameStateRef.current.handleTouchMove(event);
                    break;
                case 'touchend':
                case 'touchcancel':
                    gameStateRef.current.handleTouchEnd(event);
                    break;
                default:
                    console.error(`Unexpected event type: ${event.type}`);
            }
        };

        const handleKeyDown = (e) => {
            if (gameStateRef.current?.handleKeyDown) {
                gameStateRef.current.handleKeyDown(e.key);
            }
        };

        const handleKeyUp = (e) => {
            if (gameStateRef.current?.handleKeyUp) {
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

        // Add event listeners with passive: false
        canvas.addEventListener('touchstart', handleTouch, { passive: false });
        canvas.addEventListener('touchmove', handleTouch, { passive: false });
        canvas.addEventListener('touchend', handleTouch, { passive: false });
        canvas.addEventListener('touchcancel', handleTouch, { passive: false });
        
        window.addEventListener('keydown', preventScroll, false);
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        // Cleanup
        return () => {
            canvas.removeEventListener('touchstart', handleTouch);
            canvas.removeEventListener('touchmove', handleTouch);
            canvas.removeEventListener('touchend', handleTouch);
            canvas.removeEventListener('touchcancel', handleTouch);
            window.removeEventListener('keydown', preventScroll);
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
            className="game-canvas touch-none"
            tabIndex="0"
            style={{
                touchAction: 'none',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                width: '100%',
                height: '100%',
                display: 'block'
            }}
        />
    );
});

GameCanvas.displayName = 'GameCanvas';


export default GameCanvas;