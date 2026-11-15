import { seededRandom } from '../simulation/random.js';
import { insideStone, stone as stoneShape } from '../simulation/geometry.js';
import { challenge } from '../config/challenge.js';
import { readPalette } from './palette.js';

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
    this.palette = readPalette(this.canvas);
    const p = this.palette;
    this.grainSprites = null;
    this.background = document.createElement('canvas');
    this.background.width = this.canvas.width;
    this.background.height = this.canvas.height;
    const c = this.background.getContext('2d');
    c.scale(this.scale, this.scale);
    c.fillStyle = p.scene;
    c.fillRect(0, 0, 160, 200);
    const haze = c.createRadialGradient(42, 90, 0, 65, 100, 130);
    haze.addColorStop(0, p.haze);
    haze.addColorStop(1, p.scene);
    c.fillStyle = haze;
    c.fillRect(0, 0, 160, 200);
    // Low, eroded shelves and wind-scoured dust sit behind the stone. These
    // are cached scenery, with a separate seed from all simulated material.
    for (const [color, points] of [
      [
        p.landFar,
        [
          [0, 146],
          [17, 140],
          [31, 143],
          [54, 137],
          [85, 145],
          [113, 139],
          [140, 145],
          [160, 139],
        ],
      ],
      [
        p.landNear,
        [
          [0, 169],
          [18, 164],
          [42, 168],
          [72, 161],
          [104, 166],
          [132, 160],
          [160, 165],
        ],
      ],
    ]) {
      c.fillStyle = color;
      c.beginPath();
      points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
      c.lineTo(160, 200);
      c.lineTo(0, 200);
      c.closePath();
      c.fill();
    }
    const wind = seededRandom(1202);
    c.strokeStyle = p.stoneDust + '13';
    c.lineWidth = 0.15;
    c.beginPath();
    for (let i = 0; i < 55; i++) {
      const x = wind() * 160,
        y = 55 + wind() * 140;
      c.moveTo(x, y);
      c.lineTo(x + 4 + wind() * 9, y - 0.6 - wind());
    }
    c.stroke();
    const rim = c.createLinearGradient(0, 0, 160, 170);
    rim.addColorStop(0, p.stoneRim);
    rim.addColorStop(1, p.stoneShade);
    c.fillStyle = rim;
    c.beginPath();
    c.moveTo(stoneShape.x, stoneShape.top);
    c.lineTo(stoneShape.x + stoneShape.halfWidth, stoneShape.bottom);
    c.lineTo(stoneShape.x - stoneShape.halfWidth, stoneShape.bottom);
    c.closePath();
    c.fill();
    const stone = c.createLinearGradient(12, 80, 140, 130);
    stone.addColorStop(0, p.stoneLit);
    stone.addColorStop(0.55, p.stoneMid);
    stone.addColorStop(1, p.stoneShade);
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
      c.fillStyle = i % 3 ? p.stoneDust + '16' : p.stonePit + '59';
      c.fillRect(x, y, 0.25 + random() * 0.45, 0.15 + random() * 0.35);
    }
    c.save();
    c.beginPath();
    c.moveTo(80, 8);
    c.lineTo(156, 174);
    c.lineTo(4, 174);
    c.closePath();
    c.clip();
    for (let i = 0; i < 9; i++) {
      const x = random() * 160,
        y = 18 + random() * 155,
        radius = 7 + random() * 18;
      const weathering = c.createRadialGradient(x, y, 0, x, y, radius);
      weathering.addColorStop(0, p.stonePit + '20');
      weathering.addColorStop(1, p.stonePit + '00');
      c.fillStyle = weathering;
      c.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    }
    // Subtle mineral seams and worn horizontal strata; no invented glyphs.
    c.strokeStyle = p.stonePit + '24';
    c.lineWidth = 0.25;
    for (let i = 0; i < 8; i++) {
      const y = 16 + random() * 154;
      c.beginPath();
      c.moveTo(0, y);
      c.bezierCurveTo(45, y + random() * 5, 92, y - 3, 160, y + 6);
      c.stroke();
    }
    c.lineWidth = 0.18;
    for (let i = 0; i < 95; i++) {
      const x = random() * 160,
        y = random() * 174;
      c.strokeStyle = i % 2 ? p.stoneDust + '18' : p.stonePit + '38';
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x + random() * 7 - 3.5, y + random() * 9);
      c.stroke();
    }
    c.restore();
    c.fillStyle = p.ground;
    c.fillRect(0, 198, 160, 2);
    c.strokeStyle = p.groundEdge;
    c.lineWidth = 0.3;
    c.beginPath();
    c.moveTo(0, 198);
    c.lineTo(160, 198);
    c.stroke();
  }

  drawBowls(sim, mode) {
    const c = this.ctx;
    const p = this.palette;
    for (const [mouth, count, target] of [
      [sim.config.leftMouth, sim.left, challenge.leftTarget],
      [sim.config.rightMouth, sim.right, challenge.rightTarget],
    ]) {
      const x = (mouth[0] + mouth[1]) / 2;
      const half = (mouth[1] - mouth[0]) / 2;
      c.fillStyle = p.bowlFoot;
      c.fillRect(mouth[0] + 1, 191, mouth[1] - mouth[0] - 2, 9);
      c.save();
      c.beginPath();
      c.moveTo(x - half, 181);
      c.quadraticCurveTo(x - 20, 194, x, 194);
      c.quadraticCurveTo(x + 20, 194, x + half, 181);
      c.closePath();
      const clay = c.createLinearGradient(x - half, 181, x + half, 194);
      clay.addColorStop(0, p.bowlLit);
      clay.addColorStop(1, p.bowlShade);
      c.fillStyle = clay;
      c.fill();
      c.clip();
      const fill = Math.min(count / (mode === 'challenge' ? target : 480), 1);
      const y = 193 - fill * 12;
      c.fillStyle = p.bowlDust;
      c.beginPath();
      c.moveTo(x - half - 1, y + 2);
      c.quadraticCurveTo(x, y - 3, x + half + 1, y + 2);
      c.lineTo(x + half + 1, 195);
      c.lineTo(x - half - 1, 195);
      c.closePath();
      if (count) c.fill();
      c.restore();
      c.strokeStyle = p.bowlRim;
      c.lineWidth = 0.7;
      c.beginPath();
      c.ellipse(x, 181, half, 3, 0, 0, Math.PI * 2);
      c.stroke();
      if (mode === 'challenge') {
        c.strokeStyle = p.mark;
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
      const [red, green, blue] = this.palette.greaseRGB;
      surface.visitVisibleCells((index, strength) => {
        const pixel = index * 4;
        data[pixel] = red;
        data[pixel + 1] = green;
        data[pixel + 2] = blue;
        data[pixel + 3] = Math.round(
          255 * 0.52 * Math.min(1, strength / 3) ** 0.75,
        );
      });
      this.treatmentContext.putImageData(this.treatmentPixels, 0, 0);
      this.treatmentVersion = surface.version;
      this.treatmentTime = surface.time;
    }
    // Functional feedback stays visible under reduced motion as well: this
    // coating is the same decaying strength field used by the adhesion solver.
    const c = this.ctx;
    c.save();
    c.beginPath();
    c.moveTo(stoneShape.x, stoneShape.top);
    c.lineTo(stoneShape.x + stoneShape.halfWidth, stoneShape.bottom);
    c.lineTo(stoneShape.x - stoneShape.halfWidth, stoneShape.bottom);
    c.closePath();
    c.clip();
    c.drawImage(this.treatmentCanvas, 0, 0, 160, 200);
    c.restore();
  }

  draw(sim, mode = 'free') {
    const c = this.ctx;
    c.setTransform(this.scale, 0, 0, this.scale, 0, 0);
    c.drawImage(this.background, 0, 0, 160, 200);
    this.drawTreatment(sim.surface);
    this.drawBowls(sim, mode);
    if (!this.reducedMotion.matches) {
      c.strokeStyle = this.palette.sand + '24';
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
    if (!this.grainSprites || this.spriteRadius !== sim.config.grainRadius) {
      this.spriteRadius = sim.config.grainRadius;
      const diameter = Math.ceil(sim.config.grainRadius * this.scale * 2 + 2);
      this.grainSprites = [
        this.palette.sand,
        this.palette.sandOchre,
        this.palette.sandLight,
      ].map((color) => {
        const canvas = document.createElement('canvas');
        canvas.width = diameter;
        canvas.height = diameter;
        const sprite = canvas.getContext('2d');
        sprite.fillStyle = color;
        sprite.beginPath();
        sprite.arc(
          diameter / 2,
          diameter / 2,
          sim.config.grainRadius * this.scale,
          0,
          Math.PI * 2,
        );
        sprite.fill();
        return canvas;
      });
    }
    c.setTransform(1, 0, 0, 1, 0, 0);
    const offset = this.grainSprites[0].width / 2;
    // Missed grains remain here too: their visible ground piles are made from
    // the same particles and contacts as the deposits on the stone.
    for (const grain of sim.grains)
      c.drawImage(
        this.grainSprites[grain.id % this.grainSprites.length],
        grain.x * this.scale - offset,
        grain.y * this.scale - offset,
      );
    c.setTransform(this.scale, 0, 0, this.scale, 0, 0);
    c.fillStyle = this.palette.source;
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
      c.fillStyle = this.palette.text;
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
      c.fillStyle = this.palette.mark + '14';
      c.strokeStyle = this.palette.mark;
      c.lineWidth = 0.35;
      c.beginPath();
      c.arc(point.x, point.y, sim.config.brushWidth / 2, 0, Math.PI * 2);
      c.fill();
      c.stroke();
    }
    if (sim.blocked) {
      c.fillStyle = this.palette.text;
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
