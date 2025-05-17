// GameCanvas.js
import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle, useCallback } from 'react';
import { GameState } from './gameLogic'; // Make sure './gameLogic.js' is the correct path

export const GameCanvas = forwardRef(({ onStateChange, gameState, difficultyLevel }, ref) => {
    const canvasRef = useRef(null);
    const gameStateRef = useRef(null);
    const animationFrameRef = useRef(null);
    const lastTimeRef = useRef(0);

    // New state to track if the game instance is ready for event listeners
    const [gameInstanceReady, setGameInstanceReady] = useState(false);

    // Function to perform canvas resizing
    const performResize = useCallback(() => {
        if (!canvasRef.current) {
            console.warn("performResize: canvasRef is not current.");
            return;
        }
        const canvas = canvasRef.current;
        const container = canvas.parentElement;
        if (container) {
            if (container.clientWidth > 0 && container.clientHeight > 0) {
                canvas.width = container.clientWidth;
                canvas.height = container.clientHeight;
                console.log(`GameCanvas: Canvas resized to: ${canvas.width}x${canvas.height}`);
            } else {
                console.warn("GameCanvas: Canvas container has zero dimensions. Canvas not resized using container.");
            }
        } else {
            console.warn("GameCanvas: Canvas container not found for resizing.");
        }
        if (gameStateRef.current?.handleCanvasResize) {
            gameStateRef.current.handleCanvasResize(canvas);
        }
    }, []);

    // Game loop logic
    const gameLoop = useCallback((timestamp) => {
        if (!gameStateRef.current || gameState !== 'playing') {
            console.log("GameCanvas: gameLoop - gameStateRef is null or game not in 'playing' state. Stopping loop.");
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
            setGameInstanceReady(false); // Ensure ready state is false if loop stops unexpectedly
            return;
        }

        if (!lastTimeRef.current) {
            lastTimeRef.current = timestamp;
            animationFrameRef.current = requestAnimationFrame(gameLoop);
            return;
        }

        const deltaTime = (timestamp - lastTimeRef.current) / 1000;
        lastTimeRef.current = timestamp;
        const cappedDeltaTime = Math.min(deltaTime, 0.1);
        if (deltaTime > 0.1) {
            console.warn(`Large deltaTime detected: ${deltaTime.toFixed(3)}s. Capped to ${cappedDeltaTime.toFixed(3)}s.`);
        }

        try {
            const { gameOver, won, score } = gameStateRef.current.update(cappedDeltaTime);
            gameStateRef.current.draw();
            if (onStateChange) onStateChange({ gameOver, won, score });
            if (!gameOver && !won) {
                animationFrameRef.current = requestAnimationFrame(gameLoop);
            } else {
                console.log("GameCanvas: Game over or won. Loop will stop.");
                if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
                setGameInstanceReady(false); // Game instance no longer "active" for inputs
            }
        } catch (error) {
            console.error("Error in game loop (update/draw):", error);
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
            setGameInstanceReady(false);
        }
    }, [onStateChange, gameState]);

    // Function to start/initialize the game instance and loop
    const startGameInstance = useCallback(() => {
        if (!canvasRef.current) {
            console.error("GameCanvas: startGameInstance - Canvas ref not available.");
            setGameInstanceReady(false);
            return;
        }
        if (gameStateRef.current) {
            console.warn("GameCanvas: startGameInstance - GameState already exists. Aborting duplicate start.");
            // If it exists but not ready, mark as ready. If loop not running, start it.
            if (!gameInstanceReady) setGameInstanceReady(true);
            if (!animationFrameRef.current && gameState === 'playing') {
                 console.log("GameCanvas: Restarting animation frame in startGameInstance for existing instance.");
                 lastTimeRef.current = 0; // Reset time
                 animationFrameRef.current = requestAnimationFrame(gameLoop);
            }
            return;
        }
        console.log(`GameCanvas: Initializing GameState with difficulty: ${difficultyLevel}`);
        performResize();
        try {
            gameStateRef.current = new GameState(canvasRef.current, difficultyLevel);
            lastTimeRef.current = 0;
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            console.log("GameCanvas: Starting game loop animation.");
            animationFrameRef.current = requestAnimationFrame(gameLoop);
            setGameInstanceReady(true); // Mark instance as ready
        } catch (error) {
            console.error("GameCanvas: Error initializing GameState:", error);
            gameStateRef.current = null;
            setGameInstanceReady(false);
        }
    }, [difficultyLevel, performResize, gameLoop, gameState, gameInstanceReady]); // Added gameState and gameInstanceReady

    // Expose methods to parent component (Skills.js)
    useImperativeHandle(ref, () => ({
        resetGame: (newDifficultyLevel) => {
            console.log(`GameCanvas: resetGame called via ref with difficulty: ${newDifficultyLevel}`);
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }
            setGameInstanceReady(false); // Mark as not ready during reset
            gameStateRef.current = null;

            if (canvasRef.current) {
                performResize();
                try {
                    gameStateRef.current = new GameState(canvasRef.current, newDifficultyLevel);
                    lastTimeRef.current = 0;
                    console.log("GameCanvas: Starting game loop animation from resetGame.");
                    animationFrameRef.current = requestAnimationFrame(gameLoop);
                    setGameInstanceReady(true); // Mark as ready after successful reset
                } catch (error) {
                    console.error("GameCanvas: Error resetting GameState:", error);
                    gameStateRef.current = null;
                    setGameInstanceReady(false);
                }
            } else {
                console.error("GameCanvas: resetGame - Canvas ref not available.");
                setGameInstanceReady(false);
            }
        },
        handleResize: performResize
    }));

    // Effect for managing the game lifecycle based on gameState prop
    useEffect(() => {
        console.log(`GameCanvas: useEffect for gameState change. Current gameState: ${gameState}`);
        if (gameState === 'playing') {
            // If transitioning to 'playing', and no instance yet, start the game instance
            if (!gameStateRef.current) {
                 const startTimeout = setTimeout(() => {
                    if (canvasRef.current && !gameStateRef.current) { // Double check before starting
                        startGameInstance();
                    }
                 }, 0);
                 return () => clearTimeout(startTimeout);
            } else if (!gameInstanceReady) {
                // Instance exists but wasn't marked ready, or loop stopped. Try to make ready.
                setGameInstanceReady(true);
                if (!animationFrameRef.current) { // If loop isn't running, restart it
                    console.log("GameCanvas: gameState 'playing', instance exists but loop wasn't running. Restarting loop.");
                    lastTimeRef.current = 0;
                    animationFrameRef.current = requestAnimationFrame(gameLoop);
                }
            }
        } else {
            // If gameState is NOT 'playing' (e.g., 'idle', 'won', 'lost'), ensure cleanup
            console.log(`GameCanvas: useEffect - gameState is '${gameState}'. Cleaning up game instance.`);
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }
            if (gameStateRef.current?.cleanup) {
                 gameStateRef.current.cleanup();
            }
            gameStateRef.current = null;
            lastTimeRef.current = 0;
            setGameInstanceReady(false); // Mark as not ready
        }
    }, [gameState, startGameInstance, gameLoop, gameInstanceReady]); // Added gameLoop and gameInstanceReady

    // Effect for initial canvas setup and window resize listening
    useEffect(() => {
        if (canvasRef.current) {
            performResize();
        }
        window.addEventListener('resize', performResize);
        return () => {
            window.removeEventListener('resize', performResize);
        };
    }, [performResize]);

    // Effect for game input event listeners
    // This is the hook that had the warning (line 227 in the previous full file context)
    useEffect(() => {
        const canvas = canvasRef.current;
        // Only add listeners if the game instance is ready and canvas exists
        if (!gameInstanceReady || !canvas) {
            // Ensure cleanup if listeners were attached and gameInstanceReady became false
            return;
        }
        console.log("GameCanvas: Attaching input event listeners (gameInstanceReady is true).");

        // Capture the current game instance for use in handlers,
        // preventing issues if gameStateRef.current is reassigned during an event.
        const currentGameInstance = gameStateRef.current;
        if (!currentGameInstance) { // Should not happen if gameInstanceReady is true
             console.error("GameCanvas: gameInstanceReady true, but gameStateRef.current is null in input listener setup.");
             return;
        }


        const handleTouch = (event) => {
            // Use currentGameInstance captured at the time of listener attachment
            switch (event.type) {
                case 'touchstart': currentGameInstance.handleTouchStart?.(event); break;
                case 'touchmove': currentGameInstance.handleTouchMove?.(event); break;
                case 'touchend': case 'touchcancel': currentGameInstance.handleTouchEnd?.(event); break;
                default: console.warn(`Unexpected touch event: ${event.type}`);
            }
        };
        const handleKeyDown = (e) => currentGameInstance.handleKeyDown?.(e.key);
        const handleKeyUp = (e) => currentGameInstance.handleKeyUp?.(e.key);
        const preventDefaultKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '];
        const preventScroll = (e) => {
            if (preventDefaultKeys.includes(e.key)) e.preventDefault();
        };

        canvas.addEventListener('touchstart', handleTouch, { passive: false });
        canvas.addEventListener('touchmove', handleTouch, { passive: false });
        canvas.addEventListener('touchend', handleTouch, { passive: false });
        canvas.addEventListener('touchcancel', handleTouch, { passive: false });
        window.addEventListener('keydown', preventScroll, false);
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            console.log("GameCanvas: Cleaning up input event listeners (due to gameInstanceReady change or unmount).");
            canvas.removeEventListener('touchstart', handleTouch);
            canvas.removeEventListener('touchmove', handleTouch);
            canvas.removeEventListener('touchend', handleTouch);
            canvas.removeEventListener('touchcancel', handleTouch);
            window.removeEventListener('keydown', preventScroll);
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
        // This effect now correctly depends on 'gameInstanceReady'.
        // 'canvasRef.current' is stable, so not needed, but including canvas (the DOM element)
        // might be good if it could somehow be replaced (though not typical for a single canvas).
        // For simplicity and directness, gameInstanceReady is the key trigger.
    }, [gameInstanceReady]); // Only 'gameInstanceReady'. canvasRef is stable.

    console.log(`GameCanvas: Rendering component. gameState: ${gameState}, gameInstanceReady: ${gameInstanceReady}`);
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
                display: 'block',
            }}
        />
    );
});

GameCanvas.displayName = 'GameCanvas';
export default GameCanvas;