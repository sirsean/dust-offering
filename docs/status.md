# Project status — sticky traces and multi-touch

Revision 0.3.0 adds the owner's latest feedback to the slow sand-on-stone model. Brushing leaves a visible sage trace that increases stone adhesion. Repeated passes and overlapping fingers add strength, and the coating fades with a 30-second half-life. Each active pointer brushes independently. Brushing still loosens and redistributes existing sand; the slow motion, source rate and persistent bottom piles are preserved.

Current design: [stone-sand-plan.md](stone-sand-plan.md). Architecture and tuning: [architecture.md](architecture.md), [physics-results.md](physics-results.md). Real-time simulated play and screenshots: [playtest.md](playtest.md), `artifacts/stone-*`.

## Behavior and checks

- Traces use the same strength field for visible brightness and actual adhesion. Strength stacks to six; the stone exposure multiplier is `1 + 8 × strength`. Fading affects future capture without dissolving existing deposits.
- Touch, pen and mouse share one action. Each finger has its own captured path and footprint. A partial lift/cancel affects only that finger, with no connecting line between contacts.
- Reset and mode changes clear traces and contacts. Resize preserves the field. Source pause still allows fading and settling; hidden pages and finished challenges freeze simulation time.
- The optional `stone-offering-v2` challenge retains 960 grains and targets 360 / 600, with no countdown or time penalty. Earlier bests remain isolated under their previous identifiers.
- Verification covers 32 numerical/unit tests and 15 browser scenarios across emulated phone and desktop. Three desktop duplicates of touch-only cases are intentionally skipped. Lint, formatting and production build are required before release.
- Real hardware feel still needs the owner's evaluation. The automated player verifies visible response, layering, decay, material release, conservation, challenge completion and retained-material performance.

## Repository and deployment

Public repo: <https://github.com/sirsean/dust-offering>. Production: <https://dust-offering.sirsean.me>. This revision is developed on `sticky-traces`, then integrated into `main`. Preview: <https://sticky-traces.dust-offering.sirsean.me>.

Revision 0.2.0 source is commit `4f31c72`; its reports and screenshots are under `docs/archive/stone-v1/` and `artifacts/archive/stone-v1/`. Original ridge source is commit `bef6b51`, with evidence under the respective `archive/v2/` directories.

Use direct Wrangler deployment. Automated GitHub deployments remain deferred; no deployment secret should be configured until requested. CI runs code/browser checks. `npm run deploy` publishes production, and `npm run deploy:branch -- sticky-traces` publishes the isolated preview. See [deployment.md](deployment.md) for environment-specific writable paths.
