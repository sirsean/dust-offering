import '../styles.css';
import './styles.css';
import { UpwellingSimulation } from './simulation.js';
import { createGoal, evaluateGoal, goalTypes } from './goals.js';
import { StudyRenderer } from './renderer.js';
import { MaterialAudio } from '../rendering/audio.js';
import { bindPointer } from '../input/pointer.js';

const $ = (selector) => document.querySelector(selector);
const params = new URLSearchParams(location.search);
let seed = /^\d{1,10}$/.test(params.get('seed') ?? '')
  ? Number(params.get('seed')) >>> 0
  : crypto.getRandomValues(new Uint32Array(1))[0];
let type = Object.hasOwn(goalTypes, params.get('goal'))
  ? params.get('goal')
  : 'gather';
let sim, goal;
const renderer = new StudyRenderer($('#field')),
  audio = new MaterialAudio();
let last = null,
  accumulator = 0,
  lastUI = 0;
const pointer = bindPointer($('#field'), {
  edit: (a, b, stroke) => sim.brush(a, b, stroke),
  brush: (id, point) => {
    if (point) renderer.brushes.set(id, point);
    else {
      sim?.endBrush(id);
      renderer.brushes.delete(id);
    }
  },
  acceptStroke: () => true,
});

function syncUI() {
  const result = evaluateGoal(sim, goal);
  $('#fit').textContent = result.complete
    ? 'Arrangement found'
    : `Fit ${Math.floor(result.fit * 100)}%`;
  $('#progress').value = result.fit;
  $('#material').textContent = sim.remaining
    ? sim.bubbling
      ? 'Dust surfacing'
      : 'Wells paused'
    : 'All dust surfaced';
  $('#pause').textContent = sim.bubbling ? 'Pause wells' : 'Resume wells';
  $('#pause').disabled = !sim.remaining;
  $('#instruction').textContent = goal.instruction;
  for (const button of document.querySelectorAll('[data-goal]'))
    button.setAttribute('aria-pressed', button.dataset.goal === type);
  $('#accessible-state').textContent =
    `${goal.label}. ${Math.floor(result.fit * 100)} percent fit. ${sim.emitted} grains surfaced, ${sim.remaining} remaining, ${result.outside} outside the stone and recoverable.`;
  $('#field').setAttribute(
    'aria-description',
    $('#accessible-state').textContent,
  );
}

function reset() {
  pointer.cancel();
  audio.quiet();
  sim = new UpwellingSimulation({ seed });
  goal = createGoal(type, seed);
  // The same real five-second preparation is shared by every goal.
  for (let i = 0; i < 300; i++) sim.step();
  last = null;
  accumulator = 0;
  const url = new URL(location.href);
  url.searchParams.set('seed', seed);
  url.searchParams.set('goal', type);
  history.replaceState(null, '', url);
  syncUI();
  renderer.draw(sim, goal);
}
for (const button of document.querySelectorAll('[data-goal]'))
  button.onclick = () => {
    type = button.dataset.goal;
    reset();
  };
$('#pause').onclick = () => {
  sim.bubbling = !sim.bubbling;
  syncUI();
};
$('#restart').onclick = reset;
$('#next').onclick = () => {
  seed = crypto.getRandomValues(new Uint32Array(1))[0];
  reset();
};
$('#guide').onclick = () => {
  renderer.showGuide = !renderer.showGuide;
  $('#guide').setAttribute('aria-pressed', renderer.showGuide);
  $('#guide').textContent = renderer.showGuide ? 'Guide on' : 'Guide off';
};
$('#sound').onclick = async () => {
  try {
    const enabled = await audio.toggle();
    $('#sound').textContent = enabled ? 'Sound on' : 'Sound off';
    $('#sound').setAttribute('aria-pressed', enabled);
  } catch {
    $('#sound').textContent = 'Sound unavailable';
  }
};
document.addEventListener('visibilitychange', () => {
  pointer.cancel();
  last = null;
  accumulator = 0;
  if (document.hidden) audio.quiet();
});
document.addEventListener('keydown', (event) => {
  if (event.code === 'Space' && !(event.target instanceof HTMLButtonElement)) {
    event.preventDefault();
    if (sim.remaining) $('#pause').click();
  }
});
function frame(time) {
  if (!document.hidden) {
    if (last !== null) accumulator += Math.min(0.1, (time - last) / 1000);
    const start = performance.now();
    while (accumulator >= 1 / 60) {
      sim.step();
      accumulator -= 1 / 60;
      if (performance.now() - start >= 8) {
        accumulator = Math.min(accumulator, 1 / 60);
        break;
      }
    }
    renderer.draw(sim, goal);
    audio.update(sim);
    if (time - lastUI > 100) {
      syncUI();
      lastUI = time;
    }
  }
  last = document.hidden ? null : time;
  requestAnimationFrame(frame);
}
reset();
requestAnimationFrame(frame);
if (params.has('debug'))
  window.stoneStudy = {
    get sim() {
      return sim;
    },
    get goal() {
      return goal;
    },
    renderer,
    audio,
    syncUI,
  };
