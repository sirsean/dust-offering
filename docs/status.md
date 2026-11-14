# Project status

## Foundation — 2026-11-14

Repository and deployment scaffold prepared. The source prototype plan has been read and preserved in `prototype-plan.md`. Gameplay implementation has not begun.

Included: Vite/vanilla JavaScript entry, holding screen, starting configuration, lint/format/build commands, Node tests for deployment targeting and starting invariants, Wrangler static assets, direct production/branch deployment and preview cleanup commands, prepared automation workflows, and repository instructions.

Verified:

- `npm run check`: ESLint, formatting, five Node tests, and production build pass.
- [Initial GitHub CI run](https://github.com/sirsean/dust-offering/actions/runs/43635999438) passed on the pushed scaffold. Both deployment steps skipped as intended while automation is deferred.
- Production deployed with Wrangler to `https://dust-offering.sirsean.me` (Worker version `01d32658-4bf1-4fd2-a256-b1bf24054608`). HTTPS returns 200 and the HTML, JavaScript, CSS, and favicon exactly match the local build. Unknown paths return 404.
- A separate `dust-offering-setup-check` Worker served `https://setup-check.dust-offering.sirsean.me` over HTTPS with the same build. Cloudflare provisioned its exact nested hostname and certificate. The temporary Worker was deleted after verification.
- Headless Chromium checked the holding screen at 360 × 640 and 1440 × 900, with no JavaScript errors or page overflow. This was a desktop browser viewport check, not a touch-hardware test.

## GitHub repository access

The owner created the public [sirsean/dust-offering](https://github.com/sirsean/dust-offering) repository and granted the ChatGPT GitHub app access. The scaffold was successfully pushed to `main`; the local checkout at `/workspace/dust-offering` tracks `origin/main`. The repository access blocker is resolved.

GitHub Actions runs lint, formatting, tests, and the production build. The owner has explicitly deferred automated GitHub deployments in favor of direct Wrangler deployment from this environment. Leave the Actions deployment secret unconfigured until requested. Prepared deployment and cleanup steps skip with a notice when that secret is absent.

Production and branch deployments through Wrangler are verified. Run `npm run deploy` for production, `npm run deploy:branch -- branch-name` for a preview, and `npm run deploy:branch:delete -- branch-name` to clean it up. Deleting a Git branch alone does not clean up its preview while automation is deferred. The foundation is ready for prototype implementation.

## Next implementation pass

1. Create the DOM-independent scene and simulation state, seeded source, and fixed-step browser loop.
2. Render a fixed logical 160 × 200 playfield with source, two bowls, spill gap, and Reset. Show that untouched dust goes to the center spill and that the layout fits a narrow phone.
3. Add Draw/Rub, collision geometry, contacts, accumulation, and Stop/Resume. Build and measure the reproducible physics test scene.
4. Pass the ramp, support-removal, and three-width split checks. Record configuration, seeds, and measurements before scoring or visual polish.

## Deferred validation

No physics, gameplay, phone, touch-hardware, or performance claims yet. Tests of starting configuration are guardrails for future code and do not establish the physics gate. The challenge, share action, saved best, and optional audio remain unimplemented.
