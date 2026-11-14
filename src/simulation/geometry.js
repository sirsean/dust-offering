export function insideStone(x, y) {
  if (y < 8 || y > 174) return false;
  return Math.abs(x - 80) <= ((y - 8) * 76) / 166;
}

export function editableStone(x, y) {
  return y >= 26 && y <= 169 && insideStone(x, y);
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
