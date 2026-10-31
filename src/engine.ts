import {
  ENCOUNTERS,
  newEncounterState,
  advanceEncounter,
  canPassEncounter,
  encounterAnchor,
  boatPosition,
  canBoardBoat,
  BOAT_SECONDS,
  WARMTH,
  HOME,
  CARRY_WIDTH,
  canReachHome,
  type SequencePhase,
} from "./adventure";
import {
  drawEncounter,
  drawPaperBoat,
  drawHome,
  drawHeart,
} from "./adventureArt";
import {
  LEVELS,
  FRIENDS,
  clamp,
  dist,
  canFinish,
  starsFor,
  partyTraits,
  type FriendId,
  type Level,
} from "./levels";
import {
  drawWorldBackground,
  drawForeground,
  drawPerch,
  drawFriend,
  drawStar,
  drawGoal,
  drawBell,
  drawObstacle,
  drawHazard,
  ellipse,
  line,
  starPath,
  roundRect,
  type Ctx,
} from "./art";
import type { Soundscape } from "./audio";
export type StepGuide = {
  id: string;
  title: string;
  steps: string[];
  friend?: FriendId;
};
export type HUD = {
  challenge: {
    title: string;
    description: string;
    progress: number;
    remaining: number;
    friend: FriendId;
  } | null;
  phase: SequencePhase;
  remaining: number;
  hearts: number;
  party: FriendId[];
  lights: number;
  total: number;
  time: number;
  hug: number;
  bumps: number;
  progress: number;
  message: string;
  goalReady: boolean;
  nextStop: { name: string; angle: number };
};
export type Result = {
  lights: number;
  total: number;
  time: number;
  bumps: number;
  stars: number;
};
type Body = { id: FriendId; x: number; y: number; px: number; py: number };
type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  color: string;
  r: number;
  shape: "star" | "dot";
};
export function resolveCircle(
  p: { x: number; y: number },
  o: { x: number; y: number; r: number },
  padding: number,
) {
  const d = dist(p, o),
    min = o.r + padding;
  if (d >= min) return false;
  const nx = d < 0.001 ? 0 : (p.x - o.x) / d,
    ny = d < 0.001 ? -1 : (p.y - o.y) / d;
  p.x = o.x + nx * min;
  p.y = o.y + ny * min;
  return true;
}
export class GameEngine {
  canvas: HTMLCanvasElement;
  ctx: Ctx;
  level: Level;
  index: number;
  party: Body[] = [];
  star = { x: 0, y: 0, vx: 0, vy: 0 };
  camera = 0;
  logicalWidth = 1280;
  paused = true;
  reduced = false;
  finished = false;
  phase: SequencePhase = "journey";
  encounters = ENCOUNTERS.map((list) => list.map(newEncounterState));
  private mobileHelp = false;
  private boatTime = -1.5;
  private boardHold = 0;
  private fadeTime = 0;
  private warmth = new Set<number>();
  private get worldWidth() {
    return this.phase === "carry" ? CARRY_WIDTH : this.level.width;
  }
  private pointer = { x: 0, y: 0, down: false, id: null as number | null };
  private keys = new Set<string>();
  private raf = 0;
  private previous = 0;
  private elapsed = 0;
  private visualTime = 0;
  private hudTimer = 0;
  private collected = new Set<number>();
  private rescued = new Set<FriendId>();
  private visited = new Set<number>();
  private checkpoint = { x: 0, y: 0 };
  private bumps = 0;
  private invulnerable = 0;
  private bubble = 0;
  private hug = 1;
  private mobileHug = false;
  private particles: Particle[] = [];
  private message = "";
  private messageUntil = 0;
  private goalHold = 0;
  private resizeObserver: ResizeObserver;
  private disposed = false;
  onHUD: (hud: HUD) => void;
  onFriend: (id: FriendId) => void;
  onWin: (result: Result) => void;
  onPause: () => void;
  onTutorial: (guide: StepGuide) => void;
  private seenGuides = new Set<string>();
  sound: Soundscape;
  constructor(
    canvas: HTMLCanvasElement,
    index: number,
    sound: Soundscape,
    callbacks: {
      onHUD: (h: HUD) => void;
      onFriend: (id: FriendId) => void;
      onWin: (r: Result) => void;
      onPause: () => void;
      onTutorial: (guide: StepGuide) => void;
    },
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.index = index;
    this.level = LEVELS[index];
    this.sound = sound;
    Object.assign(this, callbacks);
    this.onHUD = callbacks.onHUD;
    this.onFriend = callbacks.onFriend;
    this.onWin = callbacks.onWin;
    this.onPause = callbacks.onPause;
    this.onTutorial = callbacks.onTutorial;
    this.star = { ...this.level.start, vx: 0, vy: 0 };
    this.checkpoint = { ...this.level.start };
    this.party = this.level.initial.map((id, i) => ({
      id,
      x: this.star.x,
      y: this.star.y + (i + 1) * 48,
      px: this.star.x,
      py: this.star.y + (i + 1) * 48,
    }));
    this.message = this.level.hint;
    this.messageUntil = 10;
    this.resizeObserver = new ResizeObserver(this.resize);
    this.resizeObserver.observe(canvas);
    this.resize();
    canvas.addEventListener("pointerdown", this.pointerDown);
    canvas.addEventListener("pointermove", this.pointerMove);
    canvas.addEventListener("contextmenu", this.contextMenu);
    window.addEventListener("pointerup", this.pointerUp);
    window.addEventListener("pointercancel", this.pointerUp);
    window.addEventListener("keydown", this.keyDown);
    window.addEventListener("keyup", this.keyUp);
    window.addEventListener("blur", this.blur);
    document.addEventListener("visibilitychange", this.visibility);
    this.emitHUD();
    this.raf = requestAnimationFrame(this.frame);
  }
  private resize = () => {
    const r = this.canvas.getBoundingClientRect(),
      // Keep the physics canvas sharp without filling a retina screen with
      // millions of unnecessary translucent pixels. The HTML HUD stays native-res.
      dpr = Math.min(devicePixelRatio || 1, 1.5);
    this.canvas.width = Math.round(r.width * dpr);
    this.canvas.height = Math.round(r.height * dpr);
    this.logicalWidth = (r.width / r.height) * 800;
  };
  private pointerMove = (e: PointerEvent) => {
    if (this.pointer.id !== null && e.pointerId !== this.pointer.id) return;
    const r = this.canvas.getBoundingClientRect();
    this.pointer.x = ((e.clientX - r.left) / r.width) * this.logicalWidth;
    this.pointer.y = ((e.clientY - r.top) / r.height) * 800;
  };
  private pointerDown = (e: PointerEvent) => {
    if (this.paused || e.button !== 0 || this.pointer.down) return;
    e.preventDefault();
    this.pointerMove(e);
    this.pointer.down = true;
    this.pointer.id = e.pointerId;
    this.canvas.setPointerCapture(e.pointerId);
  };
  private pointerUp = (e: PointerEvent) => {
    if (e.pointerId !== this.pointer.id) return;
    this.pointer.down = false;
    this.pointer.id = null;
  };
  private contextMenu = (e: Event) => e.preventDefault();
  private keyDown = (e: KeyboardEvent) => {
    if (this.paused || this.finished) return;
    if (["Escape", "KeyP"].includes(e.code)) {
      e.preventDefault();
      this.onPause();
      return;
    }
    if (
      [
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
        "KeyW",
        "KeyA",
        "KeyS",
        "KeyD",
        "Space",
        "KeyQ",
        "KeyE",
      ].includes(e.code)
    ) {
      e.preventDefault();
      if (e.code === "KeyQ" && !e.repeat) this.rotateParty();
      this.keys.add(e.code);
    }
  };
  private keyUp = (e: KeyboardEvent) => this.keys.delete(e.code);
  private blur = () => {
    this.clearInput();
    if (!this.paused && !this.finished) this.onPause();
  };
  private visibility = () => {
    if (document.hidden) this.blur();
  };
  clearInput() {
    if (
      this.pointer.id !== null &&
      this.canvas.hasPointerCapture(this.pointer.id)
    ) {
      this.canvas.releasePointerCapture(this.pointer.id);
    }
    this.pointer.down = false;
    this.pointer.id = null;
    this.mobileHug = false;
    this.mobileHelp = false;
    this.keys.clear();
  }
  setPaused(p: boolean) {
    this.paused = p;
    if (p) this.clearInput();
    this.previous = 0;
  }
  setHug(h: boolean) {
    this.mobileHug = h;
  }
  setHelp(value: boolean) {
    this.mobileHelp = value;
  }
  setLeader(id: FriendId) {
    if (this.paused || this.phase !== "journey") return;
    const index = this.party.findIndex((p) => p.id === id);
    if (index < 0) return;
    const ids = this.party.map((p) => p.id);
    const reordered = [...ids.slice(index), ...ids.slice(0, index)];
    this.party.forEach((p, i) => (p.id = reordered[i]));
    this.emitHUD();
  }
  rotateParty() {
    if (this.party.length < 2 || this.paused || this.phase !== "journey")
      return;
    const ids = this.party.map((p) => p.id);
    ids.push(ids.shift()!);
    this.party.forEach((p, i) => (p.id = ids[i]));
    this.say(`${FRIENDS[ids[0]].name} is holding your paw now.`, 3);
    this.emitHUD();
  }
  private say(text: string, seconds = 4) {
    this.message = text;
    this.messageUntil = this.elapsed + seconds;
  }
  private burst(x: number, y: number, n: number, color = "#f2d68c") {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2,
        speed = 25 + Math.random() * 95,
        life = 0.6 + Math.random() * 0.8;
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        life,
        max: life,
        color,
        r: 2 + Math.random() * 4,
        shape: i % 3 === 0 ? "star" : "dot",
      });
    }
  }
  private resetToBell() {
    if (this.invulnerable > 0 || this.finished) return;
    this.bumps++;
    this.bubble = 1.5;
    this.invulnerable = 3;
    this.star = { ...this.checkpoint, vx: 0, vy: 0 };
    this.party.forEach((p, i) => {
      p.x = this.star.x;
      p.y = this.star.y + (i + 1) * 35;
      p.px = p.x;
      p.py = p.y;
    });
    this.camera = clamp(
      this.star.x - this.logicalWidth * 0.35,
      0,
      Math.max(0, this.worldWidth - this.logicalWidth),
    );
    this.pointer.down = false;
    this.goalHold = 0;
    this.say(
      "A little wobble. Everyone’s safe. Try a different way around!",
      4,
    );
    this.sound.play("bump");
    this.burst(this.star.x, this.star.y, 20, "#d4e7d9");
  }
  private emitHUD() {
    const friend = this.level.friends.find((f) => !this.rescued.has(f.id));
    const pending = ENCOUNTERS[this.index].find(
      (_, i) => !this.encounters[this.index][i].cleared,
    );
    const challenge =
      pending && Math.abs(this.star.x - pending.x) < 360 ? pending : null;
    const cs = challenge
      ? this.encounters[this.index][ENCOUNTERS[this.index].indexOf(challenge)]
      : null;
    const gate = pending && (!friend || pending.x < friend.x) ? pending : null;
    const destination =
      this.phase === "carry"
        ? (WARMTH.find((_, i) => !this.warmth.has(i)) ?? HOME)
        : this.phase === "boat"
          ? boatPosition(this.boatTime)
          : gate
            ? encounterAnchor(gate)
            : (friend ?? this.level.goal);
    this.onHUD({
      challenge:
        challenge && cs
          ? {
              title: challenge.title,
              description: challenge.description,
              progress: cs.progress,
              remaining: cs.openFor,
              friend: challenge.friend,
            }
          : null,
      phase: this.phase,
      remaining: Math.max(0, BOAT_SECONDS - this.boatTime),
      hearts: this.warmth.size,
      party: this.party.map((p) => p.id),
      lights: this.collected.size,
      total: this.level.lights.length,
      time: this.elapsed,
      hug: this.hug,
      bumps: this.bumps,
      progress: clamp(this.star.x / this.worldWidth, 0, 1),
      message: this.elapsed < this.messageUntil ? this.message : "",
      goalReady: canFinish(
        this.level,
        this.party.map((p) => p.id),
      ),
      nextStop: {
        name:
          this.phase === "carry"
            ? "Carry our star home"
            : this.phase === "boat"
              ? "Hold paws above the boat"
              : gate
                ? gate.title
                : friend
                  ? FRIENDS[friend.id].name
                  : "The way home",
        angle:
          (Math.atan2(
            destination.y - this.star.y,
            destination.x - this.star.x,
          ) *
            180) /
          Math.PI,
      },
    });
  }
  private showStepGuide(): boolean {
    let guide: StepGuide | undefined;
    if (this.phase === "boat")
      guide = {
        id: "boat",
        title: "Catch the paper boat",
        steps: [
          "Fly your star into the dotted oval ABOVE the moving boat. Aim above the paper folds, not below the hull.",
          "Stay close and hold Space (or Hold paws) for about a second to board together.",
          "You have ten seconds after the introduction. Miss it? Another boat comes, with all your friends safe.",
        ],
      };
    else if (this.phase === "carry")
      guide = {
        id: "carry",
        title: "Now they carry you",
        steps: [
          "Your friends have caught the tired star. Use the same movement controls to guide the whole group.",
          "Collect the three pink hearts to warm the star back up.",
          "Then fly to the cottage marked HOME. There is no timer here.",
        ],
      };
    else if (this.phase === "journey") {
      const e = ENCOUNTERS[this.index].find(
        (e, i) =>
          !this.encounters[this.index][i].cleared &&
          Math.abs(this.star.x - encounterAnchor(e).x) < 200 &&
          this.party.some((p) => p.id === e.friend),
      );
      if (e)
        guide = {
          id: e.id,
          title: e.title,
          friend: e.friend,
          steps: [
            `Click ${FRIENDS[e.friend].name}’s portrait below, or press Q until ${FRIENDS[e.friend].name} is the first friend beneath your star.`,
            "Move the STAR into the dotted circle to the left of the gate.",
            e.friend === "mochi"
              ? "Release Space so Mochi can stretch. Hold E (or Help) until the meter fills and the trellis opens."
              : e.friend === "boba"
                ? "Steer against the gust to stay inside the circle. Hold E (or Help) until Boba settles the wind."
                : e.friend === "puff"
                  ? "Hold E (or Help) until the meter fills. Release it, then fly UP and RIGHT through the high arch before it closes."
                  : "Hold E (or Help) until the meter fills. Release it, then fly RIGHT through the petals before they close. Do not hold Space; it slows you down.",
            e.window > 0
              ? "If the opening closes, return to the circle and try again."
              : "Once the trellis opens, fly right through it. It will stay open.",
          ],
        };
      else if (
        this.index === 0 &&
        this.level.bells.some((b) => dist(this.star, b) < 120)
      )
        guide = {
          id: "checkpoint",
          title: "A little safe place",
          steps: [
            "Fly close to this golden bell to save your place.",
            "Touching a spinning seed pod or dipping your star in the water brings you back to the last bell. Friends and fireflies stay with you.",
            "Hold Space (or Hold paws) to gather your chain through tight spots. Release it to recharge and fly faster.",
          ],
        };
    }
    if (!guide || this.seenGuides.has(guide.id)) return false;
    this.seenGuides.add(guide.id);
    this.setPaused(true);
    this.emitHUD();
    this.onTutorial(guide);
    return true;
  }
  private update(dt: number) {
    if (this.showStepGuide()) return;
    this.elapsed += dt;
    if (this.phase === "fading") {
      this.fadeTime += dt;
      const boat = boatPosition(this.boatTime);
      this.star.x = boat.x;
      this.star.y = boat.y - 130 + Math.min(1, this.fadeTime / 2) * 65;
      this.party.forEach((p, i) => {
        p.x = boat.x + (i - 1.5) * 45;
        p.y = boat.y - 15;
      });
      if (this.fadeTime > 4.8) {
        this.phase = "carry";
        this.star.y = 420;
        this.star.vx = 0;
        this.star.vy = 0;
        this.clearInput();
        this.say(
          "You carried us. Our turn. Gather three warm hearts and bring our star home.",
          9,
        );
      }
      this.emitHUD();
      return;
    }
    this.invulnerable = Math.max(0, this.invulnerable - dt);
    this.bubble = Math.max(0, this.bubble - dt);
    const hugging =
      (this.keys.has("Space") || this.mobileHug) && this.hug > 0.01;
    this.hug = clamp(
      this.hug +
        (hugging
          ? -0.34
          : this.keys.has("Space") || this.mobileHug
            ? 0
            : 0.22) *
          dt,
      0,
      1,
    );
    const traits = partyTraits(
      this.party.map((p) => p.id),
      hugging,
    );
    let wind = 0;
    for (const z of this.level.winds)
      if (this.star.x > z.x && this.star.x < z.x + z.w)
        wind += z.strength * (0.65 + Math.sin(this.elapsed * 2) * 0.35);
    ENCOUNTERS[this.index].forEach((e, i) => {
      if (
        e.friend === "boba" &&
        !this.encounters[this.index][i].cleared &&
        Math.abs(this.star.x - (e.x - 160)) < 180
      )
        wind -= 160;
    });
    wind *= traits.wind;
    // Hold a stable hover while preparing a skill; Boba's puzzle deliberately keeps its gust.
    if (this.mobileHelp || this.keys.has("KeyE")) {
      const nearby = ENCOUNTERS[this.index].find(
        (e) => e.friend !== "boba" && dist(this.star, encounterAnchor(e)) < 90,
      );
      if (nearby) wind *= 0.15;
    }
    if (this.phase === "carry") wind = 0;
    let dx = 0,
      dy = 0;
    const keyX =
      Number(this.keys.has("ArrowRight") || this.keys.has("KeyD")) -
      Number(this.keys.has("ArrowLeft") || this.keys.has("KeyA"));
    const keyY =
      Number(this.keys.has("ArrowDown") || this.keys.has("KeyS")) -
      Number(this.keys.has("ArrowUp") || this.keys.has("KeyW"));
    if (keyX || keyY) {
      const n = Math.hypot(keyX, keyY);
      dx = keyX / n;
      dy = keyY / n;
    } else if (this.pointer.down) {
      const x = this.pointer.x + this.camera - this.star.x,
        y = this.pointer.y - this.star.y,
        d = Math.hypot(x, y);
      if (d > 5) {
        dx = x / Math.max(50, d);
        dy = y / Math.max(50, d);
      }
    }
    const speed = this.phase === "carry" ? 220 : traits.speed;
    const targetVX = dx * speed + wind,
      targetVY = dy * speed;
    const acceleration = 7 / (1 + this.party.length * 0.09);
    this.star.vx += (targetVX - this.star.vx) * Math.min(1, dt * acceleration);
    this.star.vy += (targetVY - this.star.vy) * Math.min(1, dt * acceleration);
    if (this.bubble <= 0) {
      this.star.x += this.star.vx * dt;
      this.star.y += this.star.vy * dt;
    }
    this.star.x = clamp(this.star.x, 45, this.worldWidth - 45);
    if (this.phase === "journey")
      ENCOUNTERS[this.index].forEach((e, i) => {
        const old = this.encounters[this.index][i];
        const next = advanceEncounter(e, old, {
          dt,
          acting: this.mobileHelp || this.keys.has("KeyE"),
          lead: this.party[0]?.id,
          hugging,
          x: this.star.x,
          y: this.star.y,
        });
        this.encounters[this.index][i] = next;
        if (!old.cleared && next.cleared) {
          this.sound.play("bell");
          this.burst(e.x, e.y, 22);
          this.say(`${FRIENDS[e.friend].name}: “We did it. Together.”`, 3);
        }
        if (!old.openFor && next.openFor) {
          this.sound.play("bell");
          this.say(
            e.friend === "puff"
              ? "Up and right! Tiny wings, big lift!"
              : "Go, Pippin! Through the petals!",
            3,
          );
        }
        if (e.friend === "puff" && next.openFor > 0 && this.star.x < e.x + 35)
          this.star.y -= 100 * dt;
        if (
          !canPassEncounter(e, next, this.star.y) &&
          this.star.x > e.x - 31 &&
          this.star.x < e.x + 40
        ) {
          this.star.x = e.x - 31;
          this.star.vx = Math.min(0, this.star.vx);
        }
      });
    this.star.y = clamp(this.star.y, 95, 735);
    if (this.phase !== "carry")
      for (const o of this.level.obstacles) resolveCircle(this.star, o, 25);
    if (this.star.y > 685 && this.phase === "journey") this.resetToBell();
    if (this.phase === "journey")
      for (const o of this.level.hazards)
        if (dist(this.star, o) < o.r + 19) this.resetToBell();
    if (this.phase === "carry") {
      this.star.y = clamp(this.star.y, 180, 570);
      this.party.forEach((p, i) => {
        p.x = this.star.x + (i - 1.5) * 42;
        p.y =
          this.star.y +
          45 +
          Math.sin(this.reduced ? 0 : this.elapsed * 4 + i) * 3;
        p.px = p.x;
        p.py = p.y;
      });
      WARMTH.forEach((heart, i) => {
        if (!this.warmth.has(i) && dist(this.star, heart) < 75) {
          this.warmth.add(i);
          this.sound.play("friend");
          this.burst(heart.x, heart.y, 18, "#edbb9e");
        }
      });
      if (canReachHome(this.star, this.warmth.size)) {
        this.goalHold += dt;
        if (this.goalHold > 1.1) this.completeLevel();
      } else this.goalHold = 0;
      this.camera +=
        (clamp(
          this.star.x - this.logicalWidth * 0.35,
          0,
          Math.max(0, this.worldWidth - this.logicalWidth),
        ) -
          this.camera) *
        Math.min(1, dt * 4);
      this.emitHUD();
      return;
    }
    const gravity = traits.gravity;
    const link = traits.link;
    for (const p of this.party) {
      const vx = (p.x - p.px) * Math.pow(0.97, dt * 60),
        vy = (p.y - p.py) * Math.pow(0.97, dt * 60);
      p.px = p.x;
      p.py = p.y;
      p.x += vx + wind * dt * dt * 4;
      p.y +=
        vy +
        gravity *
          (p.id === "boba" ? 1.5 : p.id === "puff" ? 0.55 : 1) *
          dt *
          dt;
    }
    for (let iteration = 0; iteration < 7; iteration++) {
      for (let i = 0; i < this.party.length; i++) {
        const p = this.party[i],
          parent = i === 0 ? this.star : this.party[i - 1],
          dd = dist(p, parent) || 0.001,
          correction = (dd - link) / dd;
        if (i === 0) {
          p.x -= (p.x - parent.x) * correction;
          p.y -= (p.y - parent.y) * correction;
        } else {
          const cx = (p.x - parent.x) * correction * 0.5,
            cy = (p.y - parent.y) * correction * 0.5;
          p.x -= cx;
          p.y -= cy;
          parent.x += cx;
          parent.y += cy;
        }
        p.x = clamp(p.x, 25, this.level.width - 25);
        p.y = clamp(p.y, 50, 662);
        for (const o of this.level.obstacles) resolveCircle(p, o, 20);
      }
    }
    for (const f of this.level.friends) {
      if (!this.rescued.has(f.id) && dist(this.star, f) < 73) {
        this.rescued.add(f.id);
        const tail = this.party.at(-1) ?? this.star;
        this.party.push({
          id: f.id,
          x: tail.x,
          y: tail.y + 45,
          px: tail.x,
          py: tail.y + 45,
        });
        this.sound.play("friend");
        this.burst(f.x, f.y, 30);
        this.say(
          `${FRIENDS[f.id].name} took your paw. Nobody gets left behind.`,
          5,
        );
        this.emitHUD();
        this.onFriend(f.id);
        return;
      }
    }
    this.level.lights.forEach((l, i) => {
      if (
        !this.collected.has(i) &&
        [this.star, ...this.party].some((p) => dist(p, l) < 44)
      ) {
        this.collected.add(i);
        this.burst(l.x, l.y, 8);
        this.sound.play("light");
      }
    });
    this.level.bells.forEach((b, i) => {
      if (!this.visited.has(i) && dist(this.star, b) < 60) {
        this.visited.add(i);
        this.checkpoint = { ...b };
        this.sound.play("bell");
        this.burst(b.x, b.y, 12);
        this.say("A little safe place. The bell will bring you back here.", 4);
      }
    });
    if (this.index === 2 && this.phase === "journey" && this.star.x >= 3300) {
      this.phase = "boat";
      this.boatTime = -1.5;
      this.hug = 1;
      this.say(
        "The umbrella! Catch the paper boat. Fly down and hold paws together.",
        8,
      );
    }
    if (this.phase === "boat") {
      this.boatTime += dt;
      const boat = boatPosition(this.boatTime);
      this.boardHold = canBoardBoat(this.star, boat, hugging)
        ? this.boardHold + dt
        : 0;
      if (this.boardHold > 0.5) {
        this.phase = "fading";
        this.clearInput();
        this.say("Our little star is tired. Nobody gets left behind.", 6);
        this.sound.play("friend");
      } else if (this.boatTime > BOAT_SECONDS) {
        this.boatTime = -1.5;
        this.boardHold = 0;
        this.bumps++;
        this.hug = 1;
        this.star = { x: 3320, y: 350, vx: 0, vy: 0 };
        this.clearInput();
        this.say("Another little boat. Everyone is safe. Try again.", 5);
      }
    }
    if (this.index !== 2 && dist(this.star, this.level.goal) < 100) {
      if (
        canFinish(
          this.level,
          this.party.map((p) => p.id),
        )
      ) {
        this.goalHold += dt;
        if (this.goalHold > 1.1) {
          this.completeLevel();
        }
      } else this.say("Someone is still waiting. Let’s go back for them.", 2);
    } else this.goalHold = 0;
    if (
      !this.reduced &&
      Math.hypot(this.star.vx, this.star.vy) > 70 &&
      Math.random() < dt * 18
    ) {
      this.particles.push({
        x: this.star.x,
        y: this.star.y,
        vx: -this.star.vx * 0.08,
        vy: 12,
        life: 0.8,
        max: 0.8,
        color: "#f6d78c",
        r: 2.5,
        shape: "star",
      });
    }
    this.camera +=
      (clamp(
        this.star.x - this.logicalWidth * 0.35,
        0,
        Math.max(0, this.worldWidth - this.logicalWidth),
      ) -
        this.camera) *
      Math.min(1, dt * 4);
    for (const p of this.particles) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 25 * dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
    this.hudTimer += dt;
    if (this.hudTimer > 0.1) {
      this.emitHUD();
      this.hudTimer = 0;
    }
  }
  private completeLevel() {
    if (this.finished) return;
    this.finished = true;
    this.sound.play("win");
    this.onWin({
      lights: this.collected.size,
      total: this.level.lights.length,
      time: this.elapsed,
      bumps: this.bumps,
      stars: starsFor(
        this.collected.size,
        this.level.lights.length,
        this.bumps,
      ),
    });
  }
  private frame = (now: number) => {
    if (this.disposed) return;
    const dt = this.previous
      ? Math.min((now - this.previous) / 1000, 0.04)
      : 1 / 60;
    this.previous = now;
    if (!this.paused && !this.finished) {
      this.visualTime += dt;
      let remaining = dt;
      while (remaining > 0) {
        const step = Math.min(remaining, 1 / 120);
        this.update(step);
        remaining -= step;
        if (this.paused || this.finished) break;
      }
    }
    this.render();
    this.raf = requestAnimationFrame(this.frame);
  };
  private render() {
    const c = this.ctx,
      w = this.logicalWidth,
      t = this.visualTime;
    c.setTransform(
      this.canvas.height / 800,
      0,
      0,
      this.canvas.height / 800,
      0,
      0,
    );
    drawWorldBackground(
      c,
      w,
      800,
      this.camera,
      t,
      this.phase === "carry" ? "sunset" : this.level.theme,
      this.reduced,
    );
    c.save();
    c.translate(-this.camera, 0);
    for (const zone of this.level.winds) {
      if (zone.x + zone.w < this.camera || zone.x > this.camera + w) continue;
      c.save();
      c.beginPath();
      c.rect(zone.x, 130, zone.w, 500);
      c.clip();
      for (let j = 0; j < 9; j++) {
        const x =
            zone.x +
            ((((j * 67 + t * (this.reduced ? 0 : zone.strength * 0.6)) %
              zone.w) +
              zone.w) %
              zone.w),
          y = 180 + j * 49;
        c.beginPath();
        c.moveTo(x, y);
        c.bezierCurveTo(x + 22, y - 10, x + 65, y + 12, x + 83, y);
        c.strokeStyle =
          this.level.theme === "storm" ? "#d9e3d570" : "#fffbed99";
        c.lineWidth = 1.6;
        c.stroke();
      }
      c.restore();
    }
    for (const o of this.level.obstacles)
      if (o.x + o.r > this.camera && o.x - o.r < this.camera + w)
        drawObstacle(c, o.x, o.y, o.r, t);
    for (const p of this.level.perches)
      if (p.x > this.camera - 200 && p.x < this.camera + w + 200)
        drawPerch(c, p, t);
    this.level.bells.forEach((b, i) =>
      drawBell(c, b.x, b.y, t, this.visited.has(i)),
    );
    for (const f of this.level.friends)
      if (!this.rescued.has(f.id)) {
        const bob = this.reduced ? 0 : Math.sin(t * 2 + f.x) * 2;
        drawFriend(c, f.id, f.x, f.y + bob, 1, t, 0, "worried");
        const by = f.y - 65 + Math.sin(t * 2) * 3;
        roundRect(c, f.x - 28, by - 16, 56, 28, 14, "#fff9e8e8", "#c5b99c");
        c.fillStyle = "#786d57";
        c.font = "bold 11px Nunito";
        c.textAlign = "center";
        c.fillText("hey…", f.x, by + 2);
      }
    this.level.lights.forEach((l, i) => {
      if (this.collected.has(i)) return;
      const yy = l.y + (this.reduced ? 0 : Math.sin(t * 2 + i) * 5),
        g = c.createRadialGradient(l.x, yy, 0, l.x, yy, 28);
      g.addColorStop(0, "#fff4b899");
      g.addColorStop(1, "#fff4b800");
      c.fillStyle = g;
      c.fillRect(l.x - 28, yy - 28, 56, 56);
      starPath(c, l.x, yy, 8, "#c6a561", t * 0.2);
      starPath(c, l.x, yy, 6, "#fff1b5", t * 0.2);
      ellipse(c, l.x - 6, yy - 3, 4, 2, "#fff9d977");
      ellipse(c, l.x + 6, yy - 3, 4, 2, "#fff9d977");
    });
    for (const o of this.level.hazards)
      drawHazard(c, o.x, o.y, o.r, this.reduced ? 0 : t);
    if (this.phase === "journey")
      drawGoal(
        c,
        this.level.goal.x,
        this.level.goal.y,
        t,
        canFinish(
          this.level,
          this.party.map((p) => p.id),
        ),
      );
    ENCOUNTERS[this.index].forEach((e, i) =>
      drawEncounter(
        c,
        e,
        this.encounters[this.index][i],
        this.reduced ? 0 : t,
        this.mobileHelp || this.keys.has("KeyE"),
      ),
    );
    if (this.phase === "boat" || this.phase === "fading") {
      const boat = boatPosition(this.boatTime);
      drawPaperBoat(
        c,
        boat.x,
        boat.y,
        this.reduced ? 0 : t,
        this.phase === "fading",
      );
      if (this.boatTime < 0)
        drawGoal(
          c,
          this.level.goal.x + (this.boatTime + 1.5) * 150,
          this.level.goal.y - (this.boatTime + 1.5) * 240,
          t,
          true,
        );
    }
    if (this.phase === "carry") {
      WARMTH.forEach((heart, i) => {
        if (!this.warmth.has(i)) {
          ellipse(c, heart.x, heart.y, 35, 35, "#fff2c944");
          drawHeart(c, heart.x, heart.y, 17);
        }
      });
      drawHome(c, this.reduced ? 0 : t);
    }
    let parent: { x: number; y: number } = this.star;
    for (const p of this.party) {
      line(c, parent.x, parent.y + 10, p.x, p.y - 18, "#675d4d", 3.5);
      line(c, parent.x, parent.y + 10, p.x, p.y - 18, "#dfc59a", 2);
      parent = p;
    }
    for (const p of this.party) {
      const angle = clamp((p.x - p.px) * 0.05, -0.5, 0.5);
      drawFriend(
        c,
        p.id,
        p.x,
        p.y,
        0.77,
        this.reduced ? 0 : t,
        angle,
        p.id === "boba" && this.paused ? "sleep" : "happy",
      );
      if (p.id === "boba" && this.paused) {
        c.font = "14px Nunito";
        c.fillStyle = "#8c8e77";
        c.fillText("z z", p.x + 20, p.y - 30);
      }
      if (this.index === 2 && (this.keys.has("Space") || this.mobileHug))
        drawHeart(c, p.x + 20, p.y - 25, 6);
    }
    if (this.pointer.down && !this.paused) {
      const tx = this.pointer.x + this.camera,
        ty = this.pointer.y;
      c.save();
      c.globalAlpha = 0.5;
      c.setLineDash([2, 6]);
      c.beginPath();
      c.arc(tx, ty, 12, 0, Math.PI * 2);
      c.strokeStyle = this.level.theme === "storm" ? "#fff4ce" : "#7d947f";
      c.lineWidth = 1;
      c.stroke();
      c.restore();
    }
    if (this.invulnerable > 0) {
      ellipse(c, this.star.x, this.star.y, 42, 42, "#eff9ef44", "#e8f4db99");
      ellipse(c, this.star.x - 16, this.star.y - 17, 7, 3, "#ffffff99");
    }
    c.save();
    if (this.phase === "fading")
      c.globalAlpha = 1 - Math.min(0.7, this.fadeTime * 0.2);
    if (this.phase === "carry") c.globalAlpha = 0.4 + this.warmth.size * 0.2;
    drawStar(c, this.star.x, this.star.y, 28, this.reduced ? 0 : t);
    c.restore();
    if (this.goalHold > 0) {
      c.beginPath();
      c.arc(
        this.star.x,
        this.star.y,
        41,
        -Math.PI / 2,
        -Math.PI / 2 + (this.goalHold / 1.1) * Math.PI * 2,
      );
      c.strokeStyle = "#fff4b9";
      c.lineWidth = 4;
      c.stroke();
    }
    for (const p of this.particles) {
      c.globalAlpha = p.life / p.max;
      if (p.shape === "star") starPath(c, p.x, p.y, p.r, p.color);
      else ellipse(c, p.x, p.y, p.r * 0.6, p.r * 0.6, p.color);
    }
    c.globalAlpha = 1;
    c.restore();
    drawForeground(c, w, this.camera, this.reduced ? 0 : t);
    // A delicate vignette, never hiding the path.
    const vignette = c.createRadialGradient(
      w / 2,
      400,
      200,
      w / 2,
      400,
      w * 0.75,
    );
    vignette.addColorStop(0, "#243e3a00");
    vignette.addColorStop(1, "#243e3a16");
    c.fillStyle = vignette;
    c.fillRect(0, 0, w, 800);
  }
  destroy() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.resizeObserver.disconnect();
    this.canvas.removeEventListener("pointerdown", this.pointerDown);
    this.canvas.removeEventListener("pointermove", this.pointerMove);
    this.canvas.removeEventListener("contextmenu", this.contextMenu);
    window.removeEventListener("pointerup", this.pointerUp);
    window.removeEventListener("pointercancel", this.pointerUp);
    window.removeEventListener("keydown", this.keyDown);
    window.removeEventListener("keyup", this.keyUp);
    window.removeEventListener("blur", this.blur);
    document.removeEventListener("visibilitychange", this.visibility);
  }
}
