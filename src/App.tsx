import type { StepGuide } from "./engine";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { FRIENDS, LEVELS, parseSave, picnicUnlocked, type FriendId, type Save } from "./levels";
import {
  drawHero,
  drawFriend,
  drawStar,
  drawWorldBackground,
  line,
  ellipse,
  starPath,
} from "./art";
import { GameEngine, type HUD, type Result } from "./engine";
import { Soundscape } from "./audio";
import { feedbackFormUrl } from "./feedback";
import { Picnic } from "./Picnic";
import { createPostcard } from "./postcard";
const SAVE_KEY = "hold-my-paw-v1";
function PostcardButton({ save, picnic = false }: { save: Save; picnic?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState<{ url: string; name: string } | null>(null);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview.url); }, [preview]);
  async function download() {
    setBusy(true);
    setMessage("");
    try {
      const blob = await createPostcard(save, picnic);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = picnic ? "hold-my-paw-secret-picnic.png" : "hold-my-paw-a-little-memory.png";
      document.body.appendChild(link);
      link.click();
      link.remove();
      setPreview({ url, name: link.download });
      setMessage("Your postcard is ready. Check your downloads.");
    } catch {
      setMessage("The postcard couldn’t be saved. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="postcard-action">
      <button className="feedback-link" disabled={busy} onClick={() => void download()}>
        {busy ? "Making a little memory…" : picnic ? "Save our picnic postcard" : "Save our adventure postcard"}
      </button>
      <span role="status" className="postcard-status">{message}</span>
      {preview && <Modal label="Your adventure postcard" onClose={() => setPreview(null)} wide>
        <h2>Your little keepsake.</h2>
        <p>Your PNG is ready to save and share.</p>
        <img className="postcard-preview" src={preview.url}
          alt={picnic ? "Your secret picnic postcard with all four friends and your scores" : "Your adventure postcard with all four friends and your scores"} />
        <div className="postcard-preview-actions">
          <a className="feedback-link" href={preview.url} download={preview.name}>Download PNG again</a>
          <button className="feedback-link" onClick={() => setPreview(null)}>Back to the game</button>
        </div>
      </Modal>}
    </div>
  );
}
function FeedbackLink() {
  if (!feedbackFormUrl) return null;
  return (
    <a
      className="feedback-link"
      href={feedbackFormUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Share a little feedback (opens a form in a new tab)"
    >
      <span aria-hidden="true">♡</span> Share a little feedback
    </a>
  );
}
function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const paths: Record<string, ReactNode> = {
    arrow: (
      <>
        <path d="M4 12h15M13 6l6 6-6 6" />
      </>
    ),
    paw: (
      <>
        <ellipse cx="12" cy="16" rx="5" ry="4" />
        <ellipse cx="5" cy="10" rx="2" ry="3" />
        <ellipse cx="10" cy="5" rx="2" ry="3" />
        <ellipse cx="16" cy="6" rx="2" ry="3" />
        <ellipse cx="20" cy="12" rx="2" ry="3" />
      </>
    ),
    sound: (
      <>
        <path d="M11 4L6 8H3v8h3l5 4zM15 8q6 4 0 8M18 4q10 8 0 16" />
      </>
    ),
    mute: (
      <>
        <path d="M11 4L6 8H3v8h3l5 4zM16 9l6 6m0-6l-6 6" />
      </>
    ),
    pause: (
      <>
        <path d="M8 5v14M16 5v14" />
      </>
    ),
    close: <path d="M6 6l12 12M18 6L6 18" />,
    star: (
      <path d="m12 3 2.8 5.8 6.4.9-4.6 4.5 1.1 6.3-5.7-3-5.7 3 1.1-6.3L3 9.7l6.4-.9z" />
    ),
    heart: (
      <path d="M12 20S2 14 2 8a5 5 0 0 1 10-1 5 5 0 0 1 10 1c0 6-10 12-10 12z" />
    ),
    back: <path d="M20 12H5m6-6-6 6 6 6" />,
    check: <path d="m5 12 4 4L19 6" />,
    lock: (
      <>
        <rect x="5" y="10" width="14" height="11" rx="3" />
        <path d="M8 10V6a4 4 0 0 1 8 0v4" />
      </>
    ),
    refresh: (
      <>
        <path d="M20 10a8 8 0 1 0-1 7M20 4v6h-6" />
      </>
    ),
    mouse: (
      <>
        <rect x="6" y="2" width="12" height="20" rx="6" />
        <path d="M12 3v7" />
      </>
    ),
    keys: (
      <>
        <rect x="2" y="5" width="20" height="14" rx="3" />
        <path d="M6 9h1m4 0h1m4 0h1M6 13h1m4 0h1m4 0h1M8 16h8" />
      </>
    ),
    help: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M9 9a3 3 0 0 1 6 0c0 2-3 2-3 5M12 17h.01" />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] ?? paths.star}
    </svg>
  );
}
const FRIEND_REACTIONS: Record<FriendId, string> = {
  mochi: "Oh! A little ear scratch?",
  pippin: "One more hop!",
  boba: "Mmm. This is nice.",
  puff: "Look! I’m practicing!",
};
function Portrait({ id, size = 72, interactive = false, reduced = false, pulse = 0 }: {
  id: FriendId; size?: number; interactive?: boolean; reduced?: boolean; pulse?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [reaction, setReaction] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  useEffect(() => {
    const c = ref.current!.getContext("2d")!;
    let frame = 0;
    const started = performance.now();
    const active = reaction > 0 || pulse > 0;
    const render = (now: number) => {
      const progress = active && !reduced ? Math.min((now - started) / 1400, 1) : 1;
      const strength = Math.sin(progress * Math.PI);
      const hop = id === "pippin" ? -Math.abs(Math.sin(progress * Math.PI * 2)) * size * .13 : 0;
      const tilt = id === "mochi" ? Math.sin(progress * Math.PI * 2) * .18 : 0;
      c.setTransform(2, 0, 0, 2, 0, 0);
      c.clearRect(0, 0, size, size);
      drawFriend(c, id, size / 2, size * .53 + hop, size / 100,
        active && !reduced ? progress * 5 : 1, tilt,
        id === "boba" && progress > .2 && progress < .65 ? "sleep" : "happy", strength);
      if (progress < 1) frame = requestAnimationFrame(render);
    };
    render(started);
    return () => cancelAnimationFrame(frame);
  }, [id, size, reaction, reduced, pulse]);
  useEffect(() => {
    if (!speaking) return;
    const timer = window.setTimeout(() => setSpeaking(false), 2400);
    return () => clearTimeout(timer);
  }, [speaking, reaction]);
  const picture = <canvas ref={ref} width={size * 2} height={size * 2}
    style={{ width: size, height: size }} aria-hidden="true" />;
  if (!interactive) return picture;
  return <span className="reactive-portrait">
    <button className="friend-pet" aria-label={`Say hello to ${FRIENDS[id].name}`}
      onClick={() => { setReaction(n => n + 1); setSpeaking(true); }}>
      {picture}
    </button>
    <span className="friend-reaction" role="status">{speaking ? FRIEND_REACTIONS[id] : ""}</span>
  </span>;
}
function Illustration({
  reduced,
  ending = false,
}: {
  reduced: boolean;
  ending?: boolean;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current!,
      c = canvas.getContext("2d")!;
    let raf = 0,
      start = performance.now();
    const render = (now: number) => {
      const box = canvas.getBoundingClientRect(),
        dpr = Math.min(devicePixelRatio || 1, 2);
      if (
        canvas.width !== Math.round(box.width * dpr) ||
        canvas.height !== Math.round(box.height * dpr)
      ) {
        canvas.width = Math.round(box.width * dpr);
        canvas.height = Math.round(box.height * dpr);
      }
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      const time = reduced ? 0 : (now - start) / 1000;
      if (!ending) drawHero(c, box.width, box.height, time, reduced);
      else {
        const s = box.height / 800,
          w = box.width / s;
        c.save();
        c.scale(s, s);
        drawWorldBackground(c, w, 800, 0, time, "sunset", reduced);
        const x = w * 0.68,
          fall = Math.min(1, time / 5),
          starY = 170 + fall * 180;
        const positions = [
          { x: x - 125, y: 405 },
          { x: x - 45, y: 430 },
          { x: x + 40, y: 418 },
          { x: x + 115, y: 390 },
        ];
        positions.forEach((p, i) => {
          if (i)
            line(
              c,
              positions[i - 1].x,
              positions[i - 1].y,
              p.x,
              p.y,
              "#c2a57b",
              3,
            );
        });
        line(c, x, starY, x - 45, 430, "#c2a57b", 2);
        (["mochi", "pippin", "boba", "puff"] as FriendId[]).forEach((id, i) =>
          drawFriend(
            c,
            id,
            positions[i].x,
            positions[i].y,
            1.05,
            time,
            (i - 1.5) * 0.12,
          ),
        );
        drawStar(c, x, starY, 35, time);
        ellipse(c, x, 492, 215, 32, "#a7b68e");
        for (let i = 0; i < 18; i++)
          starPath(
            c,
            x + Math.sin(i * 4) * 240,
            230 + Math.cos(i * 3) * 150 + Math.sin(time + i) * 5,
            3,
            "#fff4c4",
          );
        c.restore();
      }
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [reduced, ending]);
  return <canvas className="illustration" ref={ref} aria-hidden="true" />;
}
function Modal({
  children,
  onClose,
  label,
  wide = false,
}: {
  children: ReactNode;
  onClose: () => void;
  label: string;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const old = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
      if (e.key === "Tab") {
        const els = Array.from(
            ref.current!.querySelectorAll<HTMLElement>(
              'button:not(:disabled),input,a[href],[tabindex="0"]',
            ),
          ),
          first = els[0],
          last = els.at(-1);
        if (!first) {
          e.preventDefault();
          return;
        }
        if (
          e.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === ref.current)
        ) {
          e.preventDefault();
          last?.focus();
        } else if (
          !e.shiftKey &&
          (document.activeElement === last ||
            document.activeElement === ref.current)
        ) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("keydown", handler);
      old?.focus();
    };
  }, [onClose]);
  return (
    <div className="modal-backdrop">
      <div
        className={`paper-modal ${wide ? "wide" : ""}`}
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
      >
        <button
          className="round close-modal"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <Icon name="close" />
        </button>
        {children}
      </div>
    </div>
  );
}
const EMPTY_HUD: HUD = {
  challenge: null,
  phase: "journey",
  remaining: 10,
  hearts: 0,
  party: [],
  lights: 0,
  total: 0,
  time: 0,
  hug: 1,
  bumps: 0,
  progress: 0,
  message: "",
  goalReady: false,
  nextStop: { name: "Mochi", angle: 0 },
};
const formatTime = (n: number) =>
  `${Math.floor(n / 60)}:${Math.floor(n % 60)
    .toString()
    .padStart(2, "0")}`;
function App() {
  const [screen, setScreen] = useState<"home" | "game" | "ending" | "picnic">("home");
  const [level, setLevel] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [overlay, setOverlay] = useState<
    "intro" | "pause" | "friend" | "result" | "friends" | "help" | "step" | null
  >(null);
  const [stepGuide, setStepGuide] = useState<StepGuide | null>(null);
  const [petPulse, setPetPulse] = useState({ id: "mochi" as FriendId, count: 0 });
  const [newFriend, setNewFriend] = useState<FriendId>("mochi");
  const [hud, setHud] = useState<HUD>(EMPTY_HUD);
  const [result, setResult] = useState<Result | null>(null);
  const [soundOn, setSoundOn] = useState(false);
  const [volume, setVolume] = useState(0.55);
  const [reduced, setReduced] = useState(
    () => matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [save, setSave] = useState<Save>(() => {
    try {
      return parseSave(localStorage.getItem(SAVE_KEY));
    } catch {
      return parseSave(null);
    }
  });
  const canvas = useRef<HTMLCanvasElement>(null);
  const engine = useRef<GameEngine | null>(null);
  const audio = useRef<Soundscape | null>(null);
  const getAudio = () => (audio.current ??= new Soundscape());
  const closeOverlay = useCallback(() => setOverlay(null), []);
  const pause = useCallback(() => setOverlay("pause"), []);
  useEffect(() => {
    const music = getAudio();
    music.setMood(screen === "picnic" || screen === "ending" || (screen === "game" && hud.phase === "carry")
      ? "home" : screen === "game" ? (["meadow", "town", "rain"] as const)[level] : "meadow");
    music.setVolume(volume);
  }, [screen, level, hud.phase, volume]);
  useEffect(
    () => () => {
      audio.current?.destroy();
      audio.current = null;
    },
    [],
  );
  useEffect(() => {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(save));
    } catch {
      /* Playing remains available when browser storage is disabled. */
    }
  }, [save]);
  useEffect(() => {
    if (screen !== "game" || !canvas.current) return;
    const game = new GameEngine(canvas.current, level, getAudio(), {
      onHUD: setHud,
      onPause: pause,
      onTutorial: (guide) => {
        setStepGuide(guide);
        setOverlay("step");
      },
      onFriend: (id) => {
        game.setPaused(true);
        setNewFriend(id);
        setOverlay("friend");
      },
      onWin: (r) => {
        game.setPaused(true);
        setResult(r);
        setOverlay("result");
        setSave((s) => {
          const previous = s.best[level];
          return {
            unlocked: Math.max(s.unlocked, level + 1),
            best: {
              ...s.best,
              [level]: {
                stars: Math.max(previous?.stars ?? 0, r.stars),
                lights: Math.max(previous?.lights ?? 0, r.lights),
                time: Math.min(previous?.time ?? Infinity, r.time),
              },
            },
          };
        });
      },
    });
    engine.current = game;
    game.reduced = reduced;
    return () => {
      game.destroy();
      engine.current = null;
    };
  }, [screen, level, attempt, pause]);
  useEffect(() => {
    engine.current?.setPaused(!!overlay);
    if (engine.current) engine.current.reduced = reduced;
  }, [overlay, reduced, screen, level, attempt]);
  function start(i: number) {
    setHud(EMPTY_HUD);
    setResult(null);
    setLevel(i);
    setAttempt((n) => n + 1);
    setScreen("game");
    setOverlay("intro");
  }
  function home() {
    setScreen("home");
    setOverlay(null);
  }
  function toggleSound() {
    const next = !soundOn;
    setSoundOn(next);
    const music = getAudio();
    void music.enable(next).then(() => setSoundOn(music.enabled));
  }
  function next() {
    if (level === 2) {
      setOverlay(null);
      setScreen("ending");
    } else start(level + 1);
  }
  const picnicEntry = save.unlocked === LEVELS.length && (
    <div className="picnic-unlock">
      {picnicUnlocked(save) ? <button className="feedback-link" onClick={() => { setOverlay(null); setScreen("picnic"); }}>
        Visit the secret picnic
      </button> : <p>A secret picnic is waiting. Find every firefly in each chapter to join your friends. Your best chapter collections count across replays.</p>}
    </div>
  );
  const resume = () => {
    setOverlay(null);
    canvas.current?.focus();
  };
  const soundSettings = <div className="sound-settings">
    <button className="feedback-link" onClick={toggleSound}>{soundOn ? "Mute music" : "Enable music"}</button>
    <label>Sound volume
      <input type="range" min="0" max="100" step="5" value={Math.round(volume * 100)}
        onChange={e => setVolume(Number(e.target.value) / 100)} />
    </label>
  </div>;
  return (
    <div
      className={`app ${reduced ? "reduced-motion" : ""} ${screen === "game" ? "in-game" : ""}`}
    >
      {screen === "home" && (
        <main className="home">
          <Illustration reduced={reduced} />
          <div className="home-wash" />
          <header className="home-header">
            <a
              className="brand"
              href="#"
              onClick={(e) => e.preventDefault()}
              aria-label="Hold My Paw home"
            >
              <span className="brand-icon">
                <Icon name="paw" size={23} />
              </span>
              <span>
                MALLIKA SURI
                <span className="brand-sub">little worlds, big feelings</span>
              </span>
            </a>
            <nav>
              <button
                className="text-button meet-link"
                onClick={() => setOverlay("friends")}
              >
                Meet your friends <span>↗</span>
              </button>
              <button
                className={`round ${soundOn ? "active" : ""}`}
                aria-label={soundOn ? "Mute music" : "Enable music"}
                onClick={toggleSound}
              >
                <Icon name={soundOn ? "sound" : "mute"} />
              </button>
              <button
                className="round"
                aria-label="How to play"
                onClick={() => setOverlay("help")}
              >
                <Icon name="help" />
              </button>
            </nav>
          </header>
          <section className="hero-copy">
            <div className="eyebrow">
              <span className="tiny-flower">✳</span> A SMALL ADVENTURE. A VERY
              BIG HEART.
            </div>
            <h1>
              Hold
              <br />
              my <em>paw.</em>
              <span className="title-spark">✧</span>
            </h1>
            <p className="hero-description">
              The world is a little wobbly.
              <br />
              It’s better when we hold on together.
            </p>
            <button
              className="primary play-button"
              onClick={() => start(save.unlocked === 3 ? 0 : save.unlocked)}
            >
              {save.unlocked === 0
                ? "Let’s find our friends"
                : save.unlocked === 3
                  ? "One more adventure?"
                  : "Continue our adventure"}
              <span>
                <Icon name="arrow" size={23} />
              </span>
            </button>
            <button
              className="text-button first-guide"
              onClick={() => setOverlay("help")}
            >
              <Icon name="help" size={16} /> First time? Read the play guide
            </button>
            <button className="text-button first-guide" onClick={() => setOverlay("friends")}>
              <Icon name="paw" size={16} /> Say hello to your friends
            </button>
            <div className="play-note">
              <Icon name="mouse" size={14} /> Mouse or keyboard <span>·</span> 3
              little chapters <span>·</span> Little surprises
            </div>
            {save.unlocked === 3 && <PostcardButton save={save} />}
            {picnicEntry}
            <div className="chapter-picker" aria-label="Choose a chapter">
              {LEVELS.map((l, i) => (
                <button
                  key={l.chapter}
                  disabled={i > save.unlocked}
                  onClick={() => start(i)}
                  aria-label={`Play chapter ${i + 1}: ${l.title}`}
                  className={`chapter-dot ${i <= save.unlocked ? "unlocked" : ""}`}
                >
                  <span>
                    {i > save.unlocked ? (
                      <Icon name="lock" size={14} />
                    ) : save.best[i] ? (
                      <Icon name="check" size={15} />
                    ) : (
                      l.chapter
                    )}
                  </span>
                  <div>
                    <small>CHAPTER {l.chapter}</small>
                    <b>{l.subtitle}</b>
                  </div>
                  {save.best[i] && (
                    <span className="chapter-stars">
                      {"✦".repeat(save.best[i].stars)}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </section>
          <div className="hero-caption">
            <span className="caption-line" />
            <p>
              four little friends.
              <br />
              <em>one way home.</em>
            </p>
          </div>
          <footer className="home-footer">
            <span>A GAME ABOUT TAKING CARE OF EACH OTHER</span>
            <FeedbackLink />
            <button className="text-button" onClick={() => setOverlay("help")}>
              A little help <Icon name="arrow" size={14} />
            </button>
          </footer>
        </main>
      )}
      {screen === "game" && (
        <main
          className={`game ${hud.phase === "carry" ? "sunset" : LEVELS[level].theme}`}
        >
          <canvas
            ref={canvas}
            className="game-canvas"
            tabIndex={0}
            aria-label="Rescue game. Hold and move your pointer, or use WASD or arrow keys to fly. Space gathers your friends. Q changes the lead friend. E helps at a marked circle. Escape pauses."
          />
          <header className="game-header">
            <button
              className="round game-pause"
              onClick={pause}
              aria-label="Pause game"
            >
              <Icon name="pause" />
            </button>
            <div className="level-heading">
              <span>CHAPTER {LEVELS[level].chapter} / 03</span>
              <h2>{LEVELS[level].subtitle}</h2>
            </div>
            <div
              className="level-route"
              aria-label={`${Math.round(hud.progress * 100)} percent of route travelled`}
            >
              <span style={{ width: `${hud.progress * 100}%` }} />
              <Icon name="paw" size={15} />
            </div>
            <div
              className="firefly-counter"
              aria-label={`${hud.lights} of ${hud.total} fireflies collected`}
            >
              <Icon name="star" size={18} />
              <b>{hud.lights.toString().padStart(2, "0")}</b>
              <span>/ {hud.total}</span>
            </div>
            <button
              className="round"
              aria-label={soundOn ? "Mute music" : "Enable music"}
              onClick={toggleSound}
            >
              <Icon name={soundOn ? "sound" : "mute"} />
            </button>
          </header>
          <button
            className="in-game-guide"
            onClick={() => setOverlay("help")}
            aria-label="Open play guide"
          >
            ? Play guide · pauses game
          </button>
          <div className="chapter-label">{LEVELS[level].title}</div>
          <div
            className="next-stop"
            aria-label={`Next stop: ${hud.nextStop.name}`}
          >
            <span>{hud.nextStop.name}</span>
            <i style={{ transform: `rotate(${hud.nextStop.angle}deg)` }}>
              <Icon name="arrow" size={14} />
            </i>
          </div>
          {hud.message && hud.phase === "journey" && (
            <div className="game-hint" role="status">
              <Icon name="heart" size={15} />
              {hud.message}
            </div>
          )}
          {!overlay && hud.challenge && (
            <aside className="encounter-card">
              <strong>{hud.challenge.title}</strong>
              <p>
                {hud.challenge.remaining > 0
                  ? hud.challenge.friend === "puff"
                    ? "Now fly UP and RIGHT through the arch!"
                    : "Now fly RIGHT through the flower. Release E; do not hold Space."
                  : hud.party[0] !== hud.challenge.friend
                    ? `First, click ${FRIENDS[hud.challenge.friend].name}’s portrait below (or press Q). They must be the first friend beneath your star.`
                    : hud.challenge.description.replace(
                        "hold E",
                        "hold Help (E)",
                      )}
              </p>
              <p className="leader-readout">
                Leading now:{" "}
                {hud.party[0] ? FRIENDS[hud.party[0]].name : "Nobody yet"} ·
                Needed: {FRIENDS[hud.challenge.friend].name}
              </p>
              <button
                aria-label="Hold to help"
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.currentTarget.setPointerCapture(e.pointerId);
                  engine.current?.setHelp(true);
                }}
                onPointerUp={() => engine.current?.setHelp(false)}
                onPointerCancel={() => engine.current?.setHelp(false)}
                onBlur={() => engine.current?.setHelp(false)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") engine.current?.setHelp(true);
                }}
                onKeyUp={() => engine.current?.setHelp(false)}
              >
                {hud.challenge.remaining > 0
                  ? `Go! ${hud.challenge.remaining.toFixed(1)}s`
                  : "Hold Help · E"}
              </button>
              <progress
                aria-label="Friend helping"
                value={hud.challenge.progress}
                max={1}
              />
            </aside>
          )}
          {!overlay && hud.phase !== "journey" && (
            <div className="sequence-note" role="status">
              {hud.phase === "boat"
                ? `Catch the boat · ${Math.ceil(hud.remaining)}s · Star inside dotted oval → hold Space`
                : hud.phase === "fading"
                  ? "Rest, little star. We have you."
                  : `Our turn to carry you · ${hud.hearts}/3 warm hearts`}
            </div>
          )}
          <div className="game-bottom">
            <div className="party-tray">
              <div className="tray-heading">
                <span className="tray-label">LITTLE PAWS IN GOOD HANDS</span>
                <button
                  className="swap-friends"
                  disabled={
                    hud.party.length < 2 || !!overlay || hud.phase !== "journey"
                  }
                  aria-label="Switch lead friend"
                  title="Switch lead friend (Q)"
                  onClick={() => engine.current?.rotateParty()}
                >
                  <Icon name="refresh" size={12} />
                </button>
              </div>
              <div className="party-members">
                {[
                  ...hud.party,
                  ...(["mochi", "pippin", "boba", "puff"] as FriendId[]).filter(
                    (id) => !hud.party.includes(id),
                  ),
                ].map((id) => {
                  const found = hud.party.includes(id);
                  return (
                    <button
                      aria-label={`Let ${FRIENDS[id].name} lead`}
                      disabled={!found || !!overlay || hud.phase !== "journey"}
                      onClick={() => { engine.current?.setLeader(id); setPetPulse(p => ({ id, count: p.count + 1 })); }}
                      key={id}
                      className={`party-member ${found ? "found" : ""} ${hud.party[0] === id ? "lead" : ""}`}
                      title={
                        found
                          ? `${FRIENDS[id].name}: ${FRIENDS[id].power}`
                          : `${FRIENDS[id].name} is waiting for you`
                      }
                    >
                      <Portrait id={id} size={46} reduced={reduced} pulse={petPulse.id === id ? petPulse.count : 0} />
                      <span>
                        {found ? FRIENDS[id].name : "?"}
                        {found && <i>✓</i>}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="controls-hint">
              <span>
                <kbd>W A S D</kbd> fly
              </span>
              <span>or hold & move your mouse</span>
              <span>
                <kbd>Q</kbd> swap lead friend
              </span>
            </div>
            <button
              className={`hug-button ${hud.party.length === 0 ? "unavailable" : ""}`}
              disabled={
                hud.party.length === 0 ||
                !!overlay ||
                hud.phase === "carry" ||
                hud.phase === "fading"
              }
              onPointerDown={(e) => {
                e.preventDefault();
                e.currentTarget.setPointerCapture(e.pointerId);
                engine.current?.setHug(true);
              }}
              onPointerUp={() => engine.current?.setHug(false)}
              onPointerCancel={() => engine.current?.setHug(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  engine.current?.setHug(true);
                }
              }}
              onKeyUp={(e) => {
                if (e.key === "Enter") engine.current?.setHug(false);
              }}
              onBlur={() => engine.current?.setHug(false)}
              aria-label="Hold to gather your friends"
            >
              <Icon name="heart" size={23} />
              <span>
                <b>{hud.phase === "carry" ? "Carry our star" : "Hold paws"}</b>
                <small>
                  {hud.phase === "carry"
                    ? "FLY TOGETHER TOWARD HOME"
                    : "HOLD SPACE OR PRESS HERE"}
                </small>
              </span>
              <span className="hug-meter">
                <i style={{ height: `${hud.hug * 100}%` }} />
              </span>
            </button>
          </div>
        </main>
      )}
      {screen === "ending" && (
        <main className="ending">
          <Illustration reduced={reduced} ending />
          <div className="home-wash" />
          <div className="ending-copy">
            <span className="eyebrow">EVERY LITTLE PAW. SAFELY HOME.</span>
            <h1>
              You carried us.
              <br />
              <em>Our turn.</em>
            </h1>
            <p>
              Somewhere along the way, you stopped being
              <br />a little star with a very big job.
              <br />
              You became someone’s way home.
            </p>
            <div className="ending-friends">
              {(["mochi", "pippin", "boba", "puff"] as FriendId[]).map((id) => (
                <Portrait key={id} id={id} size={60} interactive reduced={reduced} />
              ))}
            </div>
            <div className="ending-stats">
              <span>
                <b>
                  {Object.values(save.best).reduce((n, b) => n + b.lights, 0)}
                </b>{" "}
                fireflies brought home
              </span>
              <span>
                <b>4</b> friends, forever
              </span>
            </div>
            <button className="primary" onClick={home}>
              Keep this little memory <Icon name="heart" size={18} />
            </button>
            <PostcardButton save={save} />
            {picnicEntry}
            {soundSettings}
            <small className="ending-credit">
              HOLD MY PAW · CREATED BY MALLIKA SURI
            </small>
            <FeedbackLink />
          </div>
        </main>
      )}
      {screen === "picnic" && picnicUnlocked(save) && (
        <Picnic onClose={home} onSnack={() => getAudio().play("friend")}
          soundControls={soundSettings}
          reward={<PostcardButton save={save} picnic />} />
      )}
      {overlay === "step" && stepGuide && (
        <Modal label={stepGuide.title} onClose={resume}>
          <span className="eyebrow">A LITTLE HELP, RIGHT WHEN YOU NEED IT</span>
          {stepGuide.friend && (
            <div className="step-portrait">
              <Portrait id={stepGuide.friend} size={84} />
            </div>
          )}
          <h2>{stepGuide.title}</h2>
          <ol className="first-steps">
            {stepGuide.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <p className="step-paused">
            The game and every timer are paused while you read.
          </p>
          <button className="primary full" onClick={resume}>
            Got it. Let’s try! <Icon name="arrow" />
          </button>
        </Modal>
      )}
      {overlay === "intro" && (
        <Modal label={`Chapter ${level + 1} introduction`} onClose={resume}>
          <span className="eyebrow">A LITTLE FURTHER, TOGETHER</span>
          <div className="chapter-stamp">
            {LEVELS[level].chapter}
            <span>CHAPTER</span>
          </div>
          <h2>{LEVELS[level].title}</h2>
          <p>{LEVELS[level].story}</p>
          <div className="intro-controls">
            <div>
              <Icon name="mouse" size={27} />
              <span>
                <b>Hold & move</b>your mouse to fly
              </span>
            </div>
            <span className="or">or</span>
            <div>
              <Icon name="keys" size={28} />
              <span>
                <b>WASD / arrow keys</b>to find your way
              </span>
            </div>
          </div>
          <div className="tip-box">
            <Icon name={level === 0 ? "paw" : "heart"} size={22} />
            <p>
              {level === 0
                ? "Fly close to a friend to take their paw. Collect fireflies and bring everyone to the umbrella boat."
                : "Hold Space to gather the chain. Golden bells save your place. Spinning seed pods will gently send you back."}
            </p>
          </div>
          <p>
            We’ll pause and show you a short guide whenever you reach something
            new.
          </p>
          <button className="primary full" onClick={resume}>
            {level === 0
              ? "A little courage. Let’s go."
              : "We’ve got each other."}
            <Icon name="arrow" />
          </button>
        </Modal>
      )}
      {overlay === "friend" && (
        <Modal label={`You found ${FRIENDS[newFriend].name}`} onClose={resume}>
          <div className="friend-celebration">
            <span>✧</span>
            <Portrait id={newFriend} size={150} interactive reduced={reduced} />
            <span>✧</span>
          </div>
          <span className="eyebrow">A NEW PAW TO HOLD</span>
          <h2>
            Meet {FRIENDS[newFriend].name}
            <em>{FRIENDS[newFriend].kind}</em>
          </h2>
          <p className="friend-quote">“{FRIENDS[newFriend].line}”</p>
          <div className="tip-box">
            <Icon name="star" />
            <p>{FRIENDS[newFriend].power}</p>
          </div>
          <button className="primary full" onClick={resume}>
            Come on, little friend <Icon name="heart" />
          </button>
        </Modal>
      )}
      {overlay === "result" && result && (
        <Modal label="Chapter complete" onClose={next}>
          <div className="result-stars">
            {[1, 2, 3].map((n) => (
              <span key={n} className={n <= result.stars ? "earned" : ""}>
                <Icon name="star" size={n === 2 ? 56 : 43} />
              </span>
            ))}
          </div>
          <span className="eyebrow">A LITTLE BRAVER THAN BEFORE</span>
          <h2>
            {level === 2 ? "Everybody made it." : "One step closer to home."}
          </h2>
          <p>
            {level === 2
              ? "The storm is behind us. But our little star has one last surprise."
              : "A warm little boat. A well-earned breath. And a friend who’s very glad you came."}
          </p>
          <div className="result-stats">
            <div>
              <b>
                {result.lights}
                <small> / {result.total}</small>
              </b>
              <span>FIREFLIES</span>
            </div>
            <div>
              <b>{formatTime(result.time)}</b>
              <span>ADVENTURE TIME</span>
            </div>
            <div>
              <b>{result.bumps}</b>
              <span>LITTLE WOBBLES</span>
            </div>
          </div>
          <p className="star-explanation">
            One star for getting home. Two for most fireflies. Three for every
            firefly with at most two wobbles.
          </p>
          <button className="primary full" onClick={next}>
            {level === 2 ? "One last little moment" : "On to the next chapter"}
            <Icon name="arrow" />
          </button>
          <button className="text-button centered" onClick={() => start(level)}>
            Take the scenic route again
          </button>
        </Modal>
      )}
      {overlay === "pause" && (
        <Modal label="Game paused" onClose={resume}>
          <span className="pause-mark">☁</span>
          <span className="eyebrow">EVEN LITTLE STARS NEED A BREAK</span>
          <h2>Take a tiny breath.</h2>
          <p>Your friends will wait right here.</p>
          <button className="primary full" onClick={resume}>
            Back to our adventure <Icon name="arrow" />
          </button>
          <div className="pause-options">
            <button onClick={() => start(level)}>
              <Icon name="refresh" />
              Restart this chapter
            </button>
            <button onClick={home}>
              <Icon name="back" />
              Back to the meadow
            </button>
          </div>
          <label className="motion-setting">
            <span>Gentler motion</span>
            <input
              type="checkbox"
              checked={reduced}
              onChange={(e) => setReduced(e.target.checked)}
            />
          </label>
          {soundSettings}
          <small className="quiet-note">
            Finished chapters are saved. Restarting resets this chapter.
          </small>
          <FeedbackLink />
        </Modal>
      )}
      {overlay === "friends" && (
        <Modal label="Meet your friends" onClose={closeOverlay} wide>
          <span className="eyebrow">A SMALL, SLIGHTLY WOBBLY FAMILY</span>
          <h2>
            Good things come
            <br />
            with little paws.
          </h2>
          <p className="quiet-note">Tap a friend to say hello.</p>
          <div className="friends-grid">
            {(["mochi", "pippin", "boba", "puff"] as FriendId[]).map((id) => (
              <article key={id}>
                <Portrait id={id} size={104} interactive reduced={reduced} />
                <h3>
                  {FRIENDS[id].name}
                  <small>{FRIENDS[id].kind}</small>
                </h3>
                <p>{FRIENDS[id].description}</p>
                <span>{FRIENDS[id].power}</span>
              </article>
            ))}
          </div>
          <button
            className="primary centered"
            onClick={() => start(Math.min(save.unlocked, 2))}
          >
            Let’s go find them <Icon name="arrow" />
          </button>
        </Modal>
      )}
      {overlay === "help" && (
        <Modal label="How to play" onClose={closeOverlay}>
          <span className="eyebrow">EVERY ADVENTURE STARTS SOMEWHERE</span>
          <h2>A little field guide.</h2>
          <p>
            You are a little star guiding four stranded friends home. Rescue
            them, choose the right friend for each obstacle, and stay together
            across three chapters. No friend is ever lost.
          </p>
          <div className="guide">
            <p>
              <Icon name="mouse" />
              <span>
                <b>Be their guiding star.</b> Hold and move your mouse or finger
                to fly. You can also use WASD or the arrow keys.
              </span>
            </p>
            <p>
              <Icon name="paw" />
              <span>
                <b>Take a little paw.</b> Fly close to stranded friends. Bring
                everyone to the floating umbrella in chapters 1 and 2. The last
                chapter ends with a paper-boat rescue.
              </span>
            </p>
            <p>
              <Icon name="heart" />
              <span>
                <b>Stick together.</b> Hold Space or the heart button to shorten
                your chain. Release it to recharge. Q swaps the friend at the
                front. Hold E or Help in a marked circle to use their special
                skill.
              </span>
            </p>
            <p>
              <Icon name="star" />
              <span>
                <b>Explore, don’t hurry.</b> Collect golden fireflies. Touch
                bells for checkpoints. Avoid spinning seed pods and dipping your
                star in the water. A wobble sends you back safely.
              </span>
            </p>
          </div>
          <section className="guide-details">
            <h3>The two buttons do different things</h3>
            <p>
              <b>E / Help:</b> use a friend’s skill at a dotted circle.{" "}
              <b>Space / Hold paws:</b> gather the chain (and board the paper
              boat). Hugging slows flight; release it before a timed gate.
            </p>
            <h3>Stuck at a flower gate?</h3>
            <ol className="first-steps">
              <li>
                Read the friend’s name. Click their portrait at the bottom, or
                press Q until they lead.
              </li>
              <li>
                Move the <b>star itself</b> into the dotted circle on the left
                of the gate.
              </li>
              <li>Hold E or the Help button until the meter fills.</li>
              <li>
                Release E and fly through the opening. If it closes, return to
                the circle and retry.
              </li>
            </ol>
            <div className="guide-friends">
              {(
                [
                  [
                    "mochi",
                    "Stretch",
                    "Release Space, then hold E in the circle to untie the trellis.",
                  ],
                  [
                    "pippin",
                    "Leap",
                    "Charge with E, then fly right through the petals before they close.",
                  ],
                  [
                    "boba",
                    "Steady",
                    "Steer against the gust to stay in the circle while holding E.",
                  ],
                  [
                    "puff",
                    "Lift",
                    "Charge with E, then fly up and right through the high arch.",
                  ],
                ] as const
              ).map(([id, skill, tip]) => (
                <article key={id}>
                  <Portrait id={id} size={42} />
                  <div>
                    <b>
                      {FRIENDS[id].name} · {skill}
                    </b>
                    <p>{tip}</p>
                  </div>
                </article>
              ))}
            </div>
            <h3>How to catch the paper boat</h3>
            <ol className="first-steps">
              <li>
                Fly toward the moving boat. Aim for the{" "}
                <b>dotted oval above its paper folds</b>, not the water below
                it.
              </li>
              <li>
                Keep your star inside that oval and hold Space or Hold paws for
                about a second.
              </li>
              <li>
                The friends will board. If time runs out, try the next boat; you
                keep everyone.
              </li>
            </ol>
            <details>
              <summary>Need help with the final scene? (Story spoiler)</summary>
              <p>
                After the star rests, you steer the friends carrying it. Gather
                all three pink hearts, then fly to the HOME cottage.
              </p>
            </details>
            <h3>Play at your own pace</h3>
            <p>
              Fireflies improve your rating but are optional. Golden bells save
              your place. Escape / P pauses. Opening this guide also pauses
              every timer. On touch screens, use one finger to steer and another
              to hold Help or Hold paws.
            </p>
          </section>
          <label className="motion-setting">
            <span>Gentler motion</span>
            <input
              type="checkbox"
              checked={reduced}
              onChange={(e) => setReduced(e.target.checked)}
            />
          </label>
          <button className="primary full" onClick={closeOverlay}>
            I’ve got this <Icon name="check" />
          </button>
        </Modal>
      )}
    </div>
  );
}
export default App;
