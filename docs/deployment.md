# Deployment

## Resources

- GitHub repository: <https://github.com/sirsean/dust-offering>
- Cloudflare account: `f400e5cfc5e8cd621a3c3f9264a92bc4`
- Cloudflare zone: `sirsean.me` (`f0dc6bab5f525e19bd96a044d23cbfd9`)
- Production Worker: `dust-offering`
- Production custom domain: <https://dust-offering.sirsean.me>

Workers static assets serve `dist/` directly; there is no server handler or database. `wrangler.json` is the production configuration. Asset paths use Vite content hashes; only `/assets/*` gets long immutable caching. Unknown paths return 404, so future challenge URLs should use query parameters unless routing is explicitly changed.

## Automatic deployments

`.github/workflows/ci.yml` runs `npm ci` and `npm run check` on every push and pull request. Once the `CLOUDFLARE_API_TOKEN` repository secret is configured, successful pushes in this repository deploy:

| Ref          | Destination                              |
| ------------ | ---------------------------------------- |
| `main`       | `dust-offering.sirsean.me`               |
| `branch-1`   | `branch-1.dust-offering.sirsean.me`      |
| Other branch | `<branch-slug>.dust-offering.sirsean.me` |

Pull requests run checks only. Public fork pull requests do not receive Cloudflare credentials. Automatic deployment requires the repository's GitHub Actions secret `CLOUDFLARE_API_TOKEN`; no secret goes into the browser build. If that secret is missing, deployment and cleanup steps are skipped with an explicit notice and workflow summary; code checks still run. Account and zone IDs are identifiers, not credentials. Keep write access to branches limited to trusted collaborators, since branch pushes execute workflows with the deployment secret. See `status.md` for provisioning progress.

To enable automatic deployment, an owner can add the tested Cloudflare token as a repository Actions secret at <https://github.com/sirsean/dust-offering/settings/secrets/actions/new>, then rerun the workflow or push a commit. Enter the token in GitHub's secret field, never in chat or source. This setup's GitHub integration currently cannot manage Actions secrets. Manual Wrangler deployments use the environment's existing token and need no GitHub secret.

Each preview has a separate Worker named `dust-offering-<branch-slug>` and an exact Workers Custom Domain. Cloudflare manages its DNS and TLS certificate, including the deeper branch hostname. There is no wildcard Worker, shared preview bundle, or dependency on a wildcard certificate. First visits can wait for DNS/certificate provisioning.

Simple lowercase DNS-safe branch names up to 48 characters are preserved. Names requiring normalization or truncation get a readable prefix plus a ten-character SHA-256 suffix. For example, `feature/ramp` gets its own distinct hostname rather than colliding with `feature-ramp`. Run this to see a branch's exact target:

```sh
node --input-type=module -e "import { targetForBranch } from './scripts/deployment-target.js'; console.log(targetForBranch('feature/ramp'));"
```

`.github/workflows/preview-cleanup.yml` deletes the preview Worker and associated custom domain when its branch is deleted. Deleting `main` is excluded, and deployment targeting rejects `main` or detached `HEAD` as preview targets. Keep previews within Cloudflare account resource limits and delete stale branches. Preview URLs are public and must not contain secrets.

## Local deployment and cleanup

Set `CLOUDFLARE_API_TOKEN` securely in the shell, or use a local Wrangler login. The token needs account Workers Scripts edit and zone read/Workers Routes edit permissions for `sirsean.me`. This account's configured token has been tested through Wrangler. Do not paste credentials into commands, source files, or logs.

In a restricted workspace where the normal home configuration/cache directories are read-only, use writable task directories, for example `npm --cache /tmp/dust-offering-npm-cache ci` and `XDG_CONFIG_HOME=/tmp/dust-offering-xdg npm run deploy`. The supplied Cloudflare environment token is sufficient; an interactive login is unnecessary. These overrides are specific to the execution environment, not required for ordinary local use.

```sh
npm ci
npm run check
npm run deploy
npm run deploy:branch -- branch-1
npm run deploy:branch:delete -- branch-1
```

Omit the branch argument to use the current Git branch. The deploy commands rebuild first. Preview configurations are generated under ignored `.wrangler/deploy/`; they inherit asset and account settings from `wrangler.json` and replace only the Worker name and route. Removing a branch preview never targets the production Worker.

## Verify and recover

Inspect the GitHub Actions run for checks, uploaded asset version, and the domain binding. Request the destination over HTTPS with certificate verification enabled and confirm that it serves the intended revision. A missing hostname immediately after creation can mean provisioning is still pending; inspect Cloudflare Workers Custom Domains before changing DNS manually.

If a deploy fails, the prior deployment remains the version to inspect. Fix the build or deploy configuration and rerun the workflow. To roll back application code, revert the offending commit and push to `main`; the same checked deployment path republishes it. Never delete or overwrite another project's DNS records or Worker to fix this project.
