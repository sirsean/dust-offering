import { seededRandom } from '../simulation/random.js';
import { insideStone, stone as stoneShape } from '../simulation/geometry.js';
import { challenge } from '../config/challenge.js';
import { readPalette } from './palette.js';
import { DustLayer } from './dust-layer.js';
import { DiscoveryMask } from './discovery-mask.js';

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
    this.dustLayer = null;
    this.background = document.createElement('canvas');
    this.background.width = this.canvas.width;
    this.background.height = this.canvas.height;
    let c = this.background.getContext('2d');
    const landscape = c;
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
    // Stone artwork stays separate from the landscape: no rim, shadow or
    // texture is drawn until gameplay has uncovered that part of the face.
    this.stoneTexture = document.createElement('canvas');
    this.stoneTexture.width = this.canvas.width;
    this.stoneTexture.height = this.canvas.height;
    c = this.stoneTexture.getContext('2d');
    c.scale(this.scale, this.scale);
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
    const random = seededRandom(480 ^ (this.visualSeed ?? 0));
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
    c = landscape;
    c.fillStyle = p.ground;
    c.fillRect(0, 198, 160, 2);
    c.strokeStyle = p.groundEdge;
    c.lineWidth = 0.3;
    c.beginPath();
    c.moveTo(0, 198);
    c.lineTo(160, 198);
    c.stroke();
    this.stoneComposite = document.createElement('canvas');
    this.stoneComposite.width = this.canvas.width;
    this.stoneComposite.height = this.canvas.height;
    this.stoneContext = this.stoneComposite.getContext('2d');
    this.discoveryMask = new DiscoveryMask();
    this.treatmentVersion = -1;
  }

  drawStone(sim) {
    const field = sim.discovery;
    if (!field.active.size) return;
    const discoveryChanged = this.discoveryMask.update(field);
    // Rebuild only when discovery grows, a brush edits grease, or grease fades.
    // Sand still renders every frame without recompositing the whole stone.
    if (
      discoveryChanged ||
      this.compositeSurface !== sim.surface ||
      this.compositeTreatmentVersion !== sim.surface.version ||
      (sim.surface.active.size && sim.surface.time - this.compositeTime >= 0.1)
    ) {
      const c = this.stoneContext;
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.clearRect(0, 0, this.canvas.width, this.canvas.height);
      c.drawImage(this.stoneTexture, 0, 0);
      c.setTransform(this.scale, 0, 0, this.scale, 0, 0);
      this.drawTreatment(sim.surface, c);
      c.setTransform(1, 0, 0, 1, 0, 0);
      this.discoveryMask.apply(c);
      this.compositeSurface = sim.surface;
      this.compositeTreatmentVersion = sim.surface.version;
      this.compositeTime = sim.surface.time;
    }
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.drawImage(this.stoneComposite, 0, 0);
    this.ctx.restore();
  }

  drawBowls(sim, mode) {
    const c = this.ctx;
    const p = this.palette;
    for (const [mouth, count, target, arrival] of [
      [
        sim.config.leftMouth,
        sim.left,
        challenge.leftTarget,
        sim.lastCollections[0],
      ],
      [
        sim.config.rightMouth,
        sim.right,
        challenge.rightTarget,
        sim.lastCollections[1],
      ],
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
      const fill = Math.min(
        count / (mode === 'challenge' ? target : sim.config.startingSupply / 2),
        1,
      );
      const y = 193 - fill * 12;
      c.fillStyle = p.bowlDust;
      c.beginPath();
      c.moveTo(x - half - 1, y + 2);
      c.quadraticCurveTo(x, y - 3, x + half + 1, y + 2);
      c.lineTo(x + half + 1, 195);
      c.lineTo(x - half - 1, 195);
      c.closePath();
      if (count) c.fill();
      const age = arrival ? sim.time - arrival.time : Infinity;
      if (!this.reducedMotion.matches && age >= 0 && age < 0.65) {
        // A small wave on the actual bowl surface makes arrivals readable.
        // It uses real collection state, never extra sand or score particles.
        c.strokeStyle = p.sandLight;
        c.globalAlpha = 0.35 * (1 - age / 0.65);
        c.lineWidth = 0.4;
        c.beginPath();
        c.ellipse(
          Math.max(x - half + 5, Math.min(x + half - 5, arrival.x)),
          y + 1,
          1 + age * 8,
          0.3 + age * 1.5,
          0,
          0,
          Math.PI * 2,
        );
        c.stroke();
      }
      c.restore();
      c.strokeStyle = p.bowlRim;
      c.lineWidth = 0.7;
      c.beginPath();
      c.ellipse(x, 181, half, 3, 0, 0, Math.PI * 2);
      c.stroke();
      if (!this.reducedMotion.matches && age >= 0 && age < 0.5) {
        c.save();
        c.strokeStyle = p.mark;
        c.globalAlpha = 0.45 * (1 - age / 0.5);
        c.lineWidth = 1;
        c.beginPath();
        c.ellipse(x, 181, half, 3, 0, 0, Math.PI * 2);
        c.stroke();
        c.restore();
      }
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

  drawTreatment(surface, c = this.ctx) {
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
    if (this.visualSeed !== sim.config.seed) {
      this.visualSeed = sim.config.seed;
      this.resize();
    }
    const c = this.ctx;
    // Cached artwork already matches the backing store. A second resize can
    // resample colors when CSS sizing rounds its height to a fractional pixel.
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.drawImage(this.background, 0, 0);
    c.setTransform(this.scale, 0, 0, this.scale, 0, 0);
    this.drawStone(sim);
    this.drawBowls(sim, mode);
    if (!this.reducedMotion.matches) {
      c.strokeStyle = this.palette.sand + '24';
      c.lineWidth = Math.min(0.4, sim.config.grainRadius * 0.6);
      const trailScale = Math.min(1, sim.config.grainRadius / 0.65);
      c.beginPath();
      for (const grain of sim.grains)
        if (
          !grain.bond &&
          !grain.sleeping &&
          Math.hypot(grain.vx, grain.vy) > 6
        ) {
          c.moveTo(
            grain.x - grain.vx * 0.045 * trailScale,
            grain.y - grain.vy * 0.045 * trailScale,
          );
          c.lineTo(grain.x, grain.y);
        }
      c.stroke();
      c.strokeStyle = this.palette.mark + '65';
      c.lineWidth = Math.min(0.5, sim.config.grainRadius * 0.6);
      c.beginPath();
      for (const grain of sim.grains)
        if (!grain.bond && sim.time - grain.brushedAt < 0.65) {
          c.moveTo(
            grain.x - grain.vx * 0.09 * trailScale,
            grain.y - grain.vy * 0.09 * trailScale,
          );
          c.lineTo(grain.x, grain.y);
        }
      c.stroke();
    }
    if (!this.dustLayer || this.spriteRadius !== sim.config.grainRadius) {
      this.spriteRadius = sim.config.grainRadius;
      this.dustLayer = new DustLayer(
        this.canvas.width,
        this.canvas.height,
        this.scale,
        sim.config.grainRadius,
        [this.palette.sand, this.palette.sandOchre, this.palette.sandLight],
      );
    }
    c.setTransform(1, 0, 0, 1, 0, 0);
    // Missed grains remain here too: their visible ground piles are made from
    // the same particles and contacts as the deposits on the stone.
    this.dustLayer.draw(sim.grains, c);
    c.setTransform(this.scale, 0, 0, this.scale, 0, 0);
    for (const [x, count, target] of [
      [42.5, sim.left, challenge.leftTarget],
      [117.5, sim.right, challenge.rightTarget],
    ]) {
      c.fillStyle = this.palette.text;
      c.font = `${Math.max(6, 13 / (this.canvas.clientWidth / 160))}px ${this.palette.fontFamily}`;
      c.textAlign = 'center';
      c.fillText(
        mode === 'challenge'
          ? `${count.toLocaleString()} / ${target.toLocaleString()}`
          : count.toLocaleString(),
        x,
        199,
        66,
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
    if (sim.blocked && sim.blockReason === 'full') {
      c.fillStyle = this.palette.text;
      c.font = `4.8px ${this.palette.fontFamily}`;
      c.textAlign = 'center';
      c.fillText('A full tray.', 80, 20, 144);
      c.fillText('Reset for a fresh pour.', 80, 28, 144);
    }
  }
}
