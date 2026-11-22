// Aim from behind a mound. Offsetting the path sideways takes part of the dust.
export function pileStroke(well, target, offset = 0) {
  const distance = Math.hypot(target.x - well.x, target.y - well.y);
  const dx = (target.x - well.x) / distance;
  const dy = (target.y - well.y) / distance;
  return {
    a: { x: well.x - dx * 11 - dy * offset, y: well.y - dy * 11 + dx * offset },
    b: {
      x: target.x - dx * 7 - dy * offset,
      y: target.y - dy * 7 + dx * offset,
    },
  };
}

export function pileStrokes(level) {
  const offsets =
    {
      'two-sides': [7, 0],
      'three-islands': [8.1, 7.8, 0],
      'four-corners': [6.5, 6.5, 0, 0],
    }[level.id] ?? [];
  return level.targets.map((target, index) =>
    pileStroke(level.wells[index % level.wells.length], target, offsets[index]),
  );
}
