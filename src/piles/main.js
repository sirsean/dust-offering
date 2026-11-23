import '../styles.css';
import './styles.css';
import { piles } from '../config/piles.js';
import { recordFor } from '../config/piles-story.js';
import { bindPointer } from '../input/pointer.js';
import { StudyRenderer } from '../lab/renderer.js';
import { MaterialAudio } from '../rendering/audio.js';
import { PileGame } from './game.js';
import { chapterAt, endsChapter, levelFor } from './levels.js';
import { loadProgress, saveProgress } from './progress.js';

const $ = (selector) => document.querySelector(selector);
const canvas = $('#field');
const pause = $('#pause');
const next = $('#next');
const status = $('#status');
const progress = $('#piles-progress');
const record = $('.piles-record');
const renderer = new StudyRenderer(canvas, { stoneSeed: piles.stoneSeed });
const audio = new MaterialAudio();
const params = new URLSearchParams(location.search);
const seed = params.get('seed')?.trim() || piles.defaultSeed;
const checkpoint = loadProgress(seed);
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
  if (complete) message = 'Offering complete';
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
    complete && endsChapter(game.level.number) ? 'Read record' : 'Next',
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

function start(level, savedDiscovery) {
  pointer.cancel();
  audio.quiet();
  game = new PileGame(level, game?.sim.discovery);
  if (savedDiscovery) game.sim.discovery.restore(savedDiscovery);
  setText($('#offering'), `Offering ${level.number}`);
  lastFrame = null;
  accumulator = 0;
  syncUI();
  renderer.draw(game.sim, game.guide, game.counts);
}

function advance() {
  const level = levelFor(seed, game.level.number + 1);
  start(level);
  saveProgress(seed, level.number, game.sim.discovery);
  canvas.focus({ preventScroll: true });
}

$('#restart').onclick = () => start(game.level);
next.onclick = () => {
  if (!game.complete || record.open) return;
  const { number } = game.level;
  if (!endsChapter(number)) {
    advance();
    return;
  }
  const chapter = chapterAt(number);
  const { title, paragraphs } = recordFor(chapter, levelFor(seed, number + 1));
  const label = `Pyramid Order / Record ${chapter + 1}`;
  const recordNumber = $('#record-number');
  recordNumber.hidden = !title;
  setText(recordNumber, label);
  setText($('#record-title'), title ?? label);
  $('#record-body').replaceChildren(
    ...paragraphs.map((text) => {
      const paragraph = document.createElement('p');
      paragraph.textContent = text;
      return paragraph;
    }),
  );
  pointer.cancel();
  audio.quiet();
  lastFrame = null;
  accumulator = 0;
  record.showModal();
};
$('#continue').onclick = () => {
  if (!record.open) return;
  record.close();
  advance();
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
  const playing = !document.hidden && !record.open;
  if (playing) {
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
  lastFrame = playing ? time : null;
  requestAnimationFrame(frame);
}

start(levelFor(seed, checkpoint?.level ?? 1), checkpoint?.discovery);
requestAnimationFrame(frame);
if (params.has('debug'))
  window.pileStudy = {
    renderer,
    get game() {
      return game;
    },
  };
