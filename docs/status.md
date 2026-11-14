# Project status

## Foundation — 2026-11-14

Repository and deployment scaffold prepared. The source prototype plan has been read and preserved in `prototype-plan.md`. Gameplay implementation has not begun.

Included: Vite/vanilla JavaScript entry, holding screen, starting configuration, lint/format/build commands, Node tests for deployment targeting and starting invariants, Wrangler static assets, automated production/branch deployments, preview cleanup, and repository instructions.

Verified:

- `npm run check`: ESLint, formatting, five Node tests, and production build pass.
- Production deployed with Wrangler to `https://dust-offering.sirsean.me` (Worker version `01d32658-4bf1-4fd2-a256-b1bf24054608`). HTTPS returns 200 and the HTML, JavaScript, CSS, and favicon exactly match the local build. Unknown paths return 404.
- A separate `dust-offering-setup-check` Worker served `https://setup-check.dust-offering.sirsean.me` over HTTPS with the same build. Cloudflare provisioned its exact nested hostname and certificate. The temporary Worker was deleted after verification.
- Headless Chromium checked the holding screen at 360 × 640 and 1440 × 900, with no JavaScript errors or page overflow. This was a desktop browser viewport check, not a touch-hardware test.

## GitHub repository access

The owner created the empty public `sirsean/dust-offering` repository. The scaffold is in `/workspace/dust-offering`, on `main`, with its HTTPS origin set to that repository.

Publishing is still blocked by GitHub app access: `git push` and the GitHub plugin's file-write endpoint both return HTTP 403. The connected GitHub app reports no installation for the `sirsean` account. The owner has been asked to grant the ChatGPT GitHub app access to this repository. Once accessible, push the local commits and verify CI.

The connection also cannot manage Actions secrets (the repository public-key endpoint returns HTTP 403). CI is configured to run checks and show an explicit notice if the `CLOUDFLARE_API_TOKEN` secret is absent. Automatic production/preview deployment and cleanup become active when an owner adds that secret. Manual production and branch deployments through Wrangler are already verified and are sufficient to begin implementation. GitHub workflows have not yet run.

## Next implementation pass

1. Create the DOM-independent scene and simulation state, seeded source, and fixed-step browser loop.
2. Render a fixed logical 160 × 200 playfield with source, two bowls, spill gap, and Reset. Show that untouched dust goes to the center spill and that the layout fits a narrow phone.
3. Add Draw/Rub, collision geometry, contacts, accumulation, and Stop/Resume. Build and measure the reproducible physics test scene.
4. Pass the ramp, support-removal, and three-width split checks. Record configuration, seeds, and measurements before scoring or visual polish.

## Deferred validation

No physics, gameplay, phone, touch-hardware, or performance claims yet. Tests of starting configuration are guardrails for future code and do not establish the physics gate. The challenge, share action, saved best, and optional audio remain unimplemented.
