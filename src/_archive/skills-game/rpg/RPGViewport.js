// RPGViewport.js
import React, { useEffect, useRef } from 'react';
import { useRPGMode } from './useRPGMode';
import { createAutobiographyWorld } from './RPGWorld';
import { ACTION } from './RPGEngine';
import journalLogs from '../../TermJourn/journalLogs';
import './RPGViewport.css';

const TILE_RENDERERS = {
  floor: () => ' . ',
  water: () => ' ~ ',
  tree: () => ' T '
};

const toRenderTile = (world, x, y, player, entities) => {
  if (player.x === x && player.y === y) return { symbol: ' @ ', className: 'rpg-tile player' };
  const entity = entities.find(e => e.x === x && e.y === y);
  if (entity) {
    const symbol = entity.kind === 'chapter' ? ' ◆ ' : entity.kind === 'skill' ? ' ♦ ' : ' ? ';
    return { symbol, className: `rpg-tile ${entity.kind}` };
  }
  return { symbol: ' . ', className: 'rpg-tile floor' };
};

const buildGridView = (world, camera, player) => {
  const rows = [];
  const viewRows = world.viewRows || world.rows;
  const viewCols = world.viewCols || world.cols;
  for (let row = 0; row < viewRows; row++) {
    const worldY = camera.y + row;
    const cells = [];
    for (let col = 0; col < viewCols; col++) {
      const worldX = camera.x + col;
      if (worldX < 0 || worldY < 0 || worldX >= world.cols || worldY >= world.rows) {
        cells.push({ symbol: '   ', className: 'rpg-tile void' });
      } else {
        cells.push(toRenderTile(world, worldX, worldY, player, world.entities));
      }
    }
    rows.push(cells);
  }
  return rows;
};

const RPGViewport = () => {
  const world = React.useMemo(() => createAutobiographyWorld(journalLogs), []);
  const { state, send, tickFrame } = useRPGMode({
    world,
    onEvent: (event) => {
      if (event?.kind === 'chapter-opened') {
        console.log('RPG chapter opened', event.id);
      }
    }
  });

  const grid = buildGridView(world, state.camera || { x: 0, y: 0 }, state.player);
  const dialog = state.dialog;
  const selectedTrigger = state.pendingTrigger;

  useEffect(() => {
    const onKeyDown = (event) => {
      const key = event.key.toLowerCase();
      if (key === 'arrowup' || key === 'w') send({ type: ACTION.MOVE_NORTH });
      else if (key === 'arrowdown' || key === 's') send({ type: ACTION.MOVE_SOUTH });
      else if (key === 'arrowright' || key === 'd') send({ type: ACTION.MOVE_EAST });
      else if (key === 'arrowleft' || key === 'a') send({ type: ACTION.MOVE_WEST });
      else if (key === 'enter' || key === 'e') send({ type: ACTION.INTERACT });
      else if (key === 'g') send({ type: ACTION.TOGGLE_MODE });
      tickFrame();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [send, tickFrame]);

  return (
    <div className="rpg-shell">
      <div className="rpg-viewport">
        <div className="rpg-grid" role="region" aria-label="RPG map">
          {grid.map((row, rIdx) => (
            <div className="rpg-row" key={rIdx}>
              {row.map((cell, cIdx) => (
                <div className={cell.className} key={`${rIdx}-${cIdx}`}>{cell.symbol}</div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {dialog && (
        <div className="rpg-dialog">
          <div className="rpg-dialog-title">{dialog.title}</div>
          <div className="rpg-dialog-body">{dialog.body}</div>
          <div className="rpg-dialog-footer">{dialog.meta?.date ?? ''}</div>
          <button className="rpg-dialog-button" onClick={() => send({ type: ACTION.INTERACT })}>
            Press Enter
          </button>
        </div>
      )}
      {selectedTrigger && !dialog && (
        <div className="rpg-prompt">Press Enter to interact</div>
      )}
      <div className="rpg-hud">
        <span>POS: {state.player.x},{state.player.y}</span>
        <span>MODE: {state.mode.toUpperCase()}</span>
        <span>G: MINIGAME</span>
      </div>
    </div>
  );
};

export default RPGViewport;
