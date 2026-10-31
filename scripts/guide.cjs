const { chromium } = require("playwright");
const assert = require("node:assert/strict");
(async () => {
  const b = await chromium.launch();
  try {
    for (const width of [1440, 390, 320]) {
      const p = await b.newPage({
        viewport: { width, height: width === 1440 ? 960 : 844 },
      });
      const errors = [];
      p.on("pageerror", (e) => errors.push(e.message));
      await p.clock.install();
      await p.goto(process.env.GAME_URL || "http://localhost:4175");
      await p
        .getByRole("button", { name: "First time? Read the play guide" })
        .click();
      await p
        .getByRole("heading", { name: "How to catch the paper boat" })
        .scrollIntoViewIfNeeded();
      await p.getByRole("button", { name: "I’ve got this" }).click();
      await p.getByRole("button", { name: "Let’s find our friends" }).click();
      await p
        .getByRole("button", { name: "A little courage. Let’s go." })
        .click();
      await p.clock.runFor(100);
      const position = () =>
        p.evaluate(() => {
          const c = document.querySelector(".game-canvas");
          let f = c[Object.keys(c).find((k) => k.startsWith("__reactFiber"))];
          while (f) {
            let h = f.memoizedState;
            while (h) {
              if (h.memoizedState?.current?.star) {
                let g = h.memoizedState.current;
                return { time: g.elapsed, paused: g.paused };
              }
              h = h.next;
            }
            f = f.return;
          }
          throw Error("No engine");
        });
      await p.getByRole("button", { name: "Open play guide" }).click();
      const before = await position();
      assert(before.paused);
      await p.clock.runFor(3000);
      assert.equal((await position()).time, before.time);
      await p
        .getByRole("heading", { name: "The two buttons do different things" })
        .scrollIntoViewIfNeeded();
      await p.screenshot({ path: `artifacts/guide-${width}.png` });
      await p.getByRole("button", { name: "I’ve got this" }).click();
      await p.clock.runFor(200);
      assert(!(await position()).paused);
      assert((await position()).time > before.time);
      assert.equal(
        await p.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
      );
      assert.deepEqual(errors, []);
      await p.close();
    }
    console.log(
      "PASS guide access, content, pause/resume, mobile layout, no page errors",
    );
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
