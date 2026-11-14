# Dust Offering

A quiet sand-on-stone browser prototype at the Black Pyramid. Let sand gather, then brush it with a finger, pen, or mouse. Grains cling lightly to the stone and more strongly to other sand. Your stroke loosens and redistributes that material; later grains follow the deposits themselves. Missed sand stays visible in piles below the stone.

**Current revision: 0.2.0, `stone-offering-v1`.** Maximum grain speed and pour density are about five times lower than the original prototype. There are no separate drawing tools. Free Pour opens by default; Pause pour and Reset are always available. Optional Challenge, local bests, sharing, muted-by-default sound, and responsive touch/desktop controls remain available.

- Play: <https://dust-offering.sirsean.me>
- [Current direction](docs/stone-sand-plan.md) · [Architecture](docs/architecture.md) · [Status](docs/status.md)
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

Browser tests start Vite if necessary. With Vite running, `npm run playtest` simulates real-time gathering, brushing, persistent ground piles, the new challenge, and a retained-material stress scene. It takes roughly two minutes and saves evidence in `artifacts/`. A system Chromium can be selected with `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium`.

## Deploy

Use the configured Cloudflare environment token for direct Wrangler deployment:

```sh
npm run deploy
npm run deploy:branch -- stone-sand
npm run deploy:branch:delete -- stone-sand
```

GitHub Actions runs code and browser checks. Automated deployments remain deferred by the owner; no Actions deployment secret is required for direct deployment. Deleting a branch alone does not remove its manually deployed preview. See the deployment runbook for writable cache/config directories in restricted environments.

## Continue development

Follow [AGENTS.md](AGENTS.md) and the current sand-on-stone plan. Preserve the literal grains on both stone and ground, bond-release behavior, seeded replay, and accounting. Relaxed pace and natural finger shaping take priority over the old drawn-ridge split experiment. The next evaluation is how the slower material feels under a real thumb.
