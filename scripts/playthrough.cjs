const fs = require("node:fs");
const path = require("node:path");
const origin = process.env.GAME_URL || "http://127.0.0.1:4175";
const artifacts = path.resolve(__dirname, "../artifacts");
fs.mkdirSync(artifacts, { recursive: true });
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 960 },
    });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.clock.install();
    await page.goto(origin, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    // Read-only instrumentation of the scene, leaving all gameplay actions to real pointer/keyboard events.
    await page.getByRole("button", { name: "Let’s find our friends" }).click();
    await page
      .getByRole("button", { name: "A little courage. Let’s go." })
      .click();
    await page.clock.runFor(100);
    const state = () =>
      page.evaluate(() => {
        const canvas = document.querySelector(".game-canvas");
        let f =
            canvas[
              Object.keys(canvas).find((k) => k.startsWith("__reactFiber"))
            ],
          g;
        while (f && !g) {
          let hook = f.memoizedState;
          while (hook) {
            if (hook.memoizedState?.current?.star) {
              g = hook.memoizedState.current;
              break;
            }
            hook = hook.next;
          }
          f = f.return;
        }
        if (!g) throw Error("Scene not mounted");
        return {
          x: g.star.x,
          y: g.star.y,
          camera: g.camera,
          w: g.logicalWidth,
          party: g.party.map((p) => p.id),
          paused: g.paused,
          finished: g.finished,
          lights: g.collected.size,
          bumps: g.bumps,
          elapsed: g.elapsed,
          hug: g.hug,
          pointer: g.pointer.down,
          level: g.index,
          phase: g.phase,
          encounters: g.encounters[g.index],
          boatTime: g.boatTime,
          hearts: g.warmth.size,
        };
      });
    const tutorials = new Set();
    async function dismissStep() {
      const button = page.getByRole("button", { name: "Got it — let’s try!" });
      if (!(await button.count())) return false;
      const title = await page.getByRole("dialog").getAttribute("aria-label");
      assert(!tutorials.has(title), "Tutorial repeated: " + title);
      tutorials.add(title);
      const before = await state();
      assert(before.paused);
      await page.clock.runFor(2200);
      const after = await state();
      assert.equal(after.elapsed, before.elapsed);
      assert.equal(after.boatTime, before.boatTime);
      assert.deepEqual(after.encounters, before.encounters);
      await page.screenshot({
        path: path.join(artifacts, `step-${tutorials.size}.png`),
      });
      await button.click();
      await page.clock.runFor(30);
      return true;
    }
    const box = await page.locator(".game-canvas").boundingBox();
    async function move(x, y, stopOnBump = false) {
      const initialBumps = (await state()).bumps;
      for (let i = 0; i < 220; i++) {
        let s = await state();
        if (stopOnBump && s.bumps > initialBumps) {
          await page.mouse.up();
          return;
        }
        if (s.finished) return;
        if (s.paused) {
          await page.mouse.up();
          const friend = page.getByRole("button", {
            name: "Come on, little friend",
          });
          if (await friend.count()) {
            await page.screenshot({
              path: path.join(artifacts, `paw-friend-${s.party.at(-1)}.png`),
            });
            await friend.click();
            await page.clock.runFor(30);
            s = await state();
          } else if (await dismissStep()) {
            s = await state();
          } else throw Error("Unexpected pause " + JSON.stringify(s));
        }
        if (Math.hypot(s.x - x, s.y - y) < 18) {
          await page.mouse.up();
          return;
        }
        const px =
          box.x +
          Math.min(
            box.width - 35,
            Math.max(35, ((x - s.camera) / s.w) * box.width),
          );
        const py = box.y + (y / 800) * box.height;
        await page.mouse.move(px, py);
        if (!s.pointer) {
          await page.mouse.up();
          await page.mouse.down();
        }
        await page.clock.runFor(160);
      }
      throw Error(
        "Could not reach " + x + "," + y + " " + JSON.stringify(await state()),
      );
    }
    async function follow(points) {
      for (const [x, y] of points) await move(x, y);
    }
    await follow([
      [360, 300],
      [480, 330],
      [640, 395],
      [790, 320],
      [925, 265],
      [1120, 340],
      [1210, 410],
    ]);
    // Real keyboard pause and a frozen game clock.
    await page.keyboard.press("Escape");
    const before = (await state()).elapsed;
    await page.clock.runFor(2500);
    assert.equal((await state()).elapsed, before);
    await page.getByRole("button", { name: "Back to our adventure" }).click();
    await follow([
      [1360, 460],
      [1420, 370],
    ]);
    async function help(id, x, y, charge) {
      await page.getByRole("button", { name: `Let ${id} lead` }).click();
      await move(x, y);
      await page.keyboard.down("e");
      await page.clock.runFor(charge);
      await page.keyboard.up("e");
    }
    // Mochi cannot stretch while hugging. Wrong lead cannot solve a friend's puzzle.
    await page.keyboard.down("Space");
    await page.keyboard.down("e");
    await page.clock.runFor(800);
    assert.equal((await state()).encounters[0].progress, 0);
    await page.keyboard.up("Space");
    await page.keyboard.up("e");
    await help("Mochi", 1420, 370, 1700);
    assert((await state()).encounters[0].cleared);
    await follow([
      [1630, 320],
      [1740, 295],
      [1900, 260],
      [2060, 290],
      [2240, 360],
      [2380, 330],
    ]);
    await page.keyboard.down("e");
    await page.clock.runFor(1300);
    await page.keyboard.up("e");
    assert.equal((await state()).encounters[1].progress, 0);
    await help("Pippin", 2380, 330, 1100);
    await page.clock.runFor(3400);
    assert.equal((await state()).encounters[1].openFor, 0);
    await help("Pippin", 2380, 330, 1100);
    await page.screenshot({ path: path.join(artifacts, "paw-petals.png") });
    await move(2610, 330);
    assert((await state()).encounters[1].cleared);
    await page.keyboard.down("Space");
    await page.clock.runFor(1000);
    assert((await state()).hug < 0.8);
    await page.keyboard.up("Space");
    await page.clock.runFor(1500);
    assert((await state()).hug > 0.9);
    const order = (await state()).party;
    await page.keyboard.press("q");
    assert.notDeepEqual((await state()).party, order);
    await page.screenshot({ path: path.join(artifacts, "paw-chain.png") });
    await move(2860, 400);
    await page.clock.runFor(1500);
    console.log("Chapter 1 complete");
    assert((await state()).finished);
    assert.equal((await state()).bumps, 0);
    await page.screenshot({ path: path.join(artifacts, "paw-result.png") });
    await page.getByRole("button", { name: "On to the next chapter" }).click();
    await page.getByRole("button", { name: "We’ve got each other." }).click();
    await page.clock.runFor(100);
    await follow([
      [330, 300],
      [520, 410],
      [730, 430],
      [920, 380],
      [1040, 435],
      [1170, 335],
      [1220, 300],
      [1400, 205],
      [1620, 260],
      [1670, 350],
    ]);
    await page.getByRole("button", { name: "Let Boba lead" }).click();
    await move(1670, 350);
    await page.keyboard.down("e");
    // Steering into the wind keeps Boba within the marked anchor circle.
    for (let i = 0; i < 15; i++) {
      const q = await state();
      await page.mouse.move(
        box.x + ((1710 - q.camera) / q.w) * box.width,
        box.y + (350 / 800) * box.height,
      );
      if (!q.pointer) await page.mouse.down();
      await page.clock.runFor(160);
    }
    await page.mouse.up();
    await page.keyboard.up("e");
    assert((await state()).encounters[0].cleared);
    await follow([
      [1810, 400],
      [2030, 530],
      [2300, 550],
      [2460, 280],
      [2600, 350],
      [2640, 270],
      [2810, 360],
    ]);
    await help("Puff", 2810, 360, 1400);
    assert((await state()).encounters[1].openFor > 0);
    await move(3040, 260);
    assert((await state()).encounters[1].cleared);
    await follow([
      [3160, 340],
      [3300, 350],
    ]);
    await page.clock.runFor(1500);
    console.log("Chapter 2 complete");
    assert((await state()).finished);
    await page.screenshot({ path: path.join(artifacts, "paw-result2.png") });
    await page.getByRole("button", { name: "On to the next chapter" }).click();
    await page.getByRole("button", { name: "We’ve got each other." }).click();
    await page.clock.runFor(100);
    await follow([
      [390, 300],
      [600, 290],
      [820, 220],
      [1000, 180],
      [1130, 400],
    ]);
    await page.screenshot({ path: path.join(artifacts, "paw-storm.png") });
    // A collision must return to the activated bell, retaining our friends.
    await move(970, 300, true);
    let after = await state();
    assert(after.bumps >= 1);
    assert.equal(after.party.length, 4);
    await follow([
      [1130, 400],
      [1300, 430],
      [1480, 280],
      [1650, 260],
      [1720, 220],
      [1960, 330],
      [2050, 460],
      [2130, 500],
      [2350, 450],
      [2600, 300],
      [2840, 230],
      [3000, 210],
      [3210, 230],
      [3220, 440],
      [3320, 350],
    ]);
    await dismissStep();
    assert.equal((await state()).phase, "boat");
    // Missing the boat is a local retry, keeping all four friends.
    const bumps = (await state()).bumps;
    await page.clock.runFor(12000);
    assert((await state()).bumps > bumps);
    assert.equal((await state()).party.length, 4);
    for (let i = 0; i < 100; i++) {
      const q = await state();
      if (q.phase !== "boat") break;
      const bx = 3380 + Math.max(0, q.boatTime) * 42;
      await page.mouse.move(
        box.x +
          Math.max(
            35,
            Math.min(box.width - 35, ((bx + 15 - q.camera) / q.w) * box.width),
          ),
        box.y + (490 / 800) * box.height,
      );
      if (!q.pointer) {
        await page.mouse.up();
        await page.mouse.down();
      }
      if (Math.abs(q.x - bx) < 95 && q.y > 420)
        await page.keyboard.down("Space");
      await page.clock.runFor(100);
    }
    await page.mouse.up();
    await page.keyboard.up("Space");
    assert.equal((await state()).phase, "fading");
    await page.screenshot({ path: path.join(artifacts, "paw-boat.png") });
    await page.clock.runFor(5500);
    assert.equal((await state()).phase, "carry");
    await page.clock.runFor(2000);
    assert(!(await state()).finished);
    await follow([
      [3940, 420],
      [4180, 300],
      [4410, 410],
    ]);
    assert.equal((await state()).hearts, 3);
    await page.screenshot({ path: path.join(artifacts, "paw-carry.png") });
    await move(4650, 380);
    await page.clock.runFor(1500);
    console.log("Chapter 3 complete");
    assert((await state()).finished);
    await page.getByRole("button", { name: "One last little moment" }).click();
    await page.clock.runFor(6000);
    await page.screenshot({ path: path.join(artifacts, "paw-ending.png") });
    await page
      .getByRole("heading", { name: "You carried us. Our turn." })
      .waitFor();
    assert.equal(
      tutorials.size,
      7,
      "Four friend skills, checkpoint, boat and carry-home tutorials",
    );
    assert.deepEqual(errors, []);
    await page.getByRole("button", { name: "Keep this little memory" }).click();
    await page.reload();
    assert.equal(
      await page
        .getByRole("button", { name: "Play chapter 3: Nobody left behind" })
        .isEnabled(),
      true,
    );
    console.log(
      "PASS complete playthrough, collectibles, hug, party rotation, pause, checkpoint recovery, ending, persistence, zero page errors",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
