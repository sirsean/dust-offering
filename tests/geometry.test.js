import assert from 'node:assert/strict';
import test from 'node:test';
import {
  editableStone,
  insideStone,
  interpolate,
  stoneRoughness,
  touchesStone,
} from '../src/simulation/geometry.js';

test('the whole visible triangle is editable, including the tip and bottom rim, but bowls are outside', () => {
  assert.equal(insideStone(80, 8), true);
  assert.equal(insideStone(10, 30), false);
  for (const [x, y] of [
    [80, 6],
    [80, 14],
    [80, 175.9],
    [1, 176],
    [159, 176],
  ])
    assert.equal(editableStone(x, y), true);
  assert.equal(editableStone(80, 176.1), false);
  assert.equal(editableStone(80, 50), true);
  assert.equal(editableStone(40, 181), false);
  assert.equal(editableStone(20, 70), false);
  assert.equal(stoneRoughness(80, 100), stoneRoughness(80, 100));
  assert.notEqual(stoneRoughness(80, 100), stoneRoughness(90, 100));
});

test('swept finger contacts reach every edge even when their centre or final sample leaves the stone', () => {
  assert.ok(touchesStone({ x: 80, y: 160 }, { x: 80, y: 190 }, 4));
  assert.ok(touchesStone({ x: 80, y: 178 }, { x: 80, y: 178 }, 4));
  assert.ok(touchesStone({ x: 0, y: 100 }, { x: 160, y: 100 }, 4));
  assert.equal(touchesStone({ x: 40, y: 181 }, { x: 60, y: 181 }, 4), false);
  assert.equal(touchesStone({ x: 10, y: 20 }, { x: 30, y: 20 }, 4), false);
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
