'use strict';

const fs = require('fs');
const path = require('path');

const frontendRoot = path.resolve(__dirname, '..');
const repositoryRoot = path.resolve(frontendRoot, '..');
const cacheRoot = path.resolve(frontendRoot, 'node_modules', '.cache');
const webpackCacheRoot = path.resolve(cacheRoot, 'webpack');
const target = String(process.argv[2] || '').trim().toLowerCase();

function isInside(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative !== '' && !relative.startsWith('..') && !path.isAbsolute(relative);
}

function removeDirectory(parent, candidate) {
  const resolvedParent = path.resolve(parent);
  const resolvedCandidate = path.resolve(candidate);

  if (!isInside(resolvedParent, resolvedCandidate)) {
    throw new Error(`Refusing to remove path outside ${resolvedParent}: ${resolvedCandidate}`);
  }

  if (!fs.existsSync(resolvedCandidate)) return;
  fs.rmSync(resolvedCandidate, { recursive: true, force: true });
  process.stdout.write(`Removed ${path.relative(repositoryRoot, resolvedCandidate)}\n`);
}

function removeWebpackCaches(prefix) {
  if (!fs.existsSync(webpackCacheRoot)) return;

  for (const entry of fs.readdirSync(webpackCacheRoot, { withFileTypes: true })) {
    if (entry.isDirectory() && entry.name.startsWith(prefix)) {
      removeDirectory(webpackCacheRoot, path.resolve(webpackCacheRoot, entry.name));
    }
  }
}

switch (target) {
  case 'production':
    removeDirectory(repositoryRoot, path.resolve(repositoryRoot, 'dist'));
    removeWebpackCaches('production-production-');
    break;
  case 'staging':
    removeDirectory(repositoryRoot, path.resolve(repositoryRoot, 'dist-staging'));
    removeWebpackCaches('production-staging-');
    break;
  case 'cache':
    removeDirectory(cacheRoot, path.resolve(cacheRoot, 'babel-loader'));
    removeDirectory(cacheRoot, webpackCacheRoot);
    break;
  default:
    throw new Error('Expected cleanup target: production, staging, or cache.');
}
