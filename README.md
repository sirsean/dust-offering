# Dust Offering

A quiet dust-on-stone game at the Black Pyramid. Push dust into rings to complete an offering. Your finger and the dust gradually uncover the stone, and that discovery carries through a seeded sequence of layouts. Complete offerings to uncover records from the Pyramid Order.

- [Play Dust Offering](https://dust-offering.sirsean.me) · [Piles level design and checks](docs/piles.md)
- [Play the earlier Free Pour and Challenge](https://dust-offering.sirsean.me/pour) · [Fine-dust tuning and performance](docs/fine-dust.md)
- [Top-down welling-dust studies and automated comparisons](docs/upwelling-study.md) · [Try Piles](https://top-down-lab.dust-offering.sirsean.me/lab?goal=gather&seed=48)
- [Falling-sand plan](docs/stone-sand-plan.md) · [Architecture](docs/architecture.md) · [Status](docs/status.md)
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

Vite normally serves Piles at <http://localhost:5173> and Free Pour and Challenge at <http://localhost:5173/pour.html>. Its host setting also allows phone testing on a trusted local network.

```sh
npm run test:physics
npx playwright install chromium
npm run test:browser
```

Browser tests start Vite if necessary. With Vite running, `npm run playtest` exercises the earlier falling-sand game, including the source sweep, brush traces, ground piles, Challenge and a stress scene. It takes about two and a half minutes and saves evidence in `artifacts/`. A system Chromium can be selected with `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium`.

## Deploy

Use the configured Cloudflare environment token for direct Wrangler deployment:

```sh
npm run deploy
npm run deploy:branch -- fine-dust
npm run deploy:branch:delete -- fine-dust
```

GitHub Actions runs code and browser checks. Automated deployments remain deferred by the owner; no Actions deployment secret is required for direct deployment. Deleting a branch alone does not remove its manually deployed preview. See the deployment runbook for writable cache/config directories in restricted environments.

## Continue development

Follow [AGENTS.md](AGENTS.md) and the [Piles design](docs/piles.md). Keep generated offerings reproducible, preserve discovery through progression, and check changes with physical brush strokes and emulated touch.
