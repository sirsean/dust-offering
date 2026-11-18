import { seededRandom } from '../simulation/random.js';

// Quiet material feedback. Nothing is created or audible until Sound is enabled.
export class MaterialAudio {
  constructor() {
    this.enabled = false;
    this.context = null;
    this.previous = [0, 0];
    this.lastTone = [0, 0];
    this.previousSim = null;
    this.lastBrush = 0;
    this.lastScrape = -Infinity;
    this.brushEvents = 0;
    this.bowlEvents = 0;
    this.voices = new Set();
  }

  prepare() {
    this.master = this.context.createGain();
    this.master.gain.value = 0.8;
    this.master.connect(this.context.destination);
    const random = seededRandom(3601);
    const buffer = this.context.createBuffer(
      1,
      this.context.sampleRate / 2,
      this.context.sampleRate,
    );
    const samples = buffer.getChannelData(0);
    let value = 0;
    for (let i = 0; i < samples.length; i++) {
      value = value * 0.85 + (random() * 2 - 1) * 0.15;
      samples[i] = value;
    }
    this.texture = this.context.createBufferSource();
    this.texture.buffer = buffer;
    this.texture.loop = true;
    this.textureFilter = this.context.createBiquadFilter();
    this.textureFilter.type = 'bandpass';
    this.textureFilter.frequency.value = 1300;
    this.textureFilter.Q.value = 0.65;
    this.textureGain = this.context.createGain();
    this.textureGain.gain.value = 0;
    this.texture.connect(this.textureFilter);
    this.textureFilter.connect(this.textureGain);
    this.textureGain.connect(this.master);
    this.texture.start();
  }

  async toggle() {
    if (!this.enabled) {
      const Context = window.AudioContext ?? window.webkitAudioContext;
      if (!Context) return false;
      if (!this.context) {
        this.context = new Context();
        this.prepare();
      }
      await this.context.resume();
    }
    this.enabled = !this.enabled;
    if (!this.enabled) {
      this.quiet();
      await this.context?.suspend();
    }
    return this.enabled;
  }

  quiet() {
    if (!this.context) return;
    const now = this.context.currentTime;
    this.textureGain.gain.cancelScheduledValues(now);
    this.textureGain.gain.setValueAtTime(0, now);
    for (const voice of this.voices) voice.stop(now);
  }

  update(sim) {
    const counts = [sim.left ?? 0, sim.right ?? 0];
    if (this.previousSim !== sim) {
      this.previousSim = sim;
      this.previous = counts;
      this.lastBrush = sim.brushFeedback.serial;
      this.quiet();
      return;
    }
    const now = this.context?.currentTime ?? 0;
    if (sim.brushFeedback.serial !== this.lastBrush) {
      this.lastBrush = sim.brushFeedback.serial;
      if (this.enabled && now - this.lastScrape >= 0.045) {
        const intensity = Math.min(1, sim.brushFeedback.moved / 18);
        this.textureFilter.frequency.setTargetAtTime(
          900 + intensity * 800,
          now,
          0.025,
        );
        this.textureGain.gain.cancelScheduledValues(now);
        this.textureGain.gain.setTargetAtTime(
          0.012 + intensity * 0.028,
          now,
          0.012,
        );
        this.textureGain.gain.setTargetAtTime(0, now + 0.08, 0.04);
        this.lastScrape = now;
        this.brushEvents++;
      }
    }
    for (let i = 0; i < 2; i++) {
      if (
        this.enabled &&
        counts[i] > this.previous[i] &&
        now - this.lastTone[i] >= 0.18
      ) {
        const oscillator = this.context.createOscillator();
        const gain = this.context.createGain();
        oscillator.frequency.value = i === 0 ? 196 : 246.94;
        const amount = Math.min(1, (counts[i] - this.previous[i]) / 5);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.018 + amount * 0.007, now + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.36);
        oscillator.connect(gain);
        gain.connect(this.master);
        oscillator.start(now);
        this.voices.add(oscillator);
        oscillator.stop(now + 0.38);
        oscillator.onended = () => {
          this.voices.delete(oscillator);
          oscillator.disconnect();
          gain.disconnect();
        };
        this.lastTone[i] = now;
        this.bowlEvents++;
      }
    }
    this.previous = counts;
  }
}
