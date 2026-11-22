import { readPalette } from '../rendering/palette.js';
import { DustLayer } from '../rendering/dust-layer.js';
import { seededRandom } from '../simulation/random.js';
import { upwelling } from '../config/upwelling.js';

function triangle(c) {
  c.beginPath();
  c.moveTo(80, 6);
  c.lineTo(159, 176);
  c.lineTo(1, 176);
  c.closePath();
}

export class StudyRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.brushes = new Map();
    this.showGuide = true;
    this.reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(canvas);
    this.resize();
  }

  resize() {
    const width = Math.max(1, this.canvas.getBoundingClientRect().width);
    this.canvas.width = Math.round(width * Math.min(devicePixelRatio || 1, 2));
    this.canvas.height = Math.round(this.canvas.width * 1.25);
    this.scale = this.canvas.width / 160;
    this.palette = readPalette(this.canvas);
    const p = this.palette;
    this.background = document.createElement('canvas');
    this.background.width = this.canvas.width;
    this.background.height = this.canvas.height;
    const c = this.background.getContext('2d');
    c.scale(this.scale, this.scale);
    c.fillStyle = p.scene;
    c.fillRect(0, 0, 160, 200);
    const ground = c.createRadialGradient(80, 100, 0, 80, 100, 130);
    ground.addColorStop(0, p.haze);
    ground.addColorStop(1, p.scene);
    c.fillStyle = ground;
    c.fillRect(0, 0, 160, 200);
    c.save();
    c.shadowColor = '#100906aa';
    c.shadowBlur = 5 * this.scale;
    c.shadowOffsetY = 1.5 * this.scale;
    triangle(c);
    c.fillStyle = p.stoneShade;
    c.fill();
    c.restore();
    const face = c.createLinearGradient(20, 20, 130, 170);
    face.addColorStop(0, p.stoneLit);
    face.addColorStop(1, p.stoneShade);
    triangle(c);
    c.fillStyle = face;
    c.fill();
    c.strokeStyle = p.stoneRim;
    c.lineWidth = 0.8;
    c.stroke();
    c.save();
    triangle(c);
    c.clip();
    const random = seededRandom((this.seed ?? 48) ^ 480);
    for (let i = 0; i < 5000; i++) {
      const x = random() * 160,
        y = random() * 200;
      c.fillStyle = i % 3 ? p.stoneDust + '18' : p.stonePit + '55';
      c.fillRect(x, y, 0.15 + random() * 0.45, 0.15 + random() * 0.35);
    }
    c.strokeStyle = p.stonePit + '25';
    c.lineWidth = 0.25;
    for (let i = 0; i < 13; i++) {
      const x = random() * 160,
        y = random() * 170;
      c.beginPath();
      c.moveTo(x, y);
      c.bezierCurveTo(x + 12, y - 4, x + 8, y + 15, x + 25, y + 23);
      c.stroke();
    }
    c.restore();
    this.layer = new DustLayer(
      this.canvas.width,
      this.canvas.height,
      this.scale,
      upwelling.grainRadius,
      [p.sand, p.sandOchre, p.sandLight],
    );
    this.grease = document.createElement('canvas');
    this.grease.width = 160;
    this.grease.height = 200;
    this.greaseContext = this.grease.getContext('2d');
    this.greasePixels = this.greaseContext.createImageData(160, 200);
    this.surface = null;
    this.greaseTime = -Infinity;
  }

  draw(sim, goal, counts) {
    if (this.seed !== sim.config.seed) {
      this.seed = sim.config.seed;
      this.resize();
    }
    const c = this.ctx,
      p = this.palette;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.drawImage(this.background, 0, 0);
    c.setTransform(this.scale, 0, 0, this.scale, 0, 0);
    if (
      this.surface !== sim.surface ||
      this.greaseVersion !== sim.surface.version ||
      sim.surface.time - this.greaseTime > 0.1
    ) {
      const data = this.greasePixels.data;
      data.fill(0);
      sim.surface.visitVisibleCells((index, strength) => {
        const pixel = index * 4;
        data[pixel] = p.greaseRGB[0];
        data[pixel + 1] = p.greaseRGB[1];
        data[pixel + 2] = p.greaseRGB[2];
        data[pixel + 3] = Math.round(100 * Math.min(1, strength / 3) ** 0.75);
      });
      this.greaseContext.putImageData(this.greasePixels, 0, 0);
      this.surface = sim.surface;
      this.greaseVersion = sim.surface.version;
      this.greaseTime = sim.surface.time;
    }
    c.save();
    triangle(c);
    c.clip();
    c.drawImage(this.grease, 0, 0, 160, 200);
    c.restore();
    if (this.showGuide) {
      c.save();
      c.strokeStyle = p.mark + '88';
      c.fillStyle = p.mark + '0c';
      c.lineWidth = 0.4;
      c.setLineDash([1.5, 2]);
      if (goal.type === 'level') {
        triangle(c);
        c.stroke();
      }
      if (goal.type === 'clear') {
        c.beginPath();
        c.arc(goal.patch.x, goal.patch.y, 25, 0, 2 * Math.PI);
        c.fill();
        c.stroke();
      }
      if (goal.type === 'gather')
        for (const point of goal.islands) {
          c.beginPath();
          c.arc(point.x, point.y, 15, 0, 2 * Math.PI);
          c.fill();
          c.stroke();
        }
      if (goal.type === 'piles') {
        c.setLineDash([]);
        goal.targets.forEach(({ x, y, radius, required }, index) => {
          const fill = Math.min(1, counts[index] / required);
          c.fillStyle = p.stonePit + '30';
          c.strokeStyle = p.mark + '6b';
          c.lineWidth = 0.45;
          c.beginPath();
          c.arc(x, y, radius, 0, Math.PI * 2);
          c.fill();
          c.stroke();
          if (fill > 0) {
            c.strokeStyle = p.sandLight;
            c.lineWidth = 0.95;
            c.beginPath();
            c.arc(x, y, radius, -Math.PI / 2, Math.PI * 2 * fill - Math.PI / 2);
            c.stroke();
          }
        });
      }
      if (goal.type === 'paths') {
        c.setLineDash([]);
        c.strokeStyle = p.mark + '14';
        c.lineWidth = 14;
        c.lineCap = 'round';
        c.lineJoin = 'round';
        c.beginPath();
        goal.path.forEach((point, i) => {
          if (!i) c.moveTo(point.x, point.y);
          else c.lineTo(point.x, point.y);
        });
        c.stroke();
        c.setLineDash([1, 3]);
        c.strokeStyle = p.mark + '88';
        c.lineWidth = 0.3;
        c.stroke();
      }
      c.restore();
    }
    if (sim.bubbling && sim.remaining && !this.reducedMotion.matches) {
      const point = sim.activeWell,
        wave = (sim.time * 1.1) % 1;
      c.strokeStyle =
        p.mark +
        Math.round(35 * (1 - wave))
          .toString(16)
          .padStart(2, '0');
      c.lineWidth = 0.35;
      c.beginPath();
      c.arc(point.x, point.y, 2 + wave * 3, 0, Math.PI * 2);
      c.stroke();
    }
    c.setTransform(1, 0, 0, 1, 0, 0);
    this.layer.draw(sim.grains, c);
    c.setTransform(this.scale, 0, 0, this.scale, 0, 0);
    for (const point of this.brushes.values()) {
      c.strokeStyle = p.mark;
      c.fillStyle = p.grease + '14';
      c.lineWidth = 0.35;
      c.beginPath();
      c.arc(point.x, point.y, sim.config.brushWidth / 2, 0, Math.PI * 2);
      c.fill();
      c.stroke();
    }
  }
}
