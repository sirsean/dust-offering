# Dust Offering

A portrait browser game set at the Black Pyramid. Draw ridges and rub gaps to divide falling dust between two offering bowls.

**Status:** repository and deployment foundation; gameplay implementation has not started.

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

The current page is a small holding screen used to verify the build and hosting. There is no simulation yet. No account, backend, or runtime secrets are needed by the browser app.

## Deploy

Pushing `main` publishes production after checks pass. Pushing another branch publishes a branch preview under `dust-offering.sirsean.me`. Deleting the branch removes its preview. See [deployment instructions](docs/deployment.md) for credentials, commands, and hostname mapping.

## Build next

Follow [AGENTS.md](AGENTS.md). First build the scene, then Free Pour and its measurable physics checks. Scoring starts only after the split mechanic passes those checks. The [full plan](docs/prototype-plan.md) is preserved in the repository.
