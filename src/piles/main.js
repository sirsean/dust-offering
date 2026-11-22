import '../styles.css';
import './styles.css';
import { pileLevels } from '../config/piles.js';
import { bindPointer } from '../input/pointer.js';
import { StudyRenderer } from '../lab/renderer.js';
import { MaterialAudio } from '../rendering/audio.js';
import { PileGame } from './game.js';

const $ = (selector) => document.querySelector(selector);
const canvas = $('#field');
const selector = $('#stone');
const pause = $('#pause');
const next = $('#next');
const status = $('#status');
const progress = $('#piles-progress');
const renderer = new StudyRenderer(canvas);
const audio = new MaterialAudio();
const params = new URLSearchParams(location.search);
let levelIndex = Math.max(
  0,
  pileLevels.findIndex(({ id }) => id === params.get('stone')),
);
let game;
let lastFrame = null;
let lastUpdate = 0;
let accumulator = 0;

const pointer = bindPointer(canvas, {
  edit: (a, b, stroke) => game.brush(a, b, stroke),
  brush: (id, point) => {
    if (point) renderer.brushes.set(id, point);
    else {
      game.sim.endBrush(id);
      renderer.brushes.delete(id);
    }
  },
  acceptStroke: () => true,
});

function setText(element, value) {
  if (element.textContent !== value) element.textContent = value;
}

function syncUI() {
  const { sim, targets, counts, complete } = game;
  let ready = 0;
  let overfilled = 0;
  for (const [index, { required, capacity }] of targets.entries()) {
    if (counts[index] > capacity) overfilled++;
    else if (counts[index] >= required) ready++;
  }
  let message = `${ready} / ${targets.length} ready`;
  if (complete) message = 'Stone complete';
  if (overfilled) message = `${overfilled} overfilled`;
  setText(status, message);
  status.dataset.complete = String(complete);
  status.dataset.overfilled = String(overfilled > 0);
  setText(
    pause,
    sim.remaining
      ? sim.bubbling
        ? 'Pause wells'
        : 'Resume wells'
      : 'Wells quiet',
  );
  pause.disabled = sim.remaining === 0;
  setText(
    next,
    levelIndex === pileLevels.length - 1 && complete
      ? 'First stone'
      : 'Next stone',
  );
  next.disabled = !complete;
  setText(
    progress,
    targets
      .map(({ required, capacity }, index) => {
        const count = counts[index];
        const warning = count > capacity ? ' Overfilled.' : '';
        return `Pile ${index + 1} has ${count} grains.${warning} Aim for ${required} to ${capacity}.`;
      })
      .join(' ') + ` ${sim.remaining} grains still to surface.`,
  );
}

function start(index) {
  pointer.cancel();
  audio.quiet();
  levelIndex = index;
  game = new PileGame(pileLevels[index]);
  selector.value = game.level.id;
  setText(
    $('#instruction'),
    index === 0
      ? 'Sweep the dust into the ring.'
      : 'Share dust across the rings.',
  );
  const url = new URL(location.href);
  url.searchParams.set('stone', game.level.id);
  history.replaceState(null, '', url);
  lastFrame = null;
  accumulator = 0;
  syncUI();
  renderer.draw(game.sim, game.guide, game.counts);
}

pileLevels.forEach(({ id, name }, index) =>
  selector.add(new Option(`${index + 1}. ${name}`, id)),
);
selector.onchange = () => start(selector.selectedIndex);
$('#restart').onclick = () => start(levelIndex);
next.onclick = () => {
  if (game.complete) {
    start((levelIndex + 1) % pileLevels.length);
    selector.focus();
  }
};
pause.onclick = () => {
  game.sim.bubbling = !game.sim.bubbling;
  syncUI();
};
$('#sound').onclick = async (event) => {
  const button = event.currentTarget;
  try {
    const enabled = await audio.toggle();
    setText(button, enabled ? 'Sound on' : 'Sound off');
    button.setAttribute('aria-pressed', String(enabled));
  } catch {
    setText(button, 'No audio');
  }
};
document.addEventListener('visibilitychange', () => {
  pointer.cancel();
  lastFrame = null;
  accumulator = 0;
  if (document.hidden) audio.quiet();
});

function frame(time) {
  if (!document.hidden) {
    if (lastFrame !== null)
      accumulator += Math.min(0.1, (time - lastFrame) / 1000);
    const startTime = performance.now();
    while (accumulator >= 1 / 60) {
      game.step();
      accumulator -= 1 / 60;
      if (performance.now() - startTime >= 8) {
        accumulator = Math.min(accumulator, 1 / 60);
        break;
      }
    }
    renderer.draw(game.sim, game.guide, game.counts);
    audio.update(game.sim);
    if (time - lastUpdate >= 100) {
      syncUI();
      lastUpdate = time;
    }
  }
  lastFrame = document.hidden ? null : time;
  requestAnimationFrame(frame);
}

start(levelIndex);
requestAnimationFrame(frame);
if (params.has('debug'))
  window.pileStudy = {
    get game() {
      return game;
    },
  };
