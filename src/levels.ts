export type FriendId = "mochi" | "pippin" | "boba" | "puff";
export const FRIENDS: Record<
  FriendId,
  {
    name: string;
    kind: string;
    color: string;
    description: string;
    power: string;
    line: string;
  }
> = {
  mochi: {
    name: "Mochi",
    kind: "the kitten",
    color: "#e3ab8e",
    description: "Small paws. Very big feelings.",
    power:
      "A stretchy chain gives everyone more room. Put Mochi first for an extra-long swing.",
    line: "I wasn’t scared. I was just… waiting for you.",
  },
  pippin: {
    name: "Pippin",
    kind: "the frog",
    color: "#9bb98c",
    description: "Jump first. Think eventually.",
    power:
      "Your little group flies faster. Put Pippin first for an extra burst of speed.",
    line: "I bet we can jump over the WHOLE ocean.",
  },
  boba: {
    name: "Boba",
    kind: "the capybara",
    color: "#b79576",
    description: "A very dependable potato.",
    power:
      "A steady friend makes strong winds gentler. Put Boba first to really anchor the group.",
    line: "Is there a snack where we’re going?",
  },
  puff: {
    name: "Puff",
    kind: "the duckling",
    color: "#efd17e",
    description: "Tiny wings. Enormous ambition.",
    power:
      "Little wings lift the chain. Put Puff first to keep everybody extra floaty.",
    line: "I can’t fly yet. But I can help.",
  },
};
export type Circle = { x: number; y: number; r: number };
export type Perch = {
  x: number;
  y: number;
  kind: "cup" | "mushroom" | "house" | "leaf" | "spool";
  scale?: number;
};
export type Level = {
  title: string;
  subtitle: string;
  chapter: string;
  story: string;
  theme: "morning" | "sunset" | "storm";
  width: number;
  start: { x: number; y: number };
  friends: { id: FriendId; x: number; y: number }[];
  initial: FriendId[];
  obstacles: Circle[];
  hazards: Circle[];
  winds: { x: number; w: number; strength: number }[];
  bells: { x: number; y: number }[];
  lights: { x: number; y: number }[];
  perches: Perch[];
  goal: { x: number; y: number };
  hint: string;
};
export const LEVELS: Level[] = [
  {
    title: "A little leap of faith",
    subtitle: "The clover shallows",
    chapter: "01",
    story:
      "The rain has stopped. But two little friends are still a long way from home.",
    theme: "morning",
    width: 3100,
    start: { x: 190, y: 330 },
    initial: [],
    friends: [
      { id: "mochi", x: 640, y: 395 },
      { id: "pippin", x: 1740, y: 295 },
    ],
    obstacles: [
      { x: 1060, y: 665, r: 140 },
      { x: 1380, y: 90, r: 165 },
      { x: 2180, y: 660, r: 180 },
    ],
    hazards: [{ x: 2740, y: 210, r: 44 }],
    winds: [{ x: 1860, w: 220, strength: 85 }],
    bells: [
      { x: 1210, y: 410 },
      { x: 2240, y: 360 },
    ],
    lights: [
      { x: 360, y: 300 },
      { x: 480, y: 330 },
      { x: 790, y: 320 },
      { x: 925, y: 265 },
      { x: 1120, y: 340 },
      { x: 1360, y: 460 },
      { x: 1500, y: 390 },
      { x: 1630, y: 320 },
      { x: 1900, y: 260 },
      { x: 2060, y: 290 },
      { x: 2300, y: 250 },
      { x: 2610, y: 400 },
    ],
    perches: [
      { x: 640, y: 452, kind: "cup" },
      { x: 1740, y: 360, kind: "mushroom" },
      { x: 2800, y: 650, kind: "leaf" },
    ],
    goal: { x: 2860, y: 400 },
    hint: "Fly close to Mochi to take her paw. The golden fireflies show a safe route.",
  },
  {
    title: "Room for two more",
    subtitle: "Teacup town",
    chapter: "02",
    story:
      "Some friends are made for adventures. Others need a little nudge out of their teacup.",
    theme: "sunset",
    width: 3550,
    start: { x: 180, y: 300 },
    initial: ["mochi", "pippin"],
    friends: [
      { id: "boba", x: 1040, y: 435 },
      { id: "puff", x: 2460, y: 280 },
    ],
    obstacles: [
      { x: 680, y: 90, r: 175 },
      { x: 1560, y: 660, r: 175 },
      { x: 2020, y: 85, r: 175 },
      { x: 2860, y: 660, r: 175 },
    ],
    hazards: [
      { x: 1470, y: 310, r: 40 },
      { x: 2170, y: 430, r: 44 },
    ],
    winds: [
      { x: 420, w: 300, strength: 110 },
      { x: 1770, w: 340, strength: -125 },
      { x: 2700, w: 240, strength: 130 },
    ],
    bells: [
      { x: 1170, y: 335 },
      { x: 2600, y: 350 },
    ],
    lights: [
      { x: 330, y: 300 },
      { x: 520, y: 410 },
      { x: 730, y: 430 },
      { x: 920, y: 380 },
      { x: 1220, y: 300 },
      { x: 1400, y: 205 },
      { x: 1620, y: 260 },
      { x: 1810, y: 400 },
      { x: 2030, y: 470 },
      { x: 2260, y: 340 },
      { x: 2640, y: 270 },
      { x: 2980, y: 310 },
      { x: 3160, y: 340 },
    ],
    perches: [
      { x: 1040, y: 495, kind: "spool" },
      { x: 2460, y: 345, kind: "cup" },
      { x: 530, y: 660, kind: "house" },
      { x: 1910, y: 700, kind: "house" },
    ],
    goal: { x: 3300, y: 350 },
    hint: "Hold Space (or the hug button) to gather your friends through tight spots. Release to recharge.",
  },
  {
    title: "Nobody left behind",
    subtitle: "The last rain",
    chapter: "03",
    story:
      "One last crossing. One little star. Four very good reasons to keep going.",
    theme: "storm",
    width: 3900,
    start: { x: 190, y: 320 },
    initial: ["mochi", "pippin", "boba", "puff"],
    friends: [],
    obstacles: [
      { x: 860, y: 675, r: 160 },
      { x: 1270, y: 75, r: 175 },
      { x: 1780, y: 660, r: 175 },
      { x: 2320, y: 80, r: 165 },
      { x: 2870, y: 660, r: 155 },
    ],
    hazards: [
      { x: 970, y: 300, r: 44 },
      { x: 1570, y: 400, r: 46 },
      { x: 2210, y: 375, r: 44 },
      { x: 3080, y: 330, r: 48 },
    ],
    winds: [
      { x: 580, w: 400, strength: -160 },
      { x: 1400, w: 360, strength: 160 },
      { x: 2080, w: 360, strength: -170 },
      { x: 2800, w: 420, strength: 175 },
    ],
    bells: [
      { x: 1130, y: 400 },
      { x: 1960, y: 330 },
      { x: 3220, y: 440 },
    ],
    lights: [
      { x: 390, y: 300 },
      { x: 600, y: 290 },
      { x: 820, y: 220 },
      { x: 1100, y: 370 },
      { x: 1300, y: 430 },
      { x: 1480, y: 310 },
      { x: 1720, y: 220 },
      { x: 1910, y: 300 },
      { x: 2130, y: 470 },
      { x: 2350, y: 450 },
      { x: 2600, y: 300 },
      { x: 2840, y: 230 },
      { x: 3090, y: 480 },
      { x: 3400, y: 350 },
    ],
    perches: [
      { x: 650, y: 680, kind: "house" },
      { x: 2500, y: 690, kind: "spool" },
    ],
    goal: { x: 3650, y: 330 },
    hint: "Stay clear of the spinning seed pods. Boba steadies the wind; Puff keeps little paws afloat.",
  },
];
export const clamp = (v: number, a: number, b: number) =>
  Math.max(a, Math.min(b, v));
