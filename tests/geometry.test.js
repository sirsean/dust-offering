import assert from 'node:assert/strict';
import test from 'node:test';
import { clipDisk, nearestPoint, Ridges } from '../src/simulation/geometry.js';
import { prototype } from '../src/config/prototype.js';

test('rubbing clips only affected pieces and leaves a physical opening between rounded caps', () => {
  const segment = { ax: 0, ay: 0, bx: 20, by: 0 };
  assert.deepEqual(clipDisk(segment, 10, 0, 3), [
    { ax: 0, ay: 0, bx: 7, by: 0 },
    { ax: 13, ay: 0, bx: 20, by: 0 },
  ]);
  assert.deepEqual(nearestPoint(25, 5, segment), { x: 20, y: 0 });
  const ridges = new Ridges(prototype);
  ridges.add({ x: 0, y: 0 }, { x: 20, y: 0 });
  ridges.rub(10, 0, 1.5);
  const left = Math.max(
    ...ridges.segments.filter((s) => s.bx < 10).map((s) => s.bx),
  );
  const right = Math.min(
    ...ridges.segments.filter((s) => s.ax > 10).map((s) => s.ax),
  );
  assert.equal(right - left - prototype.ridgeThickness, 3);
});
