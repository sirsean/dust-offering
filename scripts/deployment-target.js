import { createHash } from 'node:crypto';

const project = 'dust-offering';
export const productionHostname = `${project}.sirsean.me`;

// Preserve simple branch names verbatim; hash transformed names to avoid common
// collisions such as feature/ramp vs feature-ramp. Keep Worker names <= 63 chars.
export function branchSlug(branch) {
  if (typeof branch !== 'string' || !branch.trim()) {
    throw new Error('A nonempty branch name is required.');
  }
  if (branch === 'main' || branch === 'HEAD') {
    throw new Error(
      'Use --production for main; previews require a named branch.',
    );
  }
  if (/^[a-z0-9](?:[a-z0-9-]{0,46}[a-z0-9])?$/.test(branch)) {
    return branch;
  }
  const readable =
    branch
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 37)
      .replace(/-+$/g, '') || 'branch';
  const hash = createHash('sha256').update(branch).digest('hex').slice(0, 10);
  return `${readable}-${hash}`;
}

export function targetForBranch(branch) {
  const slug = branchSlug(branch);
  return {
    slug,
    name: `${project}-${slug}`,
    hostname: `${slug}.${productionHostname}`,
  };
}
