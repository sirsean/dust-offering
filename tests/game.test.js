import assert from 'node:assert/strict';
import test from 'node:test';
import { Game, scoreOffering } from '../src/game/game.js';
import { challenge } from '../src/config/challenge.js';
import { bestScore, saveBest } from '../src/game/storage.js';
import { challengeUrl, shareScore, shareText } from '../src/game/share.js';

test('new 960-grain challenge scores exact targets, single errors, underfill, overfill and total spill', () => {
  assert.equal(challenge.id, 'stone-offering-v6');
  for (const [left, right, expected] of [
    [360, 600, 1000],
    [359, 600, 998],
    [340, 600, 979],
    [180, 300, 500],
    [400, 560, 916],
    [0, 960, 250],
    [0, 0, 0],
  ])
    assert.equal(scoreOffering(left, right), expected);
});

test('optional challenge begins explicitly, supports pauses and slow rescue, then finishes and resets all piles', () => {
  const game = new Game('challenge');
  for (let i = 0; i < 120; i++) game.step();
  assert.equal(game.sim.remaining, 960);
  game.edit({ x: 80, y: 50 }, { x: 90, y: 140 });
  assert.equal(game.sim.grains.length, 0);
  game.begin();
  for (let i = 0; i < 120; i++) game.step();
  game.togglePour();
  const remaining = game.sim.remaining;
  for (let i = 0; i < 120; i++) game.step();
  assert.equal(game.sim.remaining, remaining);
  game.togglePour();
  for (let i = 0; i < 4800; i++) {
    if (i === 600 || i === 1200 || i === 1800)
      game.edit({ x: 80, y: 28 }, { x: 80, y: 65 });
    game.step();
    assert.equal(
      960,
      game.sim.remaining +
        game.sim.left +
        game.sim.right +
        game.sim.grains.length,
    );
  }
  assert.equal(game.sim.remaining, 0);
  assert.equal(game.canFinish, true);
  const result = game.finish();
  assert.equal(game.phase, 'finished');
  assert.equal(result.left + result.right + result.spill + result.onFace, 960);
  game.reset();
  assert.equal(game.phase, 'ready');
  assert.equal(game.sim.remaining, 960);
  assert.equal(game.sim.grains.length, 0);
  assert.equal(game.sim.spill, 0);
  game.reset('free');
  assert.equal(game.sim.pouring, true);
});

test('settled Finish eligibility is cleared by a brush, including a late rescue', () => {
  const game = new Game('challenge');
  game.begin();
  game.sim.remaining = 0;
  for (let i = 0; i < 59; i++) game.step();
  assert.equal(game.canFinish, false);
  game.step();
  assert.equal(game.canFinish, true);
  game.edit({ x: 80, y: 50 }, { x: 90, y: 80 });
  assert.equal(game.canFinish, false);
});

test('bests are isolated from the old physics, preserve ties and tolerate denied/corrupt storage', () => {
  const values = new Map();
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
  saveBest(storage, 'stone-offering-v5', 999);
  assert.equal(bestScore(storage, challenge.id), null);
  assert.deepEqual(saveBest(storage, challenge.id, 979), {
    best: 979,
    saved: true,
  });
  assert.equal(saveBest(storage, challenge.id, 500).best, 979);
  assert.equal(bestScore(storage, 'stone-offering-v5'), 999);
  const denied = {
    getItem() {
      throw Error();
    },
    setItem() {
      throw Error();
    },
  };
  assert.deepEqual(saveBest(denied, challenge.id, 700), {
    best: 700,
    saved: false,
  });
  values.set(`dust-offering:best:${challenge.id}`, 'garbage');
  assert.equal(bestScore(storage, challenge.id), null);
});

test('sharing uses the new challenge and handles native, cancellation, clipboard and manual copy', async () => {
  const result = { score: 979, left: 340, right: 600 };
  const base = 'https://dust-offering.sirsean.me/?debug#test';
  assert.equal(
    challengeUrl(base),
    'https://dust-offering.sirsean.me/?challenge=stone-offering-v6',
  );
  assert.match(shareText(result, base), /340 \/ 360/);
  assert.equal(
    (await shareScore(result, base, { share: async () => {} })).status,
    'shared',
  );
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
  assert.match(copied, /stone-offering-v6/);
  assert.equal(
    (
      await shareScore(result, base, {
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
