import { useEffect, useRef, useState, type ReactNode } from "react";
import { drawFriend, drawStar } from "./art";
import { FRIENDS, type FriendId } from "./levels";
import { drawSnack, PICNIC_SNACKS } from "./picnicArt";
import "./picnic.css";
const IDS: FriendId[] = ["mochi", "pippin", "boba", "puff"];
function Picture({ id, snack = false, fed = false }: { id: FriendId; snack?: boolean; fed?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!.getContext("2d")!;
    c.clearRect(0, 0, 240, 240);
    if (snack) drawSnack(c, id, 120, 120, 2.5);
    else {
      drawFriend(c, id, 120, 125, 2.3, 0, 0, fed && id === "boba" ? "sleep" : "happy");
      if (fed) drawStar(c, 190, 43, 19, 0, true, false);
    }
  }, [id, snack, fed]);
  return <canvas ref={ref} width={240} height={240} aria-hidden="true" />;
}
export function Picnic({ onClose, reward, onSnack, soundControls }: { onClose: () => void; reward: ReactNode; onSnack: () => void; soundControls: ReactNode }) {
  const [selected, setSelected] = useState<FriendId | null>(null);
  const [fed, setFed] = useState<FriendId[]>([]);
  const [message, setMessage] = useState("Choose a snack, then tap the friend who asked for it.");
  const [lastFed, setLastFed] = useState<FriendId | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, []);
  const complete = fed.length === 4;
  function serve(id: FriendId) {
    if (!selected) { setMessage(`${FRIENDS[id].name} would love ${PICNIC_SNACKS[id].name.toLowerCase()}. Choose it from the basket below.`); return; }
    if (selected !== id) { setMessage(`That treat is for ${FRIENDS[selected].name}. ${FRIENDS[id].name} is waiting for ${PICNIC_SNACKS[id].name.toLowerCase()}.`); return; }
    setFed(current => [...current, id]); setLastFed(id); setSelected(null);
    setMessage(`${FRIENDS[id].name}: “${PICNIC_SNACKS[id].reply}”`); onSnack();
  }
  return <main className="picnic-page">
    <div className="picnic-sun" aria-hidden="true" />
    <div className="picnic-fireflies" aria-hidden="true">✦ <span>✧</span> ✦ <span>✧</span> ✦</div>
    <header className="picnic-header">
      <button className="feedback-link" onClick={onClose}>Back to the meadow</button>
      <span className="eyebrow">A SECRET, JUST FOR YOU</span>
    </header>
    <section className="picnic-intro">
      <span className="eyebrow">EVERY FIREFLY FOUND ITS WAY HOME</span>
      <h1 ref={heading} tabIndex={-1}>{complete ? "A full heart. A full picnic." : "A little picnic, at last."}</h1>
      <p>{complete ? "No more storms today. Just crumbs, warm grass, and each other." : "The friends packed a thank-you basket. There’s a favorite treat for every little paw."}</p>
    </section>
    <section className="picnic-blanket" aria-label="Your friends at the picnic">
      {IDS.map(id => <button key={id} disabled={fed.includes(id)}
        className={`picnic-friend ${fed.includes(id) ? "is-fed" : ""} ${lastFed === id ? `picnic-${id}-happy` : ""}`}
        onClick={() => serve(id)} aria-label={`Give ${FRIENDS[id].name} a snack`}>
        <Picture id={id} fed={fed.includes(id)} />
        <strong>{FRIENDS[id].name}</strong>
        <small>{fed.includes(id) ? "Happy tummy ✓" : PICNIC_SNACKS[id].name}</small>
      </button>)}
    </section>
    <div className="picnic-message" role="status" aria-live="polite">{message}</div>
    {!complete ? <section className="picnic-basket" aria-label="Choose a picnic snack">
      <div className="picnic-basket-title"><h2>Inside the basket</h2><span>{fed.length} of 4 friends treated</span></div>
      <div className="picnic-snacks">{IDS.map(id => <button key={id} className="picnic-snack"
        disabled={fed.includes(id)} aria-pressed={selected === id}
        aria-label={`Choose ${PICNIC_SNACKS[id].name.toLowerCase()}`} onClick={() => { setSelected(id); setMessage(`Now offer it to ${FRIENDS[id].name}.`); }}>
        <Picture id={id} snack /><span>{PICNIC_SNACKS[id].name}</span>
      </button>)}</div>
      <p>No hurry. This moment is yours.</p>
    </section> : <section className="picnic-reward" aria-label="Picnic keepsake">
      <span aria-hidden="true">♡</span><h2>Some days deserve a postcard.</h2>
      <p>A special keepsake for finding every light and sharing every treat.</p>{reward}
    </section>}
    {soundControls}
  </main>;
}
