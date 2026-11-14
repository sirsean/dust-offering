import { seededRandom } from '../simulation/random.js';
import { insideStone } from '../simulation/geometry.js';
import { challenge } from '../config/challenge.js';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.brushes = new Map();
    this.treatmentSurface = null;
    this.reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(canvas);
    this.resize();
  }

  resize() {
    const width = Math.max(1, this.canvas.getBoundingClientRect().width);
    const ratio = Math.min(devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(width * ratio);
    this.canvas.height = Math.round(width * 1.25 * ratio);
    this.scale = this.canvas.width / 160;
    this.grainSprite = null;
    this.background = document.createElement('canvas');
    this.background.width = this.canvas.width;
    this.background.height = this.canvas.height;
    const c = this.background.getContext('2d');
    c.scale(this.scale, this.scale);
    c.fillStyle = '#111310';
    c.fillRect(0, 0, 160, 200);
    const haze = c.createRadialGradient(42, 90, 0, 65, 100, 130);
    haze.addColorStop(0, '#28271d');
    haze.addColorStop(1, '#111310');
    c.fillStyle = haze;
    c.fillRect(0, 0, 160, 200);
    c.fillStyle = '#46483b';
    c.beginPath();
    c.moveTo(80, 6);
    c.lineTo(159, 176);
    c.lineTo(1, 176);
    c.closePath();
    c.fill();
    const stone = c.createLinearGradient(12, 80, 140, 130);
    stone.addColorStop(0, '#363a30');
    stone.addColorStop(0.55, '#2b3027');
    stone.addColorStop(1, '#20271f');
    c.fillStyle = stone;
    c.beginPath();
    c.moveTo(80, 8);
    c.lineTo(156, 174);
    c.lineTo(4, 174);
    c.closePath();
    c.fill();
    const random = seededRandom(480);
    for (let i = 0; i < 5000; i++) {
      const x = random() * 160;
      const y = random() * 174;
      if (!insideStone(x, y)) continue;
      c.fillStyle = i % 3 ? '#b3b3980d' : '#050a0780';
      c.fillRect(x, y, 0.25 + random() * 0.45, 0.15 + random() * 0.35);
    }
    c.save();
    c.beginPath();
    c.moveTo(80, 8);
    c.lineTo(156, 174);
    c.lineTo(4, 174);
    c.closePath();
    c.clip();
    c.lineWidth = 0.18;
    for (let i = 0; i < 95; i++) {
      const x = random() * 160,
        y = random() * 174;
      c.strokeStyle = i % 2 ? '#b6b39b0e' : '#080e0a38';
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x + random() * 7 - 3.5, y + random() * 9);
      c.stroke();
    }
    c.restore();
    c.fillStyle = '#292b22';
    c.fillRect(0, 198, 160, 2);
    c.strokeStyle = '#77755b';
    c.lineWidth = 0.3;
    c.beginPath();
    c.moveTo(0, 198);
    c.lineTo(160, 198);
    c.stroke();
  }

  drawBowls(sim, mode) {
    const c = this.ctx;
    for (const [mouth, count, target] of [
      [sim.config.leftMouth, sim.left, challenge.leftTarget],
      [sim.config.rightMouth, sim.right, challenge.rightTarget],
    ]) {
      const x = (mouth[0] + mouth[1]) / 2;
      const half = (mouth[1] - mouth[0]) / 2;
      c.fillStyle = '#292b23';
      c.fillRect(mouth[0] + 1, 191, mouth[1] - mouth[0] - 2, 9);
      c.save();
      c.beginPath();
      c.moveTo(x - half, 181);
      c.quadraticCurveTo(x - 20, 194, x, 194);
      c.quadraticCurveTo(x + 20, 194, x + half, 181);
      c.closePath();
      c.fillStyle = '#303327';
      c.fill();
      c.clip();
      const fill = Math.min(count / (mode === 'challenge' ? target : 480), 1);
      const y = 193 - fill * 12;
      c.fillStyle = '#a59058';
      c.beginPath();
      c.moveTo(x - half - 1, y + 2);
      c.quadraticCurveTo(x, y - 3, x + half + 1, y + 2);
      c.lineTo(x + half + 1, 195);
      c.lineTo(x - half - 1, 195);
      c.closePath();
      if (count) c.fill();
      c.restore();
      c.strokeStyle = '#a29c7b';
      c.lineWidth = 0.7;
      c.beginPath();
      c.ellipse(x, 181, half, 3, 0, 0, Math.PI * 2);
      c.stroke();
      if (mode === 'challenge') {
        c.strokeStyle = '#dac38c';
        c.lineWidth = 0.8;
        c.beginPath();
        c.moveTo(x - half - 2, 180);
        c.lineTo(x - half + 2, 180);
        c.moveTo(x + half - 2, 180);
        c.lineTo(x + half + 2, 180);
        c.stroke();
      }
    }
  }

  drawTreatment(surface) {
    if (this.treatmentSurface !== surface) {
      this.treatmentSurface = surface;
      this.treatmentCanvas = document.createElement('canvas');
      this.treatmentCanvas.width = surface.columns;
      this.treatmentCanvas.height = surface.rows;
      this.treatmentContext = this.treatmentCanvas.getContext('2d');
      this.treatmentPixels = this.treatmentContext.createImageData(
        surface.columns,
        surface.rows,
      );
      this.treatmentVersion = -1;
      this.treatmentTime = -Infinity;
    }
    if (
      this.treatmentVersion !== surface.version ||
      surface.time - this.treatmentTime >= 0.1
    ) {
      const data = this.treatmentPixels.data;
      data.fill(0);
      surface.visitVisibleCells((index, strength) => {
        const pixel = index * 4;
        data[pixel] = 166;
        data[pixel + 1] = 179;
        data[pixel + 2] = 151;
        data[pixel + 3] = Math.round(
          255 * 0.5 * Math.sqrt(strength / surface.config.traceMaxStrength),
        );
      });
      this.treatmentContext.putImageData(this.treatmentPixels, 0, 0);
      this.treatmentVersion = surface.version;
      this.treatmentTime = surface.time;
    }
    // Functional feedback stays visible under reduced motion as well: this
    // coating is the same decaying strength field used by the adhesion solver.
    this.ctx.drawImage(this.treatmentCanvas, 0, 0, 160, 200);
  }

  draw(sim, mode = 'free') {
    const c = this.ctx;
    c.setTransform(this.scale, 0, 0, this.scale, 0, 0);
    c.drawImage(this.background, 0, 0, 160, 200);
    this.drawTreatment(sim.surface);
    this.drawBowls(sim, mode);
    if (!this.reducedMotion.matches) {
      c.strokeStyle = '#e6d5a524';
      c.lineWidth = 0.4;
      c.beginPath();
      for (const grain of sim.grains)
        if (
          !grain.bond &&
          !grain.sleeping &&
          Math.hypot(grain.vx, grain.vy) > 6
        ) {
          c.moveTo(grain.x - grain.vx * 0.045, grain.y - grain.vy * 0.045);
          c.lineTo(grain.x, grain.y);
        }
      c.stroke();
    }
    if (!this.grainSprite || this.spriteRadius !== sim.config.grainRadius) {
      this.spriteRadius = sim.config.grainRadius;
      const diameter = Math.ceil(sim.config.grainRadius * this.scale * 2 + 2);
      this.grainSprite = document.createElement('canvas');
      this.grainSprite.width = diameter;
      this.grainSprite.height = diameter;
      const sprite = this.grainSprite.getContext('2d');
      sprite.fillStyle = '#e6d09b';
      sprite.beginPath();
      sprite.arc(
        diameter / 2,
        diameter / 2,
        sim.config.grainRadius * this.scale,
        0,
        Math.PI * 2,
      );
      sprite.fill();
    }
    c.setTransform(1, 0, 0, 1, 0, 0);
    const offset = this.grainSprite.width / 2;
    // Missed grains remain here too: their visible ground piles are made from
    // the same particles and contacts as the deposits on the stone.
    for (const grain of sim.grains)
      c.drawImage(
        this.grainSprite,
        grain.x * this.scale - offset,
        grain.y * this.scale - offset,
      );
    c.setTransform(this.scale, 0, 0, this.scale, 0, 0);
    c.fillStyle = '#c8b385';
    c.fillRect(
      sim.config.sourceX - sim.config.sourceWidth / 2,
      11,
      sim.config.sourceWidth,
      0.8,
    );
    for (const [x, count, target] of [
      [42.5, sim.left, challenge.leftTarget],
      [117.5, sim.right, challenge.rightTarget],
    ]) {
      c.fillStyle = '#ded3b3';
      c.font = `${Math.max(6, 12 / (this.canvas.clientWidth / 160))}px system-ui`;
      c.textAlign = 'center';
      c.fillText(
        mode === 'challenge'
          ? `${count.toLocaleString()} / ${target.toLocaleString()}`
          : count.toLocaleString(),
        x,
        199,
      );
    }
    for (const point of this.brushes.values()) {
      c.fillStyle = '#e8d5a414';
      c.strokeStyle = '#e1d2ad';
      c.lineWidth = 0.35;
      c.beginPath();
      c.arc(point.x, point.y, sim.config.brushWidth / 2, 0, Math.PI * 2);
      c.fill();
      c.stroke();
    }
    if (sim.blocked) {
      c.fillStyle = '#dfd1ae';
      c.font = '4.3px system-ui';
      c.textAlign = 'center';
      c.fillText(
        sim.blockReason === 'full'
          ? 'A full tray. Reset for a fresh pour.'
          : 'Brush the sand below the source',
        80,
        23,
      );
    }
  }
}
