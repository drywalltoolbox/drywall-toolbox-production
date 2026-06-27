import './bootstrapRuntimeAssetBase.js'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import './index.css'
import './styles/machined-design.css'
import './styles/tool-selector.css'
import './styles/technical-specifications.css'
import './styles/product-detail-modern.css'
import './styles/reviews.css'
import './styles/storefront-tokens.css'
import './styles/storefront-shell.css'
import './styles/storefront-sections.css'
import './styles/storefront-product-card.css'
import './styles/storefront-drawer.css'
import './styles/storefront-search-product-cards.css'
import './styles/account-hub.css'
import './styles/account-hub-cta.css'
import './styles/checkout-typography.css'
import './styles/mobile-responsive.css'
import './styles/mobile-product-typography.css'
import './styles/mobile-liquid-typography.css'
import './styles/order-item-images.css'
import './styles/product-compatible-schematics-cleanup.css'
import App from './App.jsx'
import './components/catalog/products-selector-overrides.css'
import ErrorBoundary from './components/errors/ErrorBoundary.jsx'
import { joinRuntimeAssetUrl } from './setWebpackPublicPath.js'
import { installSchematicPageLabelRuntime } from './utils/schematicPageLabelRuntime.js'

// ─── Pre-warm product catalog cache ──────────────────────────────────────────
// Product listing pages use the DTB catalog-platform endpoints, so prewarm
// those first. The legacy all-products cache is useful for older schematic
// lookups, but it is intentionally delayed so it cannot compete with the first
// visible product grid render on a cold device.
import { prewarmCatalog } from './services/catalog.js';
import { prewarmCatalogPlatformForCurrentRoute } from './services/catalogPlatformCache.js';

installSchematicPageLabelRuntime();
prewarmCatalogPlatformForCurrentRoute();

if (typeof window !== 'undefined') {
  const pathname = window.location.pathname.replace(/^\/drywall-toolbox(?=\/|$)/, '') || '/';
  const isCatalogRoute = pathname.startsWith('/products') || pathname.startsWith('/parts');
  const isHomePage = pathname === '/';
  // Max delay for background catalog prewarm on non-home, non-catalog routes.
  const CATALOG_PREWARM_TIMEOUT_MS = 5000;

  if (!isCatalogRoute) {
    const scheduleLegacyCatalogPrewarm = () => prewarmCatalog();
    // On the home page TrendingProducts depends on the legacy catalog immediately,
    // so kick it off right away instead of waiting for an idle callback.
    if (isHomePage) {
      scheduleLegacyCatalogPrewarm();
    } else if ('requestIdleCallback' in window) {
      window.requestIdleCallback(scheduleLegacyCatalogPrewarm, { timeout: CATALOG_PREWARM_TIMEOUT_MS });
    } else {
      window.setTimeout(scheduleLegacyCatalogPrewarm, CATALOG_PREWARM_TIMEOUT_MS);
    }
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </HelmetProvider>
  </StrictMode>,
)

// ─── Service Worker policy ───────────────────────────────────────────────────
// Production shared hosting/manual uploads must not keep a stale cached HTML
// shell that references deleted JS/CSS bundle paths. Keep SW disabled unless a
// future deployment intentionally sets REACT_APP_ENV=production-sw.
if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
  const isGithubPagesHost = typeof window !== 'undefined' && /\.github\.io$/i.test(window.location.hostname);
  const enableServiceWorker = process.env.REACT_APP_ENV === 'production-sw' && !isGithubPagesHost;

  window.addEventListener('load', () => {
    if (enableServiceWorker) {
      navigator.serviceWorker.register(joinRuntimeAssetUrl('/service-worker.js')).catch(() => {});
      return;
    }

    navigator.serviceWorker.getRegistrations()
      .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
      .catch(() => {});
  });
}
