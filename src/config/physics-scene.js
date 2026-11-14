// Reproducible local sensors, independent of bowl placement. The ramp runs
// from (30, 70) to (135, 108.22), twenty degrees below horizontal.
export const physicsScene = Object.freeze({
  seeds: [48, 2026, 914],
  widths: [3, 6, 9],
  warmupSteps: 300,
  sampleSteps: 600,
  sourceX: 43,
  sourceY: 42,
  rampStart: { x: 30, y: 70 },
  rampEnd: { x: 135, y: 70 + 105 * Math.tan(Math.PI / 9) },
  cutX: 85,
  catch: Object.freeze({
    start: { x: 50, y: 80 },
    end: { x: 110, y: 80 },
    cut: { x: 80, y: 80, radius: 6 },
    pourSteps: 240,
    settleSteps: 120,
  }),
});
