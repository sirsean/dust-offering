# Dust Offering

A quiet dust-on-stone browser prototype at the Black Pyramid, in warm umber and desert dusk. Discover an initially invisible stone through falling sand and brushing with fingers, a pen, or a mouse. Repeated contact gradually uncovers the touched areas. Your stroke also loosens sand and leaves a dark greasy mark that gently guides later grains downhill. Repeated passes deepen the mark and strengthen its grip; sand can still slide along it and drift away. Missed sand stays visible in piles below the stone.

**Current revision: 0.7.0, challenge `stone-offering-v5`.** The triangle and its rim start hidden; fingers and sand reveal the local surface. Discovery lasts for the run, even after grease fades. Reset hides it again. Dust falls in from above the board through an invisible opening that slowly sways across the scene in a one-minute cycle. Multiple fingers can brush the entire triangle independently. Grease marks fade with a six-second strength half-life. Free Pour opens by default; Pause pour, Reset, optional Challenge, local bests, sharing, and muted-by-default sound remain available.

- Play: <https://dust-offering.sirsean.me>
- [Current direction](docs/stone-sand-plan.md) · [Architecture](docs/architecture.md) · [Status](docs/status.md)
- [Desert visual direction and screenshots](docs/visual-style.md)
- [Physics measurements](docs/physics-results.md) · [Playtest evidence](docs/playtest.md) · [Deployment](docs/deployment.md)
- [Original Fringe plan](https://chatgpt.com/space/page_ad5cbe9d6d2881919e3df3cfb9f08feb) and [historical v2 results](docs/archive/v2/playtest.md)

## Run and check

Use Node 24 and npm. No account, backend, or runtime browser secrets are needed.

```sh
npm ci
npm run dev
npm run check
```

Vite normally serves <http://localhost:5173>; its host setting also allows phone testing on a trusted local network. Space pauses/resumes the pour. Brush the stone directly; no tool selection is needed. Challenge uses 960 grains, targets 360 / 600, and has no countdown or time penalty. Scores from the original physics stay separate.

```sh
npm run test:physics
npx playwright install chromium
npm run test:browser
```

Browser tests start Vite if necessary. With Vite running, `npm run playtest` watches a real-time source sweep, then simulates brushing, two-finger traces, layering and decay, persistent ground piles, the challenge, and a retained-material stress scene. It takes about two and a half minutes and saves evidence in `artifacts/`. A system Chromium can be selected with `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium`.

## Deploy

Use the configured Cloudflare environment token for direct Wrangler deployment:

```sh
npm run deploy
npm run deploy:branch -- reveal-stone
npm run deploy:branch:delete -- reveal-stone
```

GitHub Actions runs code and browser checks. Automated deployments remain deferred by the owner; no Actions deployment secret is required for direct deployment. Deleting a branch alone does not remove its manually deployed preview. See the deployment runbook for writable cache/config directories in restricted environments.

## Continue development

Follow [AGENTS.md](AGENTS.md) and the current sand-on-stone plan. Preserve the literal grains on both stone and ground, bond-release behavior, seeded replay, and accounting. Grease-mark depth, adhesion and downhill guidance use the same decaying field; persistent stone discovery uses a separate field. Each active pointer owns its own stroke. The next evaluation is how discovering the dusty stone and leaving greasy finger marks feels under real fingers.
