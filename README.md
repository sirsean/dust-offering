# Dust Offering

A portrait browser game set at the Black Pyramid. Draw ridges and rub gaps to divide falling dust between two offering bowls.

**Status:** playable prototype. Free Pour, live Draw/Rub, the finite challenge, scores, sharing, optional sound, and mobile controls are implemented. The physics gate and scripted gameplay checks pass. See the [playtest report](docs/playtest.md) and [physics measurements](docs/physics-results.md).

- Production: <https://dust-offering.sirsean.me>
- Source plan: [Fringe / Dust Offering / Prototype Plan](https://chatgpt.com/space/page_ad5cbe9d6d2881919e3df3cfb9f08feb)
- [Implementation reference](docs/prototype-plan.md) · [Architecture](docs/architecture.md) · [Current work](docs/status.md) · [Deployment](docs/deployment.md)

## Run locally

Use Node 24 and npm.

```sh
npm ci
npm run dev
```

Open the Vite URL (normally <http://localhost:5173>). `npm run dev -- --host 0.0.0.0` also makes it reachable for phone testing on a trusted local network.

```sh
npm run check       # lint, formatting, tests, production build
npm run preview     # serve the production build locally
```

No account, backend, or runtime secrets are needed by the browser app. Draw to redirect the stream; Rub a gap to split it. Challenge starts with 4,800 grains and targets 1,800 left / 3,000 right. You can draw before Begin and pause emission at any time. Sound starts muted. D/R select tools and Space stops/resumes pouring.

```sh
npm run test:physics    # reproducible three-width flow measurements
npx playwright install chromium
npm run test:browser    # mouse/touch gameplay, full challenge, layout and recovery
```

With `npm run dev` running, `npm run playtest` runs a real-time browser player and records gameplay and stress evidence under `artifacts/`. It takes about 75 seconds. See [the report](docs/playtest.md) for the tested browser and hardware limits.

## Deploy

Deploy directly from the working environment with the configured Cloudflare token:

```sh
npm run deploy                           # production
npm run deploy:branch -- branch-1         # branch-1.dust-offering.sirsean.me
npm run deploy:branch:delete -- branch-1  # remove the preview
```

GitHub Actions runs code checks. Automated deployments are prepared but deferred by the owner; deployment steps skip with a notice while the Actions secret is absent. Branch deletion does not remove a manually deployed preview until the cleanup command is run. See [deployment instructions](docs/deployment.md) for credentials, commands, and hostname mapping.

## Continue development

Follow [AGENTS.md](AGENTS.md). Keep the [full plan](docs/prototype-plan.md), measured physics gate, challenge version, and grain-accounting invariants intact. The next step is a human gameplay test on real phones, especially Rub sensitivity and large-pile responsiveness.
