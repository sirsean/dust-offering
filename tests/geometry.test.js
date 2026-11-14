import assert from 'node:assert/strict';
import test from 'node:test';
import {
  editableStone,
  insideStone,
  interpolate,
  stoneRoughness,
} from '../src/simulation/geometry.js';

test('only the actual stone face is editable, protecting the source and bowls', () => {
  assert.equal(insideStone(80, 8), true);
  assert.equal(insideStone(10, 30), false);
  assert.equal(editableStone(80, 14), false);
  assert.equal(editableStone(80, 50), true);
  assert.equal(editableStone(40, 181), false);
  assert.equal(editableStone(20, 70), false);
  assert.equal(stoneRoughness(80, 100), stoneRoughness(80, 100));
  assert.notEqual(stoneRoughness(80, 100), stoneRoughness(90, 100));
});

test('a fast stroke is sampled continuously along its full path', () => {
  const points = [{ x: 50, y: 60 }];
  interpolate(points[0], { x: 110, y: 150 }, 2, (p) => points.push(p));
  assert.deepEqual(points.at(-1), { x: 110, y: 150 });
  for (let i = 1; i < points.length; i++)
    assert.ok(
      Math.hypot(
        points[i].x - points[i - 1].x,
        points[i].y - points[i - 1].y,
      ) <= 2.000001,
    );
});
