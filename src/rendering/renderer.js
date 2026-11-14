import { seededRandom } from '../simulation/random.js';
import { challenge } from '../config/challenge.js';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.brush = null;
    this.tool = 'draw';
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
    const haze = c.createRadialGradient(28, 85, 0, 40, 95, 125);
    haze.addColorStop(0, '#292419');
    haze.addColorStop(1, '#111310');
    c.fillStyle = haze;
    c.fillRect(0, 0, 160, 200);
    const beam = c.createLinearGradient(8, 0, 38, 0);
    beam.addColorStop(0, '#3c2f1200');
    beam.addColorStop(0.45, '#a36d1926');
    beam.addColorStop(1, '#3c2f1200');
    c.fillStyle = beam;
    c.fillRect(0, 0, 45, 190);
    c.fillStyle = '#11150f';
    c.beginPath();
    c.moveTo(80, 6);
    c.lineTo(158, 178);
    c.lineTo(2, 178);
    c.closePath();
    c.fill();
    c.strokeStyle = '#9a793e25';
    c.lineWidth = 0.4;
    c.stroke();
    const random = seededRandom(480);
    for (let i = 0; i < 2200; i++) {
      c.fillStyle = i % 3 ? '#c8b48207' : '#00000014';
      c.fillRect(random() * 160, random() * 200, 0.22, 0.22);
    }
  }

  draw(sim, mode = 'free') {
    const c = this.ctx;
    c.setTransform(this.scale, 0, 0, this.scale, 0, 0);
    c.drawImage(this.background, 0, 0, 160, 200);
    c.strokeStyle = '#73725a';
    c.lineWidth = sim.config.ridgeThickness;
    c.lineCap = 'round';
    c.beginPath();
    for (const segment of sim.ridges.segments) {
      c.moveTo(segment.ax, segment.ay);
      c.lineTo(segment.bx, segment.by);
    }
    c.stroke();
    c.strokeStyle = '#bbb18b';
    c.lineWidth = 0.35;
    c.stroke();
    if (!this.reducedMotion.matches) {
      c.strokeStyle = '#e6c88638';
      c.lineWidth = 0.5;
      c.beginPath();
      for (const grain of sim.grains)
        if (Math.abs(grain.vx) + Math.abs(grain.vy) > 10) {
          c.moveTo(grain.x - grain.vx * 0.02, grain.y - grain.vy * 0.02);
          c.lineTo(grain.x, grain.y);
        }
      c.stroke();
    }
    // Reuse a small circular sprite. A single enormous arc path becomes an
    // expensive tessellation at the 6,000-grain cap on phone-sized canvases.
    if (!this.grainSprite || this.spriteRadius !== sim.config.grainRadius) {
      this.spriteRadius = sim.config.grainRadius;
      const diameter = Math.ceil(sim.config.grainRadius * this.scale * 2 + 2);
      this.grainSprite = document.createElement('canvas');
      this.grainSprite.width = diameter;
      this.grainSprite.height = diameter;
      const sprite = this.grainSprite.getContext('2d');
      sprite.fillStyle = '#eee1b5';
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
    for (const grain of sim.grains)
      c.drawImage(
        this.grainSprite,
        grain.x * this.scale - offset,
        grain.y * this.scale - offset,
      );
    c.setTransform(this.scale, 0, 0, this.scale, 0, 0);
    c.fillStyle = '#cbb480';
    c.fillRect(74, 11, 12, 1);
    for (const [x, count, target] of [
      [42.5, sim.left, challenge.leftTarget],
      [117.5, sim.right, challenge.rightTarget],
    ]) {
      c.save();
      c.beginPath();
      c.moveTo(x - 24.5, 181);
      c.quadraticCurveTo(x - 20, 194, x, 194);
      c.quadraticCurveTo(x + 20, 194, x + 24.5, 181);
      c.closePath();
      c.fillStyle = '#28291e';
      c.fill();
      c.clip();
      const fill =
        mode === 'challenge'
          ? Math.min(count / target, 1)
          : Math.min(count / 1600, 1);
      const y = 193 - fill * 12;
      c.fillStyle = '#a28d50';
      c.beginPath();
      c.moveTo(x - 25, y + 2);
      c.quadraticCurveTo(x, y - 3, x + 25, y + 2);
      c.lineTo(x + 25, 195);
      c.lineTo(x - 25, 195);
      c.closePath();
      if (count) c.fill();
      c.restore();
      c.strokeStyle = '#9c956d';
      c.lineWidth = 0.7;
      c.beginPath();
      c.ellipse(x, 181, 24.5, 3, 0, 0, Math.PI * 2);
      c.stroke();
      if (mode === 'challenge') {
        c.strokeStyle = '#e4c578';
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(x - 27, 180);
        c.lineTo(x - 22, 180);
        c.moveTo(x + 22, 180);
        c.lineTo(x + 27, 180);
        c.stroke();
      }
      c.fillStyle = '#e5d6af';
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
    if (this.brush) {
      c.strokeStyle = this.tool === 'rub' ? '#f2e6c5' : '#c5bd9b';
      c.lineWidth = 0.4;
      c.beginPath();
      c.arc(
        this.brush.x,
        this.brush.y,
        this.tool === 'rub'
          ? sim.config.rubWidth / 2
          : sim.config.ridgeThickness / 2,
        0,
        Math.PI * 2,
      );
      c.stroke();
    }
    if (sim.blocked) {
      c.fillStyle = '#f4dfb0';
      c.font = '4px system-ui';
      c.textAlign = 'center';
      c.fillText('Clear the dust below the source', 80, 23);
    }
  }
}
