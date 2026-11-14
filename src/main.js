import './styles.css';
import { Game } from './game/game.js';
import { challenge } from './config/challenge.js';
import {
  bestScore,
  readStored,
  saveBest,
  writeStored,
} from './game/storage.js';
import { shareScore } from './game/share.js';
import { Renderer } from './rendering/renderer.js';
import { BowlAudio } from './rendering/audio.js';
import { bindPointer } from './input/pointer.js';

const $ = (selector) => document.querySelector(selector);
const params = new URLSearchParams(location.search);
const renderer = new Renderer($('#field'));
const audio = new BowlAudio();
const game = new Game(params.has('challenge') ? 'challenge' : 'free');
let storage;
try {
  storage = window.localStorage;
} catch {
  storage = null;
}
let best = bestScore(storage, challenge.id);
let tool = 'draw';
let accumulator = 0;
let lastTime = null;
let lastUI = 0;
let noticeTimer;
$('#hint').hidden = readStored(storage, 'dust-offering:hint') === 'seen';

function notice(text) {
  clearTimeout(noticeTimer);
  $('#notice').textContent = text;
  $('#notice').hidden = false;
  noticeTimer = setTimeout(() => {
    $('#notice').hidden = true;
  }, 5000);
}
function selectTool(value) {
  tool = value;
  renderer.tool = value;
  $('#draw').setAttribute('aria-pressed', value === 'draw');
  $('#rub').setAttribute('aria-pressed', value === 'rub');
}
const pointer = bindPointer($('#field'), {
  edit: (a, b) => game.edit(a, b, tool),
  changed: () => {
    $('#hint').hidden = true;
    writeStored(storage, 'dust-offering:hint', 'seen');
  },
  brush: (point) => {
    renderer.brush = point;
  },
  canEdit: () => game.phase !== 'finished',
});

function syncUI() {
  const sim = game.sim;
  const scored = game.mode === 'challenge';
  $('#hud').hidden = !scored;
  $('#free').setAttribute('aria-pressed', !scored);
  $('#challenge').setAttribute('aria-pressed', scored);
  $('#supply').textContent = `${sim.remaining.toLocaleString()} remaining`;
  $('#best').textContent = `Best ${best ?? '—'}`;
  const label =
    game.phase === 'ready'
      ? 'Begin'
      : game.phase === 'finished'
        ? 'Result'
        : scored && sim.remaining === 0
          ? 'Finish'
          : sim.pouring
            ? 'Stop pour'
            : 'Resume';
  $('#pour').textContent = label;
  $('#pour').disabled =
    scored &&
    game.phase === 'running' &&
    sim.remaining === 0 &&
    !game.canFinish;
  $('#draw').disabled = game.phase === 'finished';
  $('#rub').disabled = game.phase === 'finished';
  $('#accessible-state').textContent =
    `Left bowl ${sim.left}${scored ? ` of ${challenge.leftTarget}` : ''}. Right bowl ${sim.right}${scored ? ` of ${challenge.rightTarget}` : ''}. Spilled ${sim.spill}. ${scored ? `${sim.remaining} grains remaining.` : ''}`;
  $('#field').setAttribute(
    'aria-description',
    $('#accessible-state').textContent,
  );
}

function reset(mode = game.mode) {
  pointer.cancel();
  $('#result').close();
  game.reset(mode);
  accumulator = 0;
  lastTime = null;
  const url = new URL(location.href);
  if (mode === 'challenge') url.searchParams.set('challenge', challenge.id);
  else url.searchParams.delete('challenge');
  history.replaceState(null, '', url);
  syncUI();
  renderer.draw(game.sim, game.mode);
}

