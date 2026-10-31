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
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    const errors = [];
    const external = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("request", (r) => {
      if (!r.url().startsWith(origin)) external.push(r.url());
    });
    await page.clock.install();
    await page.goto(origin, { waitUntil: "networkidle" });
    await page.screenshot({
      path: path.join(artifacts, "paw-mobile-final.png"),
      fullPage: true,
    });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    await page.getByRole("button", { name: "Let’s find our friends" }).click();
    await page
      .getByRole("button", { name: "A little courage. Let’s go." })
      .click();
    await page.clock.runFor(100);
    const client = await page.context().newCDPSession(page);
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
        return {
          x: g.star.x,
          y: g.star.y,
          camera: g.camera,
          w: g.logicalWidth,
          party: g.party.map((p) => p.id),
          paused: g.paused,
          pointer: g.pointer.down,
          pointerId: g.pointer.id,
          hug: g.hug,
        };
      });
    let touched = false;
    const end = async () => {
      await client.send("Input.dispatchTouchEvent", {
        type: "touchEnd",
        touchPoints: [],
      });
      touched = false;
    };
    async function move(x, y) {
      for (let i = 0; i < 180; i++) {
        let s = await state();
        if (s.paused) {
          await end();
          const step = page.getByRole("button", {
            name: "Got it. Let’s try!",
          });
          if (await step.count()) await step.click();
          else
            await page
              .getByRole("button", { name: "Come on, little friend" })
              .click();
          await page.clock.runFor(30);
          s = await state();
        }
        if (Math.hypot(s.x - x, s.y - y) < 25) {
          await end();
          return;
        }
        const px = Math.max(20, Math.min(370, ((x - s.camera) / s.w) * 390)),
          py = (y / 800) * 844;
        await client.send("Input.dispatchTouchEvent", {
          type: touched ? "touchMove" : "touchStart",
          touchPoints: [{ x: px, y: py, id: 1 }],
        });
        touched = true;
        await page.clock.runFor(160);
      }
      throw Error("Cannot reach " + x + " " + JSON.stringify(await state()));
    }
    await move(640, 395);
    await move(1100, 370);
    await move(1420, 370);
    const help = await page
      .getByRole("button", { name: "Hold to help" })
      .boundingBox();
    await client.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [
        { x: help.x + help.width / 2, y: help.y + help.height / 2, id: 3 },
      ],
    });
    await page.clock.runFor(1800);
    await end();
    await move(1740, 295);
    assert.equal((await state()).party.length, 2);
    await page.screenshot({
      path: path.join(artifacts, "paw-mobile-game.png"),
    });
    const s = await state(),
      hug = await page
        .getByRole("button", { name: "Hold to gather your friends" })
        .boundingBox();
    const finger = {
      x: ((s.x - s.camera) / s.w) * 390,
      y: (s.y / 800) * 844,
      id: 1,
    };
    await client.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [finger],
    });
    await page.clock.runFor(100);
    await client.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [
        finger,
        { x: hug.x + hug.width / 2, y: hug.y + hug.height / 2, id: 2 },
      ],
    });
    await page.clock.runFor(1000);
    assert((await state()).hug < 0.85);
    await client.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [
        { x: hug.x + hug.width / 2, y: hug.y + hug.height / 2, id: 2 },
      ],
    });
    assert.equal((await state()).pointer, true);
    await end();
    const order = (await state()).party;
    await page.getByRole("button", { name: "Switch lead friend" }).click();
    assert.notDeepEqual((await state()).party, order);
    await page.getByRole("button", { name: "Pause game" }).click();
    await page.getByLabel("Gentler motion").check();
    await page.getByRole("button", { name: "Back to our adventure" }).click();
    await page.getByRole("button", { name: "Enable music" }).click();
    await page.clock.runFor(500);
    await page.getByRole("button", { name: "Mute music" }).click();
    assert.deepEqual(errors, []);
    assert.deepEqual(external, []);
    console.log(
      "PASS touch rescue, two-finger steering + hug, mobile friend swap, reduced motion, music toggle, no overflow or external network requests",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
