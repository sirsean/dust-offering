export class BowlAudio {
  constructor() {
    this.enabled = false;
    this.context = null;
    this.previous = [0, 0];
    this.lastTone = [0, 0];
  }
  async toggle() {
    if (!this.enabled) {
      const Context = window.AudioContext ?? window.webkitAudioContext;
      if (!Context) return false;
      this.context ??= new Context();
      await this.context.resume();
    }
    this.enabled = !this.enabled;
    if (!this.enabled) await this.context?.suspend();
    return this.enabled;
  }
  update(sim) {
    const counts = [sim.left, sim.right];
    const now = this.context?.currentTime ?? 0;
    for (let i = 0; i < 2; i++) {
      if (
        this.enabled &&
        counts[i] > this.previous[i] &&
        now - this.lastTone[i] >= 0.18
      ) {
        const oscillator = this.context.createOscillator();
        const gain = this.context.createGain();
        oscillator.frequency.value = i === 0 ? 196 : 246.94;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.025, now + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);
        oscillator.connect(gain);
        gain.connect(this.context.destination);
        oscillator.start(now);
        oscillator.stop(now + 0.25);
        oscillator.onended = () => {
          oscillator.disconnect();
          gain.disconnect();
        };
        this.lastTone[i] = now;
      }
    }
    this.previous = counts;
  }
}
