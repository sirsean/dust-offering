export function bindPointer(
  canvas,
  { edit, changed, brush, canEdit = () => true },
) {
  let active = null;
  let previous = null;
  function point(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * 160,
      y: ((event.clientY - rect.top) / rect.height) * 200,
    };
  }
  function protectedPoint(p) {
    return p.x < 4 || p.x > 156 || p.y < 26 || p.y > 169;
  }
  function move(event) {
    if (event.pointerId !== active) return;
    event.preventDefault();
    const events = event.getCoalescedEvents?.() ?? [];
    for (const sample of events.length ? events : [event]) {
      const p = point(sample);
      brush(p);
      if (protectedPoint(p) || !canEdit()) {
        previous = null;
        continue;
      }
      edit(previous ?? p, p);
      previous = p;
      changed();
    }
  }
  function end(event) {
    if (event.pointerId !== active) return;
    active = null;
    previous = null;
    brush(null);
    if (canvas.hasPointerCapture(event.pointerId))
      canvas.releasePointerCapture(event.pointerId);
  }
  canvas.addEventListener('pointerdown', (event) => {
    if (active !== null || event.button !== 0) return;
    active = event.pointerId;
    canvas.setPointerCapture(active);
    move(event);
  });
  canvas.addEventListener('pointermove', move);
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);
  canvas.addEventListener('lostpointercapture', end);
  return {
    cancel() {
      if (active !== null) end({ pointerId: active });
    },
  };
}
