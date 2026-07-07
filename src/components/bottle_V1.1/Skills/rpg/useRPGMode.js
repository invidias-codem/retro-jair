// useRPGMode.js
import { useEffect, useRef, useCallback } from 'react';
import { createInitialState, reducer, tick, ACTION } from './RPGEngine';

export const useRPGMode = ({ world, onEvent }) => {
  const stateRef = useRef(createInitialState());
  const frameRef = useRef(0);

  useEffect(() => {
    stateRef.current = createInitialState();
    frameRef.current = 0;
  }, [world?.id]);

  const send = useCallback((action) => {
    const next = reducer(stateRef.current, action, world);
    stateRef.current = next;
    frameRef.current = next.frame;

    if (next.result && onEvent) {
      onEvent(next.result);
      next.result = null;
    }
  }, [world, onEvent]);

  const tickFrame = useCallback(() => {
    stateRef.current = tick(stateRef.current, world);
  }, [world]);

  return {
    state: stateRef.current,
    send,
    tickFrame
  };
};
