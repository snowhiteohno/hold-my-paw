export type MusicMood = "meadow" | "town" | "rain" | "home";
type Chord = readonly [number, number, number, number];
const CHORDS: Record<MusicMood, readonly Chord[]> = {
  meadow: [[48, 60, 64, 67], [45, 60, 64, 69], [41, 60, 65, 69], [43, 59, 62, 67]],
  town: [[53, 60, 65, 69], [48, 60, 64, 67], [50, 62, 65, 69], [43, 59, 62, 67]],
  rain: [[45, 60, 64, 69], [41, 60, 65, 69], [48, 60, 64, 67], [43, 59, 62, 67]],
  home: [[48, 60, 64, 67], [41, 60, 65, 69], [45, 60, 64, 69], [48, 60, 64, 67]],
};
// Original eight-bar phrases. Zeroes are breaths, not silent filler notes.
const MELODIES: Record<MusicMood, readonly number[]> = {
  meadow: [76,0,79,76,74,0, 72,0,76,0,69,0, 72,74,77,0,76,72, 71,0,74,0,67,0,
    76,79,84,0,79,76, 81,0,79,76,72,0, 77,0,76,74,72,0, 71,74,72,0,0,0],
  town: [77,0,81,79,77,0, 76,79,84,0,79,76, 77,0,81,0,74,77, 79,0,74,71,67,0,
    81,79,77,0,72,77, 79,0,76,72,0,76, 77,81,86,0,81,77, 74,0,71,72,0,0],
  rain: [76,0,0,72,0,69, 72,0,0,69,0,65, 67,0,72,0,76,0, 74,0,71,0,0,0,
    76,0,81,0,79,76, 77,0,76,0,72,0, 76,0,74,72,0,67, 71,0,72,0,0,0],
  home: [72,0,76,79,0,84, 81,0,77,0,76,72, 76,0,81,79,76,0, 74,0,72,0,0,0,
    79,0,84,0,83,79, 81,79,77,0,76,72, 76,0,79,81,79,76, 74,0,72,0,0,0],
};
const TEMPO: Record<MusicMood, number> = { meadow: 82, town: 96, rain: 68, home: 78 };
const frequency = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

export class Soundscape {
  private context: AudioContext | null = null;
  private gain: GainNode | null = null;
  private echo: DelayNode | null = null;
  private echoGain: GainNode | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private step = 0;
  private nextBeat = 0;
  private mood: MusicMood = "meadow";
  private requestedMood: MusicMood = "meadow";
  private volume = 0.55;
  private visibilityBound = false;
  private destroyed = false;
  enabled = false;

