# Frontend Component Library

This folder now has a stricter split:

- `components/ui/`
  Presentation primitives and reusable design-system building blocks.
- `components/shell/`
  App chrome, top-level navigation, overlays tied to the shell.
- `components/catalog/`
  Product listing controls, grid loading states, and merchandising sections.
- `components/product/`
  Product detail modal flow, media, specifications, and reviews.
- `components/schematics/`
  Schematic browsing and selection flow.
- `components/account/`
  Account-layout wrappers used by authenticated account pages.
- `components/routing/`
  Route guards and transition wrappers.
- `components/shared/`
  Cross-feature helpers that do not belong to a single domain.
- `components/errors/`
  Error boundaries and crash containment components.

## Current UI primitives

Use these first before adding a new standalone component:

- `ui/Button.jsx`
- `ui/Dropdown.jsx`
- `ui/FeatureSection.jsx`
- `ui/HeroSection.jsx`
- `ui/NavbarTabs.jsx`
- `ui/PricingTable.jsx`
- `ui/ProductShoppingCard.jsx`
- `ui/Toast.jsx`
- `ui/TrustedBrands.jsx`

## Domain components that should stay outside `ui/`

These are feature-specific or data-aware and should remain outside `ui/`:

- Shell: `shell/Header.jsx`, `shell/Footer.jsx`, `shell/CartSidebar.jsx`, `shell/MobileSearch.jsx`, `shell/NotificationsBell.jsx`, `shell/ShippingTicker.jsx`
- Product detail flow: `product/ProductDetail.jsx`, `product/ProductModal.jsx`, `product/ProductImageGallery.jsx`, `product/ProductCardImage.jsx`, `product/Reviews.jsx`, `product/TechnicalSpecifications.jsx`
- Catalog helpers: `catalog/FilterPanel.jsx`, `catalog/SearchBar.jsx`, `catalog/Pagination.jsx`, `catalog/ProductShoppingCardSkeleton.jsx`, `catalog/TrendingProducts.jsx`
- Schematics flow: `schematics/BrandSelector.jsx`, `schematics/ToolSelector.jsx`
- Account and routing helpers: `account/AccountLayout.jsx`, `routing/PageTransition.jsx`, `routing/ProtectedRoute.jsx`
- Shared utilities: `shared/BackButton.jsx`, `shared/LoadingSpinner.jsx`, `shared/SEOHead.jsx`
- Error handling: `errors/ErrorBoundary.jsx`

## Removed legacy duplicates

These legacy components were removed because active pages now use the `ui/` replacements directly:

- `ProductCard.jsx` → replaced by `ui/ProductShoppingCard.jsx`
- `Toast.jsx` → replaced by `ui/Toast.jsx`
- `SortDropdown.jsx` → replaced by `ui/Dropdown.jsx`

These unused legacy components were also removed because they had no active importers:

- `ApiErrorBoundary.jsx`
- `SchematicDiagrams.jsx`
- `SchematicFilterBar.jsx`
- `VariantChips.jsx`

## Safe refactor rules

- If a component is mostly styling and accepts generic props, it belongs in `components/ui/`.
- If a component owns domain logic, API orchestration, route behavior, or feature-specific state, keep it in `components/`.
- Do not add new imports from deleted legacy files.
- Before deleting a component, confirm it has no imports anywhere in `frontend/src`.