export function partyTraits(ids: FriendId[], hugging = false) {
  const lead = ids[0];
  return {
    speed:
      (lead === "pippin" ? 320 : ids.includes("pippin") ? 280 : 250) *
      (hugging ? 0.77 : 1),
    gravity: lead === "puff" ? 75 : ids.includes("puff") ? 115 : 185,
    link: hugging
      ? 33
      : lead === "mochi"
        ? 70
        : ids.includes("mochi")
          ? 62
          : 53,
    wind:
      (lead === "boba" ? 0.2 : ids.includes("boba") ? 0.4 : 1) *
      (hugging ? 0.45 : 1),
  };
}
export const dist = (
  a: { x: number; y: number },
  b: { x: number; y: number },
) => Math.hypot(a.x - b.x, a.y - b.y);
export function requiredFriends(level: Level) {
  return [...level.initial, ...level.friends.map((f) => f.id)];
}
export function canFinish(level: Level, party: FriendId[]) {
  return requiredFriends(level).every((id) => party.includes(id));
}
export function starsFor(lights: number, total: number, bumps: number) {
  return (
    1 +
    Number(lights >= Math.ceil(total * 0.65)) +
    Number(lights === total && bumps <= 2)
  );
}
export type Save = {
  unlocked: number;
  best: Record<number, { stars: number; lights: number; time: number }>;
};
export const EMPTY_SAVE: Save = { unlocked: 0, best: {} };
export function parseSave(raw: string | null): Save {
  try {
    const p = JSON.parse(raw ?? "null");
    if (!p || !Number.isInteger(p.unlocked) || p.unlocked < 0 || p.unlocked > 3)
      return { ...EMPTY_SAVE, best: {} };
    const best: Save["best"] = {};
    for (let i = 0; i < 3; i++) {
      const b = p.best?.[i];
      if (
        b &&
        Number.isInteger(b.stars) &&
        b.stars >= 1 &&
        b.stars <= 3 &&
        Number.isFinite(b.lights) &&
        b.lights >= 0 &&
        Number.isFinite(b.time) &&
        b.time >= 0
      )
        best[i] = b;
    }
    return { unlocked: p.unlocked, best };
  } catch {
    return { ...EMPTY_SAVE, best: {} };
  }
}
