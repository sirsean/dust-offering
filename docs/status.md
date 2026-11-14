# Project status

## Foundation — 2026-11-14

Repository and deployment scaffold prepared. The source prototype plan has been read and preserved in `prototype-plan.md`. Gameplay implementation has not begun.

Included: Vite/vanilla JavaScript entry, holding screen, starting configuration, lint/format/build commands, Node tests for deployment targeting and starting invariants, Wrangler static assets, automated production/branch deployments, preview cleanup, and repository instructions.

Verified:

- `npm run check`: ESLint, formatting, five Node tests, and production build pass.
- Production deployed with Wrangler to `https://dust-offering.sirsean.me` (Worker version `01d32658-4bf1-4fd2-a256-b1bf24054608`). HTTPS returns 200 and the HTML, JavaScript, CSS, and favicon exactly match the local build. Unknown paths return 404.
- A separate `dust-offering-setup-check` Worker served `https://setup-check.dust-offering.sirsean.me` over HTTPS with the same build. Cloudflare provisioned its exact nested hostname and certificate. The temporary Worker was deleted after verification.
- Headless Chromium checked the holding screen at 360 × 640 and 1440 × 900, with no JavaScript errors or page overflow. This was a desktop browser viewport check, not a touch-hardware test.

## GitHub provisioning blocker

The scaffold is in `/workspace/dust-offering`, with `main` as the initial branch. The connected GitHub integration cannot create repositories: GraphQL `createRepository` returned a permissions error and REST `POST /user/repos` returned HTTP 403, “Resource not accessible by integration.” No browser-control connection is available as a fallback.

The owner has been asked to create the empty public `sirsean/dust-offering` repository. Once it exists and is accessible, push this checkout, configure the `CLOUDFLARE_API_TOKEN` Actions secret through the authorized secret API if permitted, and verify the main/branch/cleanup workflows. Workflow files are prepared, but automated GitHub deployment has not yet been exercised. Manual production and branch deployment through Wrangler work.

## Next implementation pass

1. Create the DOM-independent scene and simulation state, seeded source, and fixed-step browser loop.
2. Render a fixed logical 160 × 200 playfield with source, two bowls, spill gap, and Reset. Show that untouched dust goes to the center spill and that the layout fits a narrow phone.
3. Add Draw/Rub, collision geometry, contacts, accumulation, and Stop/Resume. Build and measure the reproducible physics test scene.
4. Pass the ramp, support-removal, and three-width split checks. Record configuration, seeds, and measurements before scoring or visual polish.

## Deferred validation

No physics, gameplay, phone, touch-hardware, or performance claims yet. Tests of starting configuration are guardrails for future code and do not establish the physics gate. The challenge, share action, saved best, and optional audio remain unimplemented.
