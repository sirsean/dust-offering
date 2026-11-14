import assert from 'node:assert/strict';
import test from 'node:test';
import { branchSlug, targetForBranch } from '../scripts/deployment-target.js';

test('a simple branch gets the requested nested subdomain', () => {
  assert.deepEqual(targetForBranch('branch-1'), {
    slug: 'branch-1',
    name: 'dust-offering-branch-1',
    hostname: 'branch-1.dust-offering.sirsean.me',
  });
});

test('normalization keeps common branch names separate and repeatable', () => {
  const names = [
    'feature/ramp',
    'feature-ramp',
    'Feature/ramp',
    '---',
    'a'.repeat(100),
  ];
  const slugs = names.map(branchSlug);
  assert.equal(new Set(slugs).size, names.length);
  for (let i = 0; i < names.length; i++) {
    assert.equal(branchSlug(names[i]), slugs[i]);
    assert.match(slugs[i], /^[a-z0-9][a-z0-9-]*[a-z0-9]$/);
    assert.ok(targetForBranch(names[i]).name.length <= 63);
  }
  assert.equal(branchSlug('x'), 'x');
});

test('preview deployment and deletion cannot target production or detached HEAD', () => {
  for (const name of ['', '  ', 'main', 'HEAD']) {
    assert.throws(() => targetForBranch(name));
  }
});
