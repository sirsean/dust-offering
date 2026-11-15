import { touchesStone } from '../simulation/geometry.js';
import { prototype } from '../config/prototype.js';

export function bindPointer(canvas, { edit, brush, canEdit = () => true }) {
  const pointers = new Map();
  function point(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * 160,
      y: ((event.clientY - rect.top) / rect.height) * 200,
    };
  }
  function move(event) {
    const state = pointers.get(event.pointerId);
    if (!state) return;
    event.preventDefault();
    const samples = event.getCoalescedEvents?.() ?? [];
    for (const sample of samples.length ? samples : [event]) {
      const p = point(sample);
      brush(event.pointerId, p);
      if (!canEdit()) {
        state.previous = null;
        continue;
      }
      const previous = state.previous ?? p;
      if (touchesStone(previous, p, prototype.brushWidth / 2)) {
        edit(previous, p, {
          start: state.previous === null,
          pointerId: event.pointerId,
        });
      }
      state.previous = p;
    }
  }
  function end(event) {
    if (!pointers.delete(event.pointerId)) return;
    brush(event.pointerId, null);
    if (canvas.hasPointerCapture(event.pointerId))
      canvas.releasePointerCapture(event.pointerId);
  }
  canvas.addEventListener('pointerdown', (event) => {
    if (pointers.has(event.pointerId) || event.button !== 0) return;
    pointers.set(event.pointerId, { previous: null });
    canvas.setPointerCapture(event.pointerId);
    move(event);
  });
  canvas.addEventListener('pointermove', move);
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);
  canvas.addEventListener('lostpointercapture', end);
  return {
    cancel() {
      for (const pointerId of [...pointers.keys()]) end({ pointerId });
    },
  };
}
