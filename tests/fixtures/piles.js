// Aim from behind each mound. On Four corners the first two strokes skim part
// of each mound upward, leaving the rest for the lower rings.
export function pileStrokes(level) {
  return level.targets.map((target, index) => {
    const well = level.wells[index % level.wells.length];
    const distance = Math.hypot(target.x - well.x, target.y - well.y);
    const dx = (target.x - well.x) / distance;
    const dy = (target.y - well.y) / distance;
    const offset = level.id === 'four-corners' && index < 2 ? -7 : 0;
    return {
      a: { x: well.x - dx * 9 + offset, y: well.y - dy * 9 },
      b: { x: target.x - dx * 7 + offset, y: target.y - dy * 7 },
    };
  });
}
