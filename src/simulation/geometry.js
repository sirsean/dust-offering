export function nearestPoint(x, y, segment) {
  const dx = segment.bx - segment.ax;
  const dy = segment.by - segment.ay;
  const length2 = dx * dx + dy * dy;
  const t = length2
    ? Math.max(
        0,
        Math.min(1, ((x - segment.ax) * dx + (y - segment.ay) * dy) / length2),
      )
    : 0;
  return { x: segment.ax + dx * t, y: segment.ay + dy * t };
}

// Clip the centreline, preserving outside pieces. The caller expands the cut
// by the ridge radius so rounded surviving caps agree with the visible opening.
export function clipDisk(segment, x, y, radius) {
  const dx = segment.bx - segment.ax;
  const dy = segment.by - segment.ay;
  const ox = segment.ax - x;
  const oy = segment.ay - y;
  const a = dx * dx + dy * dy;
  if (a < 1e-12) return ox * ox + oy * oy <= radius * radius ? [] : [segment];
  const b = 2 * (ox * dx + oy * dy);
  const c = ox * ox + oy * oy - radius * radius;
  const discriminant = b * b - 4 * a * c;
  if (discriminant <= 0) return [segment];
  const enter = Math.max(0, (-b - Math.sqrt(discriminant)) / (2 * a));
  const leave = Math.min(1, (-b + Math.sqrt(discriminant)) / (2 * a));
  if (enter >= leave) return [segment];
  const pieces = [];
  if (enter > 1e-5)
    pieces.push({
      ax: segment.ax,
      ay: segment.ay,
      bx: segment.ax + dx * enter,
      by: segment.ay + dy * enter,
    });
  if (leave < 1 - 1e-5)
    pieces.push({
      ax: segment.ax + dx * leave,
      ay: segment.ay + dy * leave,
      bx: segment.bx,
      by: segment.by,
    });
  return pieces;
}

export function interpolate(a, b, spacing, visit) {
  const count = Math.max(
    1,
    Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / spacing),
  );
  for (let i = 1; i <= count; i++) {
    const t = i / count;
    visit({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
  }
}

export class Ridges {
  constructor(config) {
    this.config = config;
    this.segments = [];
    this.cells = new Map();
    this.version = 0;
  }

  key(x, y) {
    return Math.floor(y / 4) * 128 + Math.floor(x / 4);
  }

  index(segment) {
    const padding =
      this.config.ridgeThickness / 2 + this.config.grainRadius + 0.1;
    for (
      let y = Math.floor((Math.min(segment.ay, segment.by) - padding) / 4);
      y <= Math.floor((Math.max(segment.ay, segment.by) + padding) / 4);
      y++
    ) {
      for (
        let x = Math.floor((Math.min(segment.ax, segment.bx) - padding) / 4);
        x <= Math.floor((Math.max(segment.ax, segment.bx) + padding) / 4);
        x++
      ) {
        const key = y * 128 + x;
        if (!this.cells.has(key)) this.cells.set(key, []);
        this.cells.get(key).push(segment);
      }
    }
  }

  add(a, b) {
    let previous = a;
    interpolate(a, b, 2, (point) => {
      const segment = {
        ax: previous.x,
        ay: previous.y,
        bx: point.x,
        by: point.y,
      };
      this.segments.push(segment);
      this.index(segment);
      previous = point;
    });
    this.version++;
  }

  rub(x, y, radius) {
    const old = this.segments;
    this.segments = old.flatMap((segment) =>
      clipDisk(segment, x, y, radius + this.config.ridgeThickness / 2),
    );
    if (
      old.length !== this.segments.length ||
      old.some((segment, i) => segment !== this.segments[i])
    ) {
      this.cells.clear();
      for (const segment of this.segments) this.index(segment);
      this.version++;
      return true;
    }
    return false;
  }

  nearby(x, y) {
    return this.cells.get(this.key(x, y)) ?? [];
  }
}
