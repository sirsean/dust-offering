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

// Routes from a touch playthrough. Later strokes pick up dust left on the way.
const bankedRoutes = {
  'first-pile': [
    [80.118, 58.8, 80.01, 135.0],
    [70.808, 83.768, 78.909, 135.086],
  ],
  'two-sides': [
    [87.583, 72.576, 45.211, 139.481],
    [45.612, 100.955, 111.561, 140.812],
    [36.681, 114.415, 111.008, 139.994],
    [53.679, 90.75, 112.569, 140.201],
    [30.608, 122.808, 110.258, 140.595],
  ],
  'three-islands': [
    [87.138, 106.197, 37.485, 147.228],
    [83.281, 138.434, 84.849, 65.105],
    [70.989, 142.789, 83.786, 65.724],
    [34.424, 130.113, 118.437, 154.897],
    [47.036, 146.521, 118.666, 156.051],
    [54.33, 128.182, 118.386, 154.15],
    [57.195, 117.109, 119.831, 150.692],
    [83.148, 64.979, 118.678, 149.485],
    [56, 149, 120, 150],
    [104, 155, 120, 155],
    [20, 141, 118, 151],
  ],
  'four-corners': [
    [56.012, 122.655, 78.937, 67.381],
    [104.01, 104.189, 84.407, 152.636],
    [70.496, 63.368, 39.524, 143.471],
    [75.189, 119.165, 108.403, 144.698],
    [81.241, 159.31, 109.395, 145.409],
    [97.142, 58.864, 43.242, 145.637],
    [71.505, 84.606, 40.267, 143.809],
  ],
};

export function bankedStrokes(level) {
  return bankedRoutes[level.id].map(([ax, ay, bx, by]) => ({
    a: { x: ax, y: ay },
    b: { x: bx, y: by },
  }));
}
