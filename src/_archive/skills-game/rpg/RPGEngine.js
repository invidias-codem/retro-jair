// RPGEngine.js
/**
 * Stateless RPG engine for portfolio autobiography exploration.
 * Keeps game concerns separate from portfolio data by accepting
 * a world descriptor and an input stream, returning discrete events.
 */

export const ACTION = {
  MOVE_NORTH: 'MOVE_NORTH',
  MOVE_SOUTH: 'MOVE_SOUTH',
  MOVE_EAST: 'MOVE_EAST',
  MOVE_WEST: 'MOVE_WEST',
  INTERACT: 'INTERACT',
  TOGGLE_MODE: 'TOGGLE_MODE',
  RESET: 'RESET'
};

const DEFAULT_STATE = {
  mode: 'explore', // 'explore' | 'dialog' | 'minigame'
  player: { x: 0, y: 0, direction: 'south', moving: false },
  camera: { x: 0, y: 0 },
  inventory: [],
  dialog: null,
  pendingTrigger: null,
  result: null,
  frame: 0
};

export const createInitialState = () => ({
  ...DEFAULT_STATE,
  player: { ...DEFAULT_STATE.player },
  camera: { ...DEFAULT_STATE.camera }
});

export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const stepCount = 1;

const tryMove = (player, world, dx, dy) => {
  const nextX = player.x + dx;
  const nextY = player.y + dy;
  if (world.isBlocked(nextX, nextY)) return player;
  return { ...player, x: nextX, y: nextY, moving: true };
};

const centerCameraOnPlayer = (player, camera, world) => {
  const viewCols = world.viewCols || 10;
  const viewRows = world.viewRows || 10;
  const halfCols = Math.floor(viewCols / 2);
  const halfRows = Math.floor(viewRows / 2);
  const camX = clamp(player.x - halfCols, 0, Math.max(0, world.cols - viewCols));
  const camY = clamp(player.y - halfRows, 0, Math.max(0, world.rows - viewRows));
  return { x: camX, y: camY };
};

export const evaluateTriggers = (state, world, previousPlayer) => {
  if (state.mode !== 'explore') return null;
  const trigger = world.resolveTrigger(state.player.x, state.player.y);
  if (!trigger) return null;
  if (trigger.onEnter && previousPlayer.x === state.player.x && previousPlayer.y === state.player.y) {
    return null;
  }
  return trigger;
};

export const reducer = (state, action, world) => {
  const current = state || createInitialState();

  if (action.type === ACTION.RESET) {
    return { ...createInitialState(), frame: current.frame + 1 };
  }

  if (action.type === ACTION.TOGGLE_MODE) {
    return {
      ...current,
      mode: current.mode === 'explore' ? 'minigame' : 'explore',
      dialog: null,
      pendingTrigger: null,
      result: null,
      frame: current.frame + 1
    };
  }

  if (current.mode === 'dialog') {
    if (action.type === ACTION.INTERACT) {
      const nextDialog = current.dialog?.next;
      if (nextDialog) {
        return { ...current, dialog: nextDialog, pendingTrigger: null, frame: current.frame + 1 };
      }
      return { ...current, dialog: null, pendingTrigger: null, frame: current.frame + 1 };
    }
    return current;
  }

  if (current.mode === 'minigame') {
    // Mini-game mode is owned by Skills.js; ignore movement here.
    return current;
  }

  const updatedState = { ...current, frame: current.frame + 1 };
  let nextPlayer = { ...current.player };

  if (action.type === ACTION.MOVE_NORTH) nextPlayer = tryMove(current.player, world, 0, -stepCount);
  else if (action.type === ACTION.MOVE_SOUTH) nextPlayer = tryMove(current.player, world, 0, stepCount);
  else if (action.type === ACTION.MOVE_EAST) nextPlayer = tryMove(current.player, world, stepCount, 0);
  else if (action.type === ACTION.MOVE_WEST) nextPlayer = tryMove(current.player, world, -stepCount, 0);
  else if (action.type === ACTION.INTERACT) {
    const trigger = world.resolveTrigger(current.player.x, current.player.y);
    if (trigger) {
      if (trigger.kind === 'chapter') {
        updatedState.mode = 'dialog';
        updatedState.dialog = {
          title: trigger.title || trigger.id,
          body: trigger.body,
          meta: trigger.meta,
          next: null
        };
        updatedState.result = { kind: 'chapter-opened', id: trigger.id };
        return updatedState;
      }
      if (trigger.kind === 'skill') {
        updatedState.result = { kind: 'skill-encounter', id: trigger.id };
        updatedState.pendingTrigger = trigger;
      }
    }
    return updatedState;
  } else {
    return current;
  }

  updatedState.player = nextPlayer;
  updatedState.camera = centerCameraOnPlayer(nextPlayer, current.camera, world);

  const trigger = evaluateTriggers(updatedState, world, current.player);
  if (trigger) {
    if (trigger.kind === 'chapter') {
      updatedState.mode = 'dialog';
      updatedState.dialog = {
        title: trigger.title || trigger.id,
        body: trigger.body,
        meta: trigger.meta,
        next: null
      };
      updatedState.result = { kind: 'chapter-opened', id: trigger.id };
      return updatedState;
    }
    if (trigger.kind === 'skill') {
      updatedState.result = { kind: 'skill-encounter', id: trigger.id };
      updatedState.pendingTrigger = trigger;
    }
  }

  return updatedState;
};

export const tick = (state, world) => {
  if (!state) return state;
  return { ...state, player: { ...state.player, moving: false } };
};
