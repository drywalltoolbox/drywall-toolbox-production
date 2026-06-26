import { initializeWebpackPublicPath } from './setWebpackPublicPath.js';

// Must execute before CSS imports, React boot, and route-level lazy imports.
// This keeps async JS/CSS chunks loading from the actual deployed asset root
// instead of the current deep-link URL such as /repairs/packages.
initializeWebpackPublicPath();
