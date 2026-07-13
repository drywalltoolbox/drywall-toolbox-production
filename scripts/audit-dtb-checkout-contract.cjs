#!/usr/bin/env node
/**
 * scripts/audit-dtb-checkout-contract.cjs
 *
 * Static checkout/payment contract audit for Drywall Toolbox.
 * This is intentionally not wired into CI by default; run it before checkout,
 * payment, routing, or deployment changes to verify the headless WooCommerce
 * boundary still matches the production architecture.
 */

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');

function read(relativePath) {
  const absolutePath = path.join(ROOT, relativePath);
  try {
    return fs.readFileSync(absolutePath, 'utf8');
  } catch (error) {
    throw new Error(`Missing required file: ${relativePath} (${error.message})`);
  }
}

function walk(relativeDir, files = []) {
  const absoluteDir = path.join(ROOT, relativeDir);
  if (!fs.existsSync(absoluteDir)) return files;
  for (const entry of fs.readdirSync(absoluteDir, { withFileTypes: true })) {
    const relativePath = path.join(relativeDir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', 'dist', 'build', '.git'].includes(entry.name)) continue;
      walk(relativePath, files);
    } else if (/\.(?:js|jsx|ts|tsx|php|cjs|mjs)$/.test(entry.name)) {
      files.push(relativePath.replace(/\\/g, '/'));
    }
  }
  return files;
}

const failures = [];
const warnings = [];

function assertContains(relativePath, pattern, description) {
  const content = read(relativePath);
  const ok = pattern instanceof RegExp ? pattern.test(content) : content.includes(pattern);
  if (!ok) failures.push(`${relativePath}: missing ${description}`);
}

function assertNotContains(relativePath, pattern, description) {
  const content = read(relativePath);
  const ok = pattern instanceof RegExp ? pattern.test(content) : content.includes(pattern);
  if (ok) failures.push(`${relativePath}: forbidden ${description}`);
}

function assertFileExists(relativePath, description) {
  if (!fs.existsSync(path.join(ROOT, relativePath))) failures.push(`missing ${description}: ${relativePath}`);
}

// Frontend checkout/cart ownership.
assertContains('frontend/src/api/cart.js', 'Store API cart operations only', 'cart ownership header');
assertContains('frontend/src/api/cart.js', 'Cart-Token', 'Woo Store API Cart-Token handling');
assertContains('frontend/src/api/checkout.js', "import { getCartToken } from './cart.js';", 'Cart-Token handoff from cart to DTB checkout API');
assertContains('frontend/src/api/checkout.js', '/wp-json/dtb/v1/checkout/', 'DTB checkout namespace');
assertContains('frontend/src/utils/paymentUrl.js', /checkout\/order-pay/i, 'root WooCommerce order-pay URL normalization');

// Client fallback safety. Mutating checkout requests must not be replayed on
// ambiguous 5xx/network failures because Woo/DTB may already have performed a
// side effect.
assertContains('frontend/src/api/client.js', 'IDEMPOTENT_HTTP_METHODS', 'idempotent REST fallback guard');
assertContains('frontend/src/api/client.js', 'canRetryWpJsonCandidate', 'method-aware REST fallback policy');
assertContains('frontend/src/api/client.js', 'never retry 5xx', 'non-idempotent retry documentation');

// Payment runtime must stay in WordPress/WooCommerce, not React.
assertFileExists('drywalltoolbox/wp/wp-content/mu-plugins/dtb-platform/Templates/WooNativeOrderPayRuntime.php', 'native Woo order-pay runtime template');
assertFileExists('drywalltoolbox/wp/wp-content/mu-plugins/zzzz-dtb-payment-runtime-native-template-toggle.php', 'native order-pay template toggle');
assertFileExists('drywalltoolbox/wp/wp-content/mu-plugins/zzzz-dtb-order-pay-official-conversion-polish.php', 'order-pay polish shim');
assertContains('drywalltoolbox/wp/wp-content/mu-plugins/dtb-platform/Templates/WooNativeOrderPayRuntime.php', "wc_get_template(\n\t\t\t\t'checkout/form-pay.php'", 'WooCommerce official form-pay renderer');
assertContains('drywalltoolbox/wp/wp-content/mu-plugins/dtb-platform/Templates/WooNativeOrderPayRuntime.php', 'Gateway fields, wallet buttons, nonces', 'gateway-owned payment contract');

// Browser code must never create storefront orders through raw Woo/admin routes.
const frontendFiles = walk('frontend/src');
const forbiddenFrontendPatterns = [
  { pattern: /\/wc\/store\/v1\/checkout/i, label: 'direct Store API checkout order creation' },
  { pattern: /\/wc\/v[123]\/orders/i, label: 'direct WooCommerce admin REST order creation' },
  { pattern: /\/drywall\/v1\/orders/i, label: 'retired drywall order creation endpoint' },
  { pattern: /consumer_secret|consumer_key|application password/i, label: 'browser-visible WooCommerce credentials' },
];

for (const relativePath of frontendFiles) {
  const content = read(relativePath);
  for (const { pattern, label } of forbiddenFrontendPatterns) {
    if (pattern.test(content)) failures.push(`${relativePath}: forbidden ${label}`);
  }
}

// Deployment/workflow guard: the script should remain opt-in unless the missing
// script problem is intentionally solved in CI.
const workflowFiles = walk('.github/workflows');
for (const relativePath of workflowFiles) {
  const content = read(relativePath);
  if (/smoke-dtb-checkout-shipping\.cjs/.test(content)) {
    failures.push(`${relativePath}: references removed smoke-dtb-checkout-shipping.cjs`);
  }
}

if (!workflowFiles.length) warnings.push('No GitHub workflow files found to audit.');

if (warnings.length) {
  console.warn('Checkout contract audit warnings:');
  for (const warning of warnings) console.warn(`- ${warning}`);
}

if (failures.length) {
  console.error('Checkout contract audit failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Checkout contract audit passed.');