function showResult() {
  const result = game.result;
  if (!result) return;
  $('#score').textContent = `${result.score} / 1000`;
  $('#result-left').textContent =
    `${result.left.toLocaleString()} / ${challenge.leftTarget.toLocaleString()}`;
  $('#result-right').textContent =
    `${result.right.toLocaleString()} / ${challenge.rightTarget.toLocaleString()}`;
  $('#result-best').textContent = String(best ?? result.score);
  $('#result-uncollected').textContent =
    `${result.spill.toLocaleString()} spilled · ${result.onFace.toLocaleString()} on the face. No time penalty.`;
  $('#share-status').textContent = '';
  $('#manual-share').hidden = true;
  $('#result').showModal();
}
$('#draw').onclick = () => selectTool('draw');
$('#rub').onclick = () => selectTool('rub');
$('#free').onclick = () => reset('free');
$('#challenge').onclick = () => reset('challenge');
$('#reset').onclick = () => reset();
$('#again').onclick = () => {
  reset('challenge');
  $('#pour').focus();
};
$('#result-close').onclick = () => $('#result').close();
$('#pour').onclick = () => {
  if (game.phase === 'ready') game.begin();
  else if (game.phase === 'finished') showResult();
  else if (game.mode === 'challenge' && game.sim.remaining === 0) {
    const result = game.finish();
    if (result) {
      const saved = saveBest(storage, challenge.id, result.score);
      best = saved.best;
      if (!saved.saved) notice('Best score could not be saved on this device.');
      showResult();
    }
  } else game.togglePour();
  syncUI();
};
$('#sound').onclick = async () => {
  try {
    const enabled = await audio.toggle();
    $('#sound').setAttribute('aria-pressed', enabled);
    $('#sound').setAttribute(
      'aria-label',
      enabled ? 'Mute sound' : 'Enable sound',
    );
    $('#sound').textContent = enabled ? 'Sound on' : 'Sound off';
    if (!audio.context) notice('Sound is unavailable on this device.');
  } catch {
    notice('Sound could not start. You can keep playing muted.');
  }
};
$('#share').onclick = async () => {
  $('#share').disabled = true;
  const shared = await shareScore(game.result, location.href, navigator);
  $('#share-status').textContent = {
    shared: 'Shared.',
    copied: 'Score and challenge link copied.',
    cancelled: '',
    manual: 'Copy the score and link below.',
  }[shared.status];
  if (shared.status === 'manual') {
    $('#manual-share').value = shared.text;
    $('#manual-share').hidden = false;
    $('#manual-share').focus();
    $('#manual-share').select();
  }
  $('#share').disabled = false;
};
document.addEventListener('keydown', (event) => {
  if (
    $('#result').open ||
    event.target instanceof HTMLButtonElement ||
    event.ctrlKey ||
    event.metaKey ||
    event.altKey
  )
    return;
  if (event.key.toLowerCase() === 'd') selectTool('draw');
  if (event.key.toLowerCase() === 'r') selectTool('rub');
  if (event.code === 'Space') {
    event.preventDefault();
    $('#pour').click();
  }
});
document.addEventListener('visibilitychange', () => {
  lastTime = null;
  accumulator = 0;
  pointer.cancel();
});
function frame(time) {
  if (!document.hidden) {
    if (lastTime !== null)
      accumulator += Math.min((time - lastTime) / 1000, 0.1);
    const workStart = performance.now();
    while (accumulator >= 1 / 60) {
      game.step();
      accumulator -= 1 / 60;
      // A full retained pile must not cause a catch-up spiral that starves
      // pointer input. Keep fixed-size, deterministic physics steps; under
      // extreme load simulation time slows instead of dropping any grains.
      if (performance.now() - workStart >= 8) {
        accumulator = Math.min(accumulator, 1 / 60);
        break;
      }
    }
    renderer.draw(game.sim, game.mode);
    audio.update(game.sim);
    if (time - lastUI > 100) {
      syncUI();
      lastUI = time;
    }
  }
  lastTime = document.hidden ? null : time;
  requestAnimationFrame(frame);
}
syncUI();
requestAnimationFrame(frame);
if (params.has('challenge') && params.get('challenge') !== challenge.id)
  notice(
    'This link uses an earlier offering. The current targets are shown below.',
  );
// Explicit developer opt-in; normal play exposes no mutable debug state.
if (params.has('debug'))
  window.dust = {
    game,
    get sim() {
      return game.sim;
    },
    renderer,
    syncUI,
  };
