// RPGWorld.js
/**
 * Data-driven world descriptor for the autobiography RPG shell.
 * Decouples map layout and triggers from engine code.
 */

export const createAutobiographyWorld = (chapters = []) => ({
  id: 'autobiography-world',
  label: 'Autobiography',
  cols: 12,
  rows: 10,
  viewCols: 10,
  viewRows: 8,
  spawn: { x: 1, y: 1 },
  tileset: 'retro-town',
  tiles: Array.from({ length: 12 * 10 }, () => ({ kind: 'floor', blocked: false })),
  entities: [
    // entrance / home tile
    { x: 1, y: 1, kind: 'chapter', id: 'HOME', title: 'HOME TILE', body: 'This is where your journey begins.', meta: { date: '00.00.0000', initialStatus: 'READY' } },
    ...chapters.map((chapter, index) => ({
      x: 2 + index,
      y: 3 + (index % 3),
      kind: 'chapter',
      id: chapter.id,
      title: chapter.title,
      body: chapter.content,
      meta: { date: chapter.date, initialStatus: chapter.initialStatus }
    }))
  ],
  skillZones: [
    { x: 4, y: 5, kind: 'skill', id: 'react-skill', title: 'React Encounter', body: 'You found React on the trail.', points: 3 },
    { x: 7, y: 6, kind: 'skill', id: 'python-skill', title: 'Python Encounter', body: 'A Python circles nearby.', points: 2 }
  ],
  isBlocked(x, y) {
    if (x < 0 || y < 0 || x >= this.cols || y >= this.rows) return true;
    return false;
  },
  resolveTrigger(x, y) {
    const entity = this.entities.find(item => item.x === x && item.y === y);
    if (entity) return entity;
    const skill = this.skillZones.find(item => item.x === x && item.y === y);
    if (skill) return skill;
    return null;
  }
});
