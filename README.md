# Dust Offering

A quiet dust-on-stone browser prototype at the Black Pyramid, in warm umber and desert dusk. Discover an initially invisible stone through falling sand and brushing with fingers, a pen, or a mouse. Repeated contact gradually uncovers the touched areas. Your stroke also loosens sand and leaves a dark greasy mark that gently guides later grains downhill. Repeated passes deepen the mark and strengthen its grip; sand can still slide along it and drift away. Missed sand stays visible in piles below the stone.

**Current revision: 0.11.0, challenge `stone-offering-v8`.** Grains are one fifth the diameter, with five times the variable flow and a gentle seeded breeze. [Fine-dust tuning and performance](docs/fine-dust.md). Free Pour begins with dust already in flight and ready to touch. A broader finger sweeps real sand into banks and carries it along the swipe, with clearer material and bowl feedback. Uncover the stone at your own pace: a small meter leads to “Stone found,” then “New stone,” while you can keep playing on the same creation. Each free run varies its shower and mineral weathering. The slow variable pour, persistent discovery, fading grease, multi-touch, Fringe lettering and worn mechanical controls remain. Sound is optional and starts muted; enabling it adds dry brushing texture and quiet bowl tones. There is no explanation overlay, timer or forced reset.

- Play: <https://dust-offering.sirsean.me>
- [Play Piles](https://piles.dust-offering.sirsean.me/piles) · [Piles level design and checks](docs/piles.md)
- [Top-down welling-dust studies and automated comparisons](docs/upwelling-study.md) · [Try Piles](https://top-down-lab.dust-offering.sirsean.me/lab?goal=gather&seed=48)
- [Current direction](docs/stone-sand-plan.md) · [Architecture](docs/architecture.md) · [Status](docs/status.md)
- [Extensive gameplay review, experiments and before/after evidence](docs/gameplay-review.md)
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

Vite normally serves <http://localhost:5173>; its host setting also allows phone testing on a trusted local network. Space pauses/resumes the pour. Brush the stone directly; no tool selection is needed. Challenge uses 4,800 grains and targets 1,800 / 3,000; its uneven flow has no fixed pour duration, countdown or time penalty. Earlier scores stay separate.

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
npm run deploy:branch -- fine-dust
npm run deploy:branch:delete -- fine-dust
```

GitHub Actions runs code and browser checks. Automated deployments remain deferred by the owner; no Actions deployment secret is required for direct deployment. Deleting a branch alone does not remove its manually deployed preview. See the deployment runbook for writable cache/config directories in restricted environments.

## Continue development

Follow [AGENTS.md](AGENTS.md) and the current plan. Preserve literal grains, bond releases, seeded replay and accounting. Grease depth, adhesion and guidance share a decaying field; persistent discovery is separate. Each pointer owns its captured path and physical sampling residual. The next human evaluation is whether shaping sand and uncovering a new stone invites another swipe; automated agency and pacing improvements do not establish human enjoyment or retention.
