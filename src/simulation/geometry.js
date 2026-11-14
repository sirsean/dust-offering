// Shared with the renderer so the interactive stone includes its visible rim.
export const stone = Object.freeze({
  x: 80,
  top: 6,
  bottom: 176,
  halfWidth: 79,
});

export function insideStone(x, y) {
  if (y < stone.top || y > stone.bottom) return false;
  return (
    Math.abs(x - stone.x) <=
    ((y - stone.top) * stone.halfWidth) / (stone.bottom - stone.top)
  );
}

export function editableStone(x, y) {
  return insideStone(x, y);
}

// Clip a swept contact against the three triangle half-planes, expanded by
// its radius. This lets a finger centred just outside still brush the edge.
export function touchesStone(a, b, radius = 0) {
  const slope = stone.halfWidth / (stone.bottom - stone.top);
  const sidePadding = radius * Math.hypot(1, slope);
  let enter = 0,
    exit = 1;
  for (const [nx, ny, limit] of [
    [0, 1, stone.bottom + radius],
    [1, -slope, stone.x - slope * stone.top + sidePadding],
    [-1, -slope, -stone.x - slope * stone.top + sidePadding],
  ]) {
    const distance = nx * a.x + ny * a.y - limit;
    const travel = nx * (b.x - a.x) + ny * (b.y - a.y);
    if (Math.abs(travel) < 1e-9) {
      if (distance > 0) return false;
      continue;
    }
    const t = -distance / travel;
    if (travel < 0) enter = Math.max(enter, t);
    else exit = Math.min(exit, t);
    if (enter > exit) return false;
  }
  return true;
}

export function stoneRoughness(x, y) {
  const cellX = Math.floor(x / 5);
  const cellY = Math.floor(y / 5);
  let hash =
    Math.imul(cellX + 19, 374761393) ^ Math.imul(cellY + 48, 668265263);
  hash = Math.imul(hash ^ (hash >>> 13), 1274126177);
  return 0.35 + (((hash ^ (hash >>> 16)) >>> 0) / 4294967296) * 1.3;
}

export function interpolate(a, b, spacing, visit) {
  const count = Math.max(
    1,
    Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / spacing),
  );
  for (let i = 1; i <= count; i++) {
    const t = i / count;
    visit({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
  }
}
