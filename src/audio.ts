export class Soundscape {
  private context: AudioContext | null = null;
  private gain: GainNode | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private step = 0;
  enabled = false;
  async enable(value: boolean) {
    this.enabled = value;
    if (!value) {
      if (this.gain)
        this.gain.gain.setTargetAtTime(0, this.context!.currentTime, 0.15);
      if (this.timer) clearInterval(this.timer);
      this.timer = null;
      return;
    }
    try {
      this.context ??= new AudioContext();
      this.gain ??= this.context.createGain();
      this.gain.connect(this.context.destination);
      this.gain.gain.setTargetAtTime(0.2, this.context.currentTime, 0.2);
      await this.context.resume();
      if (!this.timer) {
        this.music();
        this.timer = setInterval(() => this.music(), 650);
      }
    } catch {
      this.enabled = false;
    }
  }
  private note(
    f: number,
    duration: number,
    volume = 0.12,
    delay = 0,
    type: OscillatorType = "sine",
  ) {
    if (!this.enabled || !this.context || !this.gain) return;
    const c = this.context,
      o = c.createOscillator(),
      g = c.createGain(),
      start = c.currentTime + delay;
    o.type = type;
    o.frequency.value = f;
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(volume, start + 0.015);
    g.gain.exponentialRampToValueAtTime(0.001, start + duration);
    o.connect(g);
    g.connect(this.gain);
    o.start(start);
    o.stop(start + duration + 0.05);
    o.onended = () => {
      o.disconnect();
      g.disconnect();
    };
  }
  private music() {
    const notes = [
      261.63, 0, 329.63, 392, 0, 293.66, 0, 329.63, 220, 0, 261.63, 329.63, 0,
      293.66, 0, 196,
    ];
    const n = notes[this.step++ % notes.length];
    if (n) this.note(n, 1.4, 0.09);
    if (this.step % 8 === 1)
      this.note(this.step % 16 === 1 ? 130.81 : 110, 3, 0.055);
  }
  play(kind: "light" | "friend" | "bell" | "bump" | "win" | "hug") {
    if (kind === "light") {
      this.note(880, 0.22, 0.15);
      this.note(1174, 0.3, 0.08, 0.08);
    }
    if (kind === "friend") {
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
        this.note(f, 0.6, 0.2, i * 0.13),
      );
    }
    if (kind === "bell") {
      this.note(659, 0.9, 0.2);
      this.note(987, 1.2, 0.12, 0.12);
    }
    if (kind === "bump") {
      this.note(196, 0.35, 0.13);
      this.note(146, 0.45, 0.12, 0.12);
    }
    if (kind === "win") {
      [392, 523, 659, 784, 1046].forEach((f, i) =>
        this.note(f, 1.3, 0.17, i * 0.2),
      );
    }
    if (kind === "hug") {
      this.note(440, 0.2, 0.1);
      this.note(659, 0.3, 0.1, 0.06);
    }
  }
  destroy() {
    if (this.timer) clearInterval(this.timer);
    void this.context?.close();
    this.context = null;
    this.timer = null;
  }
}
