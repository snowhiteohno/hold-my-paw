# Hold My Paw

A small adventure with a very big heart. Created by **Mallika Suri**.

Guide a little star across a floating storybook world, rescue four unlikely friends, and bring everybody home. A real-time chain simulation gives each friend their own weight; wind, terrain, seed pods, and a rechargeable group hug make the journey a little wobbly.

## Play locally

Requires Node.js 22+ and pnpm.

```sh
pnpm install
pnpm dev
```

Open **http://localhost:4175**. The server also accepts connections from other devices on the same network, using your computer's LAN address and port 4175.

For a production build:

```sh
pnpm build
pnpm preview
```

Stop the development server before running preview, because both use port 4175. The game is static: the `dist/` directory can be hosted by any static web server. It needs no API keys, backend, or account.

## Controls

- **Hold and move the mouse** to steer the star, or use **WASD / arrow keys**.
- On a phone or tablet, **hold and drag a finger** to fly.
- Fly close to a stranded animal to take their paw.
- **Hold Space** or press the heart button to shorten the chain. Release to recharge.
- **Q**, or the small swap button above the friend portraits, rotates the lead friend. You can also select a rescued friend’s portrait.
- **Hold E**, or the contextual Help button, to use the lead friend’s ability inside a marked circle.
- **Escape / P**, or the pause button, pauses the adventure.
- Touch golden bells to set a checkpoint. Seed pods and water send the star safely back to the last bell; friends and collected fireflies are retained.
- Reach the umbrella with every friend to finish chapters one and two. In the last chapter, catch the drifting paper boat and hold paws above it to board. Then steer the friends as they carry the star, collecting three warm hearts before reaching home.

The pause menu has a gentler-motion setting, initialized from the operating system's preference. Music starts muted and can be enabled from the speaker button. The game pauses when the browser loses focus.

## The friends

| Friend             | Passive benefit                     | When holding the first paw |
| ------------------ | ----------------------------------- | -------------------------- |
| Mochi, the kitten  | Longer links for a stretchier chain | An even longer swing       |
| Pippin, the frog   | Faster flight                       | Extra speed                |
| Boba, the capybara | Less wind drift                     | Stronger wind resistance   |
| Puff, the duckling | Lower chain gravity                 | Extra lift                 |

Boba has more physical weight, and Puff has less. Swapping their positions also changes the way the chain swings. A group hug brings the links together and further reduces wind drift, at the cost of slower flight and hug energy.

## Three chapters

1. **The clover shallows** — find Mochi and Pippin; learn to fly, collect fireflies, and use checkpoints.
2. **Teacup town** — bring Boba and Puff into the family; navigate more wind and narrower routes.
3. **The last rain** — carry all four friends through the final storm, followed by the story's ending.

One star rewards completion. Two reward collecting at least 65% of fireflies. Three require every firefly and no more than two checkpoint recoveries. Completed chapters, best ratings, firefly totals, and best times are stored locally in the browser. There is no overall time limit. Pippin’s petals, Puff’s updraft and the paper boat have short local timers with unlimited retries; friends are never lost.

## Validation

```sh
pnpm test
pnpm build
```

Browser checks require the game server to be running:

```sh
pnpm exec playwright install chromium
pnpm test:browser
```

Use `GAME_URL=http://127.0.0.1:4176 pnpm test:browser` for a different test server. The desktop test plays all three chapters through real pointer and keyboard input, verifies a checkpoint recovery, all four friend challenges, wrong-leader rejection, timed retries, boat boarding and the playable carry-home ending. The mobile test uses Chromium touch events, including the Help action and steering while holding paws with two fingers. Tests use isolated browser contexts; they do not change your personal save. Screenshots are written to `artifacts/`.

The browser harness reads the scene ref through React's test-page fiber solely to locate the moving canvas character. It does not teleport the star, unlock the playthrough's chapters, change game physics, or add debugging globals to the shipped game.

## Implementation

- React and TypeScript for menus, dialogs, progress, and accessible controls.
- A custom Canvas 2D renderer for all characters, landscapes, particles, and animation.
- A fixed-substep Verlet chain with iterative distance and terrain constraints.
- Procedural Web Audio music and sound effects.
- Local fonts and artwork; no external requests are needed to play after the files load.

The game does not request a microphone, camera, or access to personal files. Gameplay runs entirely in the browser. If browser storage is unavailable, playing still works; progress simply will not survive a reload.

## Credits

Game: Mallika Suri.

Fonts: DynaPuff (display) and Nunito (interface), from the Fontsource library, distributed under the SIL Open Font License. Self-hosted WOFF2 files are bundled through `@fontsource/dynapuff` and `@fontsource/nunito`; licenses are included in those packages and in `public/fonts/`. React, Vite, TypeScript, and Playwright are open-source libraries/tools with their respective licenses in the dependency packages.

## First-time player guide

Use **First time? Read the play guide** on the title screen, or **Play guide** during a chapter. The guide pauses every gameplay timer and explains the story, controls, friend-specific gates, checkpoints, ratings and paper-boat boarding. The ending walkthrough is collapsed under a spoiler label. New checkpoints, friend puzzles, boat boarding and the carry-home scene show a contextual instruction popup on arrival. Each popup appears once per chapter attempt and pauses the simulation until dismissed. Gate prompts also show the current and required leader.

Run `pnpm test:guide` with the server running to verify guide access, timer pause/resume and mobile layouts.
