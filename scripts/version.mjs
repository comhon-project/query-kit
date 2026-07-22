import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const type = process.argv[2];

if (!['patch', 'minor', 'major'].includes(type)) {
  console.error('Usage: node scripts/version.mjs <patch|minor|major>');
  process.exit(1);
}

if (execSync('git status --porcelain').toString().trim()) {
  console.error('Working tree not clean. Commit or stash your changes first.');
  process.exit(1);
}

const readVersion = (pkg) => JSON.parse(readFileSync(`packages/${pkg}/package.json`, 'utf8')).version;

if (readVersion('vue') !== readVersion('themes')) {
  console.error(`Package versions differ: @query-kit/vue is ${readVersion('vue')}, @query-kit/themes is ${readVersion('themes')}. Align them before bumping.`);
  process.exit(1);
}

const run = (cmd) => execSync(cmd, { stdio: 'inherit' });

// `npm version --workspaces` bumps the package.json files but deliberately does
// not create a git commit or tag (npm workspaces behavior, npm/cli#2010), so the
// commit and tag below are done manually. `--no-git-tag-version` is redundant
// while that holds, but future-proofs it: if npm ever adds git tagging to
// workspaces (npm/rfcs#570), the flag keeps npm out of git so it never competes
// with our manual commit/tag.
run(`npm version ${type} --workspaces --no-git-tag-version`);

const tag = `v${readVersion('vue')}`;

run(`git commit -m "chore(release): bump to ${tag}" -- packages/vue/package.json packages/themes/package.json package-lock.json`);
run(`git tag -a "${tag}" -m "${tag}"`);

console.log(`\n✓ ${tag} committed and tagged (not pushed). Push with: git push --follow-tags`);
