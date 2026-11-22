import { readPalette } from '../rendering/palette.js';
import { DiscoveryMask } from '../rendering/discovery-mask.js';
import { DustLayer } from '../rendering/dust-layer.js';
import { drawPileRings } from '../rendering/pile-rings.js';
import { seededRandom } from '../simulation/random.js';
import { stone } from '../simulation/geometry.js';
import { upwelling } from '../config/upwelling.js';

function triangle(c) {
  c.beginPath();
  c.moveTo(stone.x, stone.top);
  c.lineTo(stone.x + stone.halfWidth, stone.bottom);
  c.lineTo(stone.x - stone.halfWidth, stone.bottom);
  c.closePath();
}

export class StudyRenderer {
  constructor(canvas, { stoneSeed } = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.stoneSeed = stoneSeed;
    this.discoveryMask = new DiscoveryMask();
    this.brushes = new Map();
    this.showGuide = true;
    this.reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    this.resizePending = true;
    // Keep the previous image until draw can resize and repaint together.
    this.observer = new ResizeObserver(() => {
      this.resizePending = true;
    });
    this.observer.observe(canvas);
  }

  resize(seedChanged) {
    this.resizePending = false;
    const cssWidth = this.canvas.getBoundingClientRect().width;
    const width = Math.max(
      1,
      Math.round(cssWidth * Math.min(devicePixelRatio || 1, 2)),
    );
    const height = Math.round(width * 1.25);
    const sizeChanged =
      this.canvas.width !== width || this.canvas.height !== height;
    if (!sizeChanged && !seedChanged && this.background) return;
    if (sizeChanged) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
    this.scale = width / 160;
    this.palette = readPalette(this.canvas);
    const p = this.palette;
    this.background = document.createElement('canvas');
    this.background.width = this.canvas.width;
    this.background.height = this.canvas.height;
    let c = this.background.getContext('2d');
    c.scale(this.scale, this.scale);
    c.fillStyle = p.scene;
    c.fillRect(0, 0, 160, 200);
    const ground = c.createRadialGradient(80, 100, 0, 80, 100, 130);
    ground.addColorStop(0, p.haze);
    ground.addColorStop(1, p.scene);
    c.fillStyle = ground;
    c.fillRect(0, 0, 160, 200);

    this.stoneTexture = document.createElement('canvas');
    this.stoneTexture.width = width;
    this.stoneTexture.height = height;
    c = this.stoneTexture.getContext('2d');
    c.scale(this.scale, this.scale);
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
    this.stoneComposite = document.createElement('canvas');
    this.stoneComposite.width = width;
    this.stoneComposite.height = height;
    this.stoneContext = this.stoneComposite.getContext('2d');
    this.surface = null;
  }

  drawStone({ discovery, surface }) {
    if (discovery && !discovery.active.size) return;
    const discoveryChanged = discovery && this.discoveryMask.update(discovery);
    const greaseChanged =
      this.surface !== surface ||
      this.greaseVersion !== surface.version ||
      (surface.active.size && surface.time - this.greaseTime > 0.1);
    if (greaseChanged) {
      const { greaseRGB } = this.palette;
      const data = this.greasePixels.data;
      data.fill(0);
      surface.visitVisibleCells((index, strength) => {
        const pixel = index * 4;
        data[pixel] = greaseRGB[0];
        data[pixel + 1] = greaseRGB[1];
        data[pixel + 2] = greaseRGB[2];
        data[pixel + 3] = Math.round(100 * Math.min(1, strength / 3) ** 0.75);
      });
      this.greaseContext.putImageData(this.greasePixels, 0, 0);
      this.surface = surface;
      this.greaseVersion = surface.version;
      this.greaseTime = surface.time;
    }
    if (greaseChanged || discoveryChanged) {
      const c = this.stoneContext;
      c.clearRect(0, 0, c.canvas.width, c.canvas.height);
      c.drawImage(this.stoneTexture, 0, 0);
      c.save();
      c.scale(this.scale, this.scale);
      triangle(c);
      c.clip();
      c.drawImage(this.grease, 0, 0, 160, 200);
      c.restore();
      if (discovery) this.discoveryMask.apply(c);
    }
    this.ctx.drawImage(this.stoneComposite, 0, 0);
  }

  draw(sim, goal, counts) {
    const seed = this.stoneSeed ?? sim.config.seed;
    const seedChanged = this.seed !== seed;
    if (this.resizePending || seedChanged) {
      this.seed = seed;
      this.resize(seedChanged);
    }
    const c = this.ctx,
      p = this.palette;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.drawImage(this.background, 0, 0);
    this.drawStone(sim);
    c.setTransform(this.scale, 0, 0, this.scale, 0, 0);
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
      if (goal.type === 'piles')
        drawPileRings(c, p, goal.targets, counts, sim.config.seed);
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
