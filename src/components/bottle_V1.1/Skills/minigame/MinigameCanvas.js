// MinigameCanvas.js
import React, { useRef, useEffect, forwardRef, useImperativeHandle, useCallback } from 'react';
import { GameState } from '../gameLogic';

const MinigameCanvas = forwardRef(({ difficultyLevel, onEnd, onScore, muted = false }, ref) => {
  const canvasRef = useRef(null);
  const loopRef = useRef(null);
  const instanceRef = useRef(null);
  const lastTimeRef = useRef(0);
  const resizeObserverRef = useRef(null);

  const stopLoop = useCallback(() => {
    if (loopRef.current) {
      cancelAnimationFrame(loopRef.current);
      loopRef.current = null;
    }
  }, []);

  const teardown = useCallback((instance) => {
    stopLoop();
    if (instance?.cleanup) {
      try {
        instance.cleanup();
      } catch (error) {
        console.warn('MinigameCanvas cleanup failed:', error);
      }
    }
    instanceRef.current = null;
  }, []);

  const initializeInstance = useCallback((canvas, level) => {
    if (!canvas) return null;
    const instance = new GameState(canvas, level);
    instanceRef.current = instance;
    return instance;
  }, []);

  const startLoop = useCallback((instance) => {
    stopLoop();
    lastTimeRef.current = 0;
    const loop = (timestamp) => {
      if (!instanceRef.current) return;
      if (!lastTimeRef.current) {
        lastTimeRef.current = timestamp;
        loopRef.current = requestAnimationFrame(loop);
        return;
      }
      const rawDelta = (timestamp - lastTimeRef.current) / 1000;
      const deltaTime = Math.min(rawDelta, 0.1);
      lastTimeRef.current = timestamp;
      try {
        const { gameOver, won, score } = instanceRef.current.update(deltaTime);
        instanceRef.current.draw();
        if (onScore) onScore(score);
        if (gameOver) {
          teardown(instanceRef.current);
          onEnd?.({ kind: 'lost', score });
        } else if (won) {
          teardown(instanceRef.current);
          onEnd?.({ kind: 'won', score });
        } else {
          loopRef.current = requestAnimationFrame(loop);
        }
      } catch (error) {
        console.error('Minigame loop failed:', error);
        stopLoop();
        onEnd?.({ kind: 'errored', score: 0, error });
      }
    };
    loopRef.current = requestAnimationFrame(loop);
  }, [onEnd, onScore, stopLoop, teardown]);

  useImperativeHandle(ref, () => ({
    reset(level = difficultyLevel) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const parent = canvas.parentElement;
      if (parent && parent.clientWidth > 0 && parent.clientHeight > 0) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
      teardown(instanceRef.current);
      const instance = initializeInstance(canvas, level);
      if (instance) startLoop(instance);
    },
    stop() {
      teardown(instanceRef.current);
    }
  }), [difficultyLevel, initializeInstance, startLoop, teardown]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
    }

    const fitCanvas = () => {
      if (!canvas) return;
      const parent = canvas.parentElement;
      if (!parent) return;
      const { clientWidth, clientHeight } = parent;
      if (clientWidth > 0 && clientHeight > 0) {
        canvas.width = clientWidth;
        canvas.height = clientHeight;
        if (instanceRef.current) {
          instanceRef.current.handleCanvasResize(canvas);
        }
      }
    };

    fitCanvas();
    resizeObserverRef.current = new ResizeObserver(() => fitCanvas());
    resizeObserverRef.current.observe(canvas.parentElement || canvas);
    window.addEventListener('resize', fitCanvas);

    const start = setTimeout(() => {
      const instance = initializeInstance(canvas, difficultyLevel);
      if (instance) startLoop(instance);
    }, 0);

    return () => {
      clearTimeout(start);
      stopLoop();
      window.removeEventListener('resize', fitCanvas);
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
      teardown(instanceRef.current);
    };
  }, [difficultyLevel, initializeInstance, startLoop, stopLoop, teardown]);

  useEffect(() => {
    if (instanceRef.current?.mute !== undefined) {
      instanceRef.current.mute = muted;
    }
  }, [muted]);

  return (
    <canvas
      ref={canvasRef}
      className="game-canvas touch-none"
      tabIndex={0}
      style={{ touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none', width: '100%', height: '100%', display: 'block' }}
    />
  );
});

MinigameCanvas.displayName = 'MinigameCanvas';
export default MinigameCanvas;
