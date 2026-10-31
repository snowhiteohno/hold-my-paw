import type { FriendId } from "./levels";

export type Encounter = {
  id: string;
  friend: FriendId;
  title: string;
  description: string;
  x: number;
  y: number;
  charge: number;
  window: number;
};
export type EncounterState = {
  progress: number;
  openFor: number;
  cleared: boolean;
};
export const ENCOUNTERS: Encounter[][] = [
  [
    {
      id: "stretch",
      friend: "mochi",
      title: "The tangled trellis",
      description:
        "Let Mochi lead. Hover in the circle, release your hug, and hold E to reach the golden knot.",
      x: 1580,
      y: 370,
      charge: 1.4,
      window: 0,
    },
    {
      id: "leap",
      friend: "pippin",
      title: "A leap between petals",
      description:
        "Let Pippin lead. Hold E in the circle, then fly right through the flower before it closes!",
      x: 2540,
      y: 330,
      charge: 0.9,
      window: 3.2,
    },
  ],
  [
    {
      id: "anchor",
      friend: "boba",
      title: "A very dependable potato",
      description:
        "Let Boba lead. Fly against the gust to stay in the circle, and hold E until the wind settles.",
      x: 1830,
      y: 350,
      charge: 1.8,
      window: 0,
    },
    {
      id: "lift",
      friend: "puff",
      title: "Tiny wings. Big lift.",
      description:
        "Let Puff lead. Hold E in the circle, then fly up and right through the high arch.",
      x: 2970,
      y: 360,
      charge: 1,
      window: 4.5,
    },
  ],
  [],
];
export const newEncounterState = (): EncounterState => ({
  progress: 0,
  openFor: 0,
  cleared: false,
});
export function encounterAnchor(e: Encounter) {
  return { x: e.x - 160, y: e.y };
}
export function canPassEncounter(e: Encounter, s: EncounterState, y: number) {
  if (s.cleared) return true;
  if (s.openFor <= 0) return false;
  return e.friend === "puff"
    ? y < 330
    : e.friend === "pippin"
      ? y > 200 && y < 470
      : true;
}
export function advanceEncounter(
  e: Encounter,
  s: EncounterState,
  input: {
    dt: number;
    acting: boolean;
    lead: FriendId | undefined;
    hugging: boolean;
    x: number;
    y: number;
  },
): EncounterState {
  if (s.cleared) return s;
  const openFor = Math.max(0, s.openFor - input.dt);
  if (s.openFor > 0 && input.x > e.x + 35 && canPassEncounter(e, s, input.y))
    return { ...s, cleared: true };
  if (openFor > 0) return { ...s, openFor };
  const a = encounterAnchor(e),
    near = Math.hypot(input.x - a.x, input.y - a.y) < 68;
  const helping =
    near &&
    input.acting &&
    input.lead === e.friend &&
    !(e.friend === "mochi" && input.hugging);
  const progress =
    s.openFor > 0
      ? 0
      : Math.max(
          0,
          Math.min(
            1,
            s.progress + (helping ? input.dt / e.charge : -input.dt * 0.8),
          ),
        );
  if (progress >= 1)
    return { progress: 1, openFor: e.window, cleared: e.window === 0 };
  return { progress, openFor: 0, cleared: false };
}
export type SequencePhase = "journey" | "boat" | "fading" | "carry";
export const BOAT_SECONDS = 10;
export const BOAT_START = 3380;
export const boatPosition = (elapsed: number) => ({
  x: BOAT_START + Math.max(0, elapsed) * 42,
  y: 550 + Math.sin(Math.max(0, elapsed) * 1.6) * 10,
});
export function canBoardBoat(
  star: { x: number; y: number },
  boat: { x: number; y: number },
  hugging: boolean,
) {
  return (
    hugging &&
    Math.abs(star.x - boat.x) < 95 &&
    star.y > boat.y - 135 &&
    star.y < boat.y + 35
  );
}
export const WARMTH = [
  { x: 3940, y: 420 },
  { x: 4180, y: 300 },
  { x: 4410, y: 410 },
];
export const HOME = { x: 4650, y: 380 };
export const CARRY_WIDTH = 4900;
export function canReachHome(star: { x: number; y: number }, hearts: number) {
  return (
    hearts === WARMTH.length &&
    Math.hypot(star.x - HOME.x, star.y - HOME.y) < 100
  );
}