  setMood(mood: MusicMood) { this.requestedMood = mood; }
  setVolume(value: number) {
    this.volume = Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0.55;
    this.updateGain();
  }
  private updateGain() {
    if (this.gain && this.context) {
      const audible = this.enabled && !document.hidden;
      this.gain.gain.setTargetAtTime(audible ? this.volume * 0.8 : 0, this.context.currentTime, 0.12);
    }
  }
  private visibility = () => {
    this.updateGain();
    // Discard missed beats instead of playing a burst when the tab returns.
    if (!document.hidden && this.context) this.nextBeat = this.context.currentTime + 0.06;
  };
  async enable(value: boolean) {
    if (this.destroyed) return;
    this.enabled = value;
    if (!value) {
      this.updateGain();
      if (this.timer) clearInterval(this.timer);
      this.timer = null;
      return;
    }
    try {
      if (!this.context) {
        this.context = new AudioContext();
        this.gain = this.context.createGain();
        this.gain.gain.value = 0;
        this.gain.connect(this.context.destination);
        this.echo = this.context.createDelay(1);
        this.echo.delayTime.value = 0.27;
        this.echoGain = this.context.createGain();
        this.echoGain.gain.value = 0.16;
        this.echo.connect(this.echoGain);
        this.echoGain.connect(this.gain);
      }
      if (!this.visibilityBound) {
        document.addEventListener("visibilitychange", this.visibility);
        this.visibilityBound = true;
      }
      await this.context.resume();
      if (!this.enabled || this.destroyed) return;
      this.updateGain();
      if (!this.timer) {
        this.nextBeat = this.context.currentTime + 0.06;
        this.schedule();
        this.timer = setInterval(() => this.schedule(), 60);
      }
    } catch {
      this.enabled = false;
      this.updateGain();
    }
  }
  private note(f: number, duration: number, volume = 0.12, delay = 0,
    type: OscillatorType = "sine", attack = 0.012, echo = false) {
    if (!this.enabled || !this.context || !this.gain || document.hidden) return;
    const c = this.context, o = c.createOscillator(), g = c.createGain();
    const start = c.currentTime + delay;
    o.type = type;
    o.frequency.value = f;
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(volume, start + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    o.connect(g); g.connect(this.gain);
    if (echo && this.echo) g.connect(this.echo);
    o.start(start); o.stop(start + duration + 0.04);
    o.onended = () => { o.disconnect(); g.disconnect(); };
  }
  private schedule() {
    if (!this.enabled || !this.context || document.hidden) return;
    const now = this.context.currentTime;
    if (this.nextBeat < now - 0.2) this.nextBeat = now + 0.03;
    while (this.nextBeat < now + 0.15) {
      // Change harmony and tempo only at bar boundaries.
      if (this.step % 6 === 0) this.mood = this.requestedMood;
      const beat = 30 / TEMPO[this.mood];
      this.music(this.step, this.nextBeat - now, beat);
      this.step = (this.step + 1) % 48;
      this.nextBeat += beat;
    }
  }
  private music(step: number, delay: number, beat: number) {
    const chord = CHORDS[this.mood][Math.floor(step / 6) % 4];
    const position = step % 6;
    const melody = MELODIES[this.mood][step];
    if (melody) {
      // A soft music-box tone, with a quieter upper partial and a single echo.
      this.note(frequency(melody), beat * 3.8, 0.085, delay, "sine", 0.01, true);
      this.note(frequency(melody) * 2, beat * 1.6, 0.009, delay, "sine", 0.008);
    }
    if (position === 0) {
      this.note(frequency(chord[0]), beat * 5.5, 0.065, delay, "sine", 0.12);
      for (const pitch of chord.slice(1))
        this.note(frequency(pitch), beat * 6, 0.018, delay, "sine", beat * 0.7);
    }
    const arpeggio = [1, 2, 3, 2, 1, 3][position];
    if (this.mood !== "rain" || position % 2 === 0)
      this.note(frequency(chord[arpeggio]), beat * 1.9, 0.026, delay, "triangle", 0.02, true);
  }
  play(kind: "light" | "friend" | "bell" | "bump" | "win" | "hug") {
    if (kind === "light") { this.note(880, 0.25, 0.1); this.note(1174, 0.35, 0.06, 0.08); }
    if (kind === "friend") [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this.note(f, 0.7, 0.13, i * 0.13, "sine", 0.012, true));
    if (kind === "bell") { this.note(659, 0.9, 0.12); this.note(987, 1.2, 0.08, 0.12); }
    if (kind === "bump") { this.note(196, 0.35, 0.09); this.note(146, 0.45, 0.07, 0.12); }
    if (kind === "win") [392, 523, 659, 784, 1046].forEach((f, i) => this.note(f, 1.5, 0.12, i * 0.2, "sine", 0.015, true));
    if (kind === "hug") { this.note(440, 0.25, 0.07); this.note(659, 0.35, 0.06, 0.06); }
  }
  destroy() {
    this.destroyed = true;
    this.enabled = false;
    if (this.timer) clearInterval(this.timer);
    if (this.visibilityBound) document.removeEventListener("visibilitychange", this.visibility);
    this.visibilityBound = false;
    void this.context?.close().catch(() => {});
    this.context = null; this.gain = null; this.echo = null; this.echoGain = null; this.timer = null;
  }
}
