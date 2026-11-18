import { insideStone } from '../simulation/geometry.js';
import { seededRandom } from '../simulation/random.js';
import { upwelling } from '../config/upwelling.js';
import { createWells } from './wells.js';

export const goalTypes = Object.freeze({
  level: {
    label: 'Level',
    instruction: 'Spread a thin, even veil across the stone.',
    threshold: 0.7,
  },
  clear: {
    label: 'Clear',
    instruction: 'Uncover the marked patch. Keep the dust on the stone.',
    threshold: 0.9,
  },
  gather: {
    label: 'Piles',
    instruction: 'Gather the dust into the three marked islands.',
    threshold: 0.75,
  },
  paths: {
    label: 'Paths',
    instruction: 'Shape the dust into the marked paths. Leave the gaps clear.',
    threshold: 0.7,
  },
});

function segmentDistance(x, y, a, b) {
  const dx = b.x - a.x,
    dy = b.y - a.y;
  const t = Math.max(
    0,
    Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / (dx * dx + dy * dy)),
  );
  return Math.hypot(x - a.x - t * dx, y - a.y - t * dy);
}

export function createGoal(type = 'paths', seed = 48, config = upwelling) {
  if (!goalTypes[type]) throw Error(`Unknown goal: ${type}`);
  const random = seededRandom(seed ^ 0x23ba6e);
  const flip = random() < 0.5 ? -1 : 1;
  const map = (x, y) => ({ x: 80 + (x - 80) * flip, y });
  const shift = (random() - 0.5) * 12;
  const islands = [map(65, 104 + shift), map(48, 146), map(111, 145 - shift)];
  const wells = createWells({ ...config, seed });
  const markedWell = wells[1] ?? wells[0] ?? { x: 80, y: 120 };
  const half = ((markedWell.y - 6) * 79) / 170;
  const limit = Math.max(0, half - 25 * Math.hypot(1, 79 / 170) - 3);
  const patch = {
    x: Math.max(80 - limit, Math.min(80 + limit, markedWell.x)),
    y: markedWell.y,
  };
  const path = [
    map(80, 58),
    map(67 + shift, 96),
    map(104, 126),
    map(78 - shift, 156),
    map(42, 158),
  ];
  const cellSize = config.goalCellSize;
  const columns = Math.ceil(config.width / cellSize),
    rows = Math.ceil(config.height / cellSize);
  const cells = [];
  let weightSum = 0;
  for (let row = 0; row < rows; row++)
    for (let column = 0; column < columns; column++) {
      let area = 0,
        totalX = 0,
        totalY = 0;
      for (let sy = 0; sy < 4; sy++)
        for (let sx = 0; sx < 4; sx++) {
          const x = (column + (sx + 0.5) / 4) * cellSize,
            y = (row + (sy + 0.5) / 4) * cellSize;
          if (insideStone(x, y)) {
            area++;
            totalX += x;
            totalY += y;
          }
        }
      if (!area) continue;
      const x = totalX / area,
        y = totalY / area;
      let weight = 1;
      if (type === 'clear')
        weight = Math.hypot(x - patch.x, y - patch.y) > 25 ? 1 : 0;
      if (type === 'gather')
        weight = islands.reduce(
          (sum, p) => sum + Math.exp(-((x - p.x) ** 2 + (y - p.y) ** 2) / 100),
          0,
        );
      if (type === 'paths') {
        let distance = Infinity;
        for (let i = 1; i < path.length; i++)
          distance = Math.min(
            distance,
            segmentDistance(x, y, path[i - 1], path[i]),
          );
        weight = Math.exp(-((distance / 7) ** 2));
      }
      weight *= area / 16;
      const group = islands.findIndex(
        (p) => Math.hypot(x - p.x, y - p.y) <= 15,
      );
      cells.push({ x, y, index: row * columns + column, weight, group });
      weightSum += weight;
    }
  for (const cell of cells) cell.target = cell.weight / weightSum;
  const lookup = new Int32Array(columns * rows).fill(-1);
  cells.forEach((cell, index) => {
    lookup[cell.index] = index;
  });
  return {
    type,
    seed,
    ...goalTypes[type],
    cellSize,
    columns,
    rows,
    cells,
    lookup,
    islands,
    patch,
    path,
  };
}

export function distribution(sim, goal) {
  const counts = new Float64Array(goal.cells.length);
  let outside = 0;
  for (const grain of sim.grains) {
    const cell =
      Math.floor(grain.y / goal.cellSize) * goal.columns +
      Math.floor(grain.x / goal.cellSize);
    const index = goal.lookup[cell] ?? -1;
    if (!insideStone(grain.x, grain.y) || index < 0) outside++;
    else counts[index]++;
  }
  return { counts, outside };
}

export function evaluateGoal(sim, goal) {
  const { counts, outside } = distribution(sim, goal);
  if (!sim.emitted) return { fit: 0, outside: 0, complete: false };
  // Include material still underground so a new well cannot lower the score
  // merely by increasing its denominator. Empty space/off-stone dust cannot win.
  const total = sim.config.supply || sim.emitted;
  let fit = scoreCounts(counts, goal, total);
  // Visible circular zones use exact grain positions, rather than asking the
  // player to discover invisible ten-unit scoring-cell boundaries at their rims.
  if (goal.type === 'gather') {
    const groups = [0, 0, 0];
    for (const grain of sim.grains) {
      if (!insideStone(grain.x, grain.y)) continue;
      const group = goal.islands.findIndex(
        (p) => (p.x - grain.x) ** 2 + (p.y - grain.y) ** 2 <= 225,
      );
      if (group >= 0) groups[group]++;
    }
    fit = groups.reduce(
      (sum, count) => sum + Math.min(1 / 3, count / total),
      0,
    );
  } else if (goal.type === 'clear') {
    fit =
      sim.grains.filter(
        (g) =>
          insideStone(g.x, g.y) &&
          (g.x - goal.patch.x) ** 2 + (g.y - goal.patch.y) ** 2 >= 625,
      ).length / total;
  }
  return {
    fit,
    outside,
    complete: sim.remaining === 0 && fit >= goal.threshold,
  };
}

export function scoreCounts(counts, goal, total) {
  if (!total) return 0;
  if (goal.type === 'gather') {
    const groups = [0, 0, 0];
    for (let i = 0; i < counts.length; i++)
      if (goal.cells[i].group >= 0) groups[goal.cells[i].group] += counts[i];
    return groups.reduce(
      (sum, count) => sum + Math.min(1 / 3, count / total),
      0,
    );
  }
  let fit = 0;
  for (let i = 0; i < counts.length; i++)
    fit +=
      goal.type === 'clear'
        ? goal.cells[i].weight > 0
          ? counts[i] / total
          : 0
        : Math.min(counts[i] / total, goal.cells[i].target);
  return Math.min(1, fit);
}
