import { test } from "node:test";
import assert from "node:assert/strict";
import {
  LEVELS,
  FRIENDS,
  canFinish,
  requiredFriends,
  starsFor,
  parseSave,
  clamp,
} from "./levels.ts";

test("every chapter requires all of its friends before allowing the ending", () => {
  for (const level of LEVELS) {
    const required = requiredFriends(level);
    assert.equal(new Set(required).size, required.length);
    assert.equal(canFinish(level, required), true);
    for (const missing of required)
      assert.equal(
        canFinish(
          level,
          required.filter((id) => id !== missing),
        ),
        false,
      );
  }
});
test("chapters form one continuous rescue, with all four friends in the final crossing", () => {
  assert.deepEqual(LEVELS[0].initial, []);
  for (let i = 1; i < LEVELS.length; i++)
    assert.deepEqual(LEVELS[i].initial, requiredFriends(LEVELS[i - 1]));
  assert.deepEqual(
    [...requiredFriends(LEVELS[2])].sort(),
    Object.keys(FRIENDS).sort(),
  );
});
test("ratings reward completing a chapter, exploration, and careful flying", () => {
  assert.equal(starsFor(0, 12, 9), 1);
  assert.equal(starsFor(7, 12, 0), 1);
  assert.equal(starsFor(8, 12, 9), 2);
  assert.equal(starsFor(12, 12, 3), 2);
  assert.equal(starsFor(12, 12, 2), 3);
  assert.equal(starsFor(12, 12, 0), 3);
});
test("a corrupt or unsupported save never unlocks chapters or crashes the game", () => {
  for (const raw of [
    null,
    "oops",
    "{}",
    "null",
    "[]",
    '{"unlocked":99}',
    '{"unlocked":-1}',
    '{"unlocked":1.5}',
  ])
    assert.deepEqual(parseSave(raw), { unlocked: 0, best: {} });
  assert.deepEqual(
    parseSave(
      '{"unlocked":2,"best":{"0":{"stars":3,"lights":12,"time":62},"1":{"stars":9,"lights":13,"time":5}}}',
    ),
    { unlocked: 2, best: { 0: { stars: 3, lights: 12, time: 62 } } },
  );
  assert.deepEqual(
    parseSave('{"unlocked":1,"best":{"0":{"stars":3,"lights":-1,"time":-3}}}'),
    { unlocked: 1, best: {} },
  );
});
test("every pickup, checkpoint, and home is reachable outside solid terrain and dangerous seed pods", () => {
  for (const level of LEVELS) {
    for (const point of [
      ...level.friends,
      ...level.lights,
      ...level.bells,
      level.start,
      level.goal,
    ]) {
      assert(point.x > 25 && point.x < level.width - 25);
      assert(point.y > 80 && point.y < 670);
      for (const obstacle of level.obstacles)
        assert(
          Math.hypot(point.x - obstacle.x, point.y - obstacle.y) >
            obstacle.r + 25,
          `${level.title}: target ${point.x},${point.y} inside terrain`,
        );
      for (const hazard of level.hazards)
        assert(
          Math.hypot(point.x - hazard.x, point.y - hazard.y) > hazard.r + 20,
          `${level.title}: target inside a seed pod`,
        );
    }
  }
});
test("camera and energy bounds cannot extend beyond the world or their valid range", () => {
  assert.equal(clamp(-10, 0, 1), 0);
  assert.equal(clamp(2, 0, 1), 1);
  assert.equal(clamp(0.5, 0, 1), 0.5);
});

test("changing the first friend changes the physics, while every companion keeps a passive benefit", async () => {
  const { partyTraits } = await import("./levels.ts");
  const empty = partyTraits([]),
    mochi = partyTraits(["mochi", "pippin", "boba", "puff"]),
    pippin = partyTraits(["pippin", "mochi", "boba", "puff"]),
    boba = partyTraits(["boba", "mochi", "pippin", "puff"]),
    puff = partyTraits(["puff", "mochi", "pippin", "boba"]);
  assert(pippin.speed > mochi.speed && mochi.speed > empty.speed);
  assert(mochi.link > pippin.link);
  assert(boba.wind < mochi.wind && mochi.wind < empty.wind);
  assert(puff.gravity < mochi.gravity && mochi.gravity < empty.gravity);
  const hug = partyTraits(["mochi", "pippin", "boba", "puff"], true);
  assert(
    hug.link < mochi.link && hug.wind < mochi.wind && hug.speed < mochi.speed,
  );
});

test("friend puzzles enforce the leader, stretch and timed passage rules", async () => {
  const {
    ENCOUNTERS,
    newEncounterState,
    advanceEncounter,
    canPassEncounter,
    encounterAnchor,
  } = await import("./adventure.ts");
  for (const e of ENCOUNTERS.flat()) {
    const input = {
      ...encounterAnchor(e),
      dt: e.charge + 0.1,
      acting: true,
      lead: e.friend,
      hugging: false,
    };
    assert.equal(
      advanceEncounter(e, newEncounterState(), { ...input, lead: undefined })
        .progress,
      0,
    );
    const solved = advanceEncounter(e, newEncounterState(), input);
    assert(solved.cleared || solved.openFor > 0);
    if (e.window) {
      assert.equal(
        advanceEncounter(e, solved, {
          ...input,
          acting: false,
          dt: e.window + 0.1,
        }).openFor,
        0,
      );
      const y = e.friend === "puff" ? 250 : e.y;
      assert(canPassEncounter(e, solved, y));
      assert(
        advanceEncounter(e, solved, { ...input, x: e.x + 40, y, dt: 0.01 })
          .cleared,
      );
      assert(!canPassEncounter(e, solved, 550));
    }
  }
  const e = ENCOUNTERS[0][0];
  assert.equal(
    advanceEncounter(e, newEncounterState(), {
      ...encounterAnchor(e),
      dt: 2,
      acting: true,
      lead: "mochi",
      hugging: true,
    }).progress,
    0,
  );
});
test("boat requires gathering friends, and the ending requires three collected hearts", async () => {
  const { boatPosition, canBoardBoat, canReachHome, HOME } = await import(
    "./adventure.ts"
  );
  const boat = boatPosition(0);
  assert(boatPosition(5).x > boat.x);
  const above = { x: boat.x, y: boat.y - 50 };
  assert(canBoardBoat(above, boat, true));
  assert(!canBoardBoat(above, boat, false));
  assert(!canBoardBoat({ x: boat.x + 200, y: boat.y }, boat, true));
  assert(!canReachHome(HOME, 2));
  assert(canReachHome(HOME, 3));
  assert(!canReachHome({ x: 0, y: 0 }, 3));
});
