import assert from 'node:assert/strict';
import test from 'node:test';
import { Game, scoreOffering } from '../src/game/game.js';
import { bestScore, saveBest } from '../src/game/storage.js';
import { challengeUrl, shareScore, shareText } from '../src/game/share.js';

test('score uses exact integer errors with no time term', () => {
  for (const [left, right, expected] of [
    [1800, 3000, 1000],
    [1799, 3000, 999],
    [1700, 3000, 979],
    [900, 1500, 500],
    [2000, 2800, 916],
    [0, 4800, 250],
    [0, 0, 0],
  ])
    assert.equal(scoreOffering(left, right), expected);
});

test('challenge allows pre-drawing, explicit Begin, pause, exhaustion, rescue edits, Finish and Reset', () => {
  const game = new Game('challenge');
  for (let i = 0; i < 120; i++) game.step();
  assert.equal(game.sim.remaining, 4800);
  assert.equal(game.finish(), null);
  game.edit({ x: 50, y: 70 }, { x: 110, y: 155 }, 'draw');
  assert.ok(game.sim.ridges.segments.length > 0);
  game.begin();
  game.step();
  game.togglePour();
  const remaining = game.sim.remaining;
  for (let i = 0; i < 60; i++) game.step();
  assert.equal(game.sim.remaining, remaining);
  game.togglePour();
  for (let i = 0; i < 2399; i++) game.step();
  assert.equal(game.sim.remaining, 0);
  game.edit({ x: 80, y: 100 }, { x: 80, y: 100 }, 'rub');
  assert.equal(game.canFinish, false);
  for (let i = 0; i < 300; i++) game.step();
  assert.equal(game.canFinish, true);
  const result = game.finish();
  assert.equal(game.phase, 'finished');
  assert.equal(4800, result.left + result.right + result.spill + result.onFace);
  game.reset();
  assert.equal(game.phase, 'ready');
  assert.equal(game.sim.remaining, 4800);
  assert.equal(game.sim.grains.length, 0);
  assert.equal(game.sim.ridges.segments.length, 0);
  game.reset('free');
  assert.equal(game.sim.pouring, true);
});

test('Finish enables after one quiet second or the five-second fallback, and edits reset eligibility', () => {
  const game = new Game('challenge');
  game.begin();
  game.sim.remaining = 0;
  game.sim.config.sourceRate = 0;
  for (let i = 0; i < 59; i++) game.step();
  assert.equal(game.canFinish, false);
  game.step();
  assert.equal(game.canFinish, true);
  game.edit({ x: 20, y: 60 }, { x: 30, y: 70 }, 'draw');
  assert.equal(game.canFinish, false);
  for (let i = 0; i < 300; i++) {
    game.sim.grains = [{ id: 0, x: 80, y: 50, px: 80, py: 50, vx: 0, vy: 20 }];
    game.step();
  }
  assert.equal(game.canFinish, true);
});

test('bests are scoped to challenge id, preserve ties, and tolerate denied or corrupt storage', () => {
  const values = new Map();
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
  assert.equal(bestScore(storage, 'a'), null);
  assert.deepEqual(saveBest(storage, 'a', 979), { best: 979, saved: true });
  assert.equal(saveBest(storage, 'a', 500).best, 979);
  assert.equal(bestScore(storage, 'b'), null);
  assert.equal(saveBest(storage, 'a', 979).best, 979);
  const denied = {
    getItem() {
      throw Error();
    },
    setItem() {
      throw Error();
    },
  };
  assert.deepEqual(saveBest(denied, 'a', 700), { best: 700, saved: false });
  values.set('dust-offering:best:a', 'garbage');
  assert.equal(bestScore(storage, 'a'), null);
});

test('score sharing opens the exact challenge and handles native, copy, cancellation and manual fallback', async () => {
  const result = { score: 979, left: 1700, right: 3000 };
  const base = 'https://dust-offering.sirsean.me/?debug#test';
  assert.equal(
    challengeUrl(base),
    'https://dust-offering.sirsean.me/?challenge=first-offering-v2',
  );
  assert.match(shareText(result, base), /1,700 \/ 1,800/);
  assert.equal(
    (await shareScore(result, base, { share: async () => {} })).status,
    'shared',
  );
  let copied;
  assert.equal(
    (
      await shareScore(result, base, {
        clipboard: {
          writeText: async (text) => {
            copied = text;
          },
        },
      })
    ).status,
    'copied',
  );
  assert.match(copied, /979\/1000/);
  assert.equal(
    (
      await shareScore(result, base, {
        share: async () => {
          throw Object.assign(Error(), { name: 'AbortError' });
        },
      })
    ).status,
    'cancelled',
  );
  assert.equal(
    (
      await shareScore(result, base, {
        share: async () => {
          throw Error();
        },
        clipboard: {
          writeText: async () => {
            throw Error();
          },
        },
      })
    ).status,
    'manual',
  );
});
