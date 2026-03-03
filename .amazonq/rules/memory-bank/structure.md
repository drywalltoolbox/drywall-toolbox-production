# Project Structure

## Directory Organization

```
drywall-toolbox/
├── .amazonq/rules/memory-bank/    # AI assistant memory and documentation
├── .github/workflows/             # GitHub Actions CI/CD pipelines
├── css/                           # Legacy CSS styles
├── docs/                          # Project documentation
├── js/                            # Legacy JavaScript
├── public/                        # Static assets and data files
├── schematics/                    # Product schematic diagrams and tools
├── scripts/                       # Data processing and utility scripts
├── server/                        # Express backend for reviews
├── src/                           # React application source code
└── [config files]                 # Build and tooling configuration
```

## Core Application Structure (src/)

### Components (`src/components/`)
Reusable UI components used across multiple pages:

- **CartSidebar.jsx** - Slide-out shopping cart panel with item management
- **Footer.jsx** - Site footer with links, contact info, and branding
- **Header.jsx** - Responsive navigation bar with mobile menu
- **ProductDetail.jsx** - Comprehensive product detail view
- **ProductDetailClean.jsx** - Simplified product detail variant
- **ProductImageGallery.jsx** - Image carousel with zoom and thumbnails
- **Reviews.jsx** - Customer review display and submission system
- **SchematicDiagrams.jsx** - Interactive technical diagrams with hotspots
- **SchematicFilterBar.jsx** - Filter controls for schematic browsing
- **Toast.jsx** - Notification toast component for user feedback

### Pages (`src/pages/`)
Top-level route components:

- **Home.jsx** - Landing page with hero, categories, and features
- **Products.jsx** - Product catalog with filtering and sorting
- **Product.jsx** - Individual product detail page
- **Parts.jsx** - Parts catalog with schematic integration
- **Cart.jsx** - Full shopping cart page
- **Checkout.jsx** - Order checkout and payment
- **About.jsx** - Company information and mission
- **Contact.jsx** - Contact form and business details
- **VeeqoSettings.jsx** - Veeqo integration configuration
- **VeeqoCallback.jsx** - OAuth callback handler for Veeqo
- **WooCommerceSettings.jsx** - WooCommerce integration settings

### Context (`src/context/`)
React Context providers for global state management:

- **CartContext.jsx** - Shopping cart state and operations (add, remove, update quantity)
- **VeeqoContext.jsx** - Veeqo API integration and inventory sync
- **WooCommerceContext.jsx** - WooCommerce API integration and product sync

### Services (`src/services/`)
API integration layers:

- **veeqo.js** - Veeqo API client for inventory management
- **woocommerce.js** - WooCommerce REST API client

### Data (`src/data/`)
Static data and product catalog:

- **products.js** - Product catalog with pricing, specs, and metadata

### Styles (`src/styles/`)
Component-specific CSS modules:

- **machined-design.css** - Industrial/machined aesthetic styles
- **mobile-schematic.css** - Mobile-optimized schematic viewer
- **schematic-filter-bar.css** - Filter bar styling

## Supporting Infrastructure

### Public Assets (`public/`)
- **Product Images**: PNG files for product schematics (e.g., 15TT_SCH-1.png)
- **CSV Catalogs**: Product data imports (products_catalog.csv, als_taping_tools_catalog.csv)
- **404.html**: SPA routing fallback for GitHub Pages
- **.nojekyll**: Ensures proper asset loading on GitHub Pages
- **logo.svg**: Brand logo asset

### Schematics System (`schematics/`)
Interactive product diagram system:

- **brands/**: Organized by manufacturer (3M, TapeTech, etc.)
- **scripts/**: Processing tools for schematic generation
  - `calculate-hotspots.js` - Generates clickable regions from coordinates
  - `process-schematic.cjs` - Converts raw schematics to web format
  - `verify-positions.cjs` - Validates hotspot positioning
  - `fix-coordinates.cjs` - Corrects coordinate mapping issues
- **hotspot-mapper.html**: Visual tool for defining clickable regions
- **hotspot-test.html**: Testing interface for schematic interactions

### Data Processing Scripts (`scripts/`)
Utility scripts for catalog management:

- **Catalog Import**: `import-als-catalog.js`, `import-als-catalog.cjs`
- **Price Management**: `merge-prices.js`, `filter-pricing-data.cjs`, `migrate-prices-from-updated.js`
- **Data Cleaning**: `filter-zero-prices.js`, `remove-brands.cjs`, `strip-columns.js`
- **Cross-Reference**: `crossref_images.js`, `crossref_normalize_and_match.js`
- **Analysis**: `analyze-empty-output.cjs`, `debug-map-building.cjs`, `inspect_products.cjs`

### Backend Server (`server/`)
Express.js server for real-time features:

- **index.js**: Express + Socket.io server for reviews and live updates
- **reviews_store.json**: Persistent storage for customer reviews

### Documentation (`docs/`)
Comprehensive project documentation:

- **IMPLEMENTATION.md**: Overall implementation guide
- **ECOMMERCE_INTEGRATION.md**: E-commerce platform integration
- **SCHEMATIC_IMPLEMENTATION.md**: Interactive diagram system
- **HUD_NAVIGATION_SYSTEM.md**: Navigation UI patterns
- **MOBILE_SCHEMATIC_IMPROVEMENTS.md**: Mobile optimization guide
- **QUICK_REFERENCE.md**: Developer quick reference

## Architectural Patterns

### Component Architecture
- **Functional Components**: All React components use function syntax with hooks
- **Context API**: Global state managed via React Context (cart, integrations)
- **Component Composition**: Reusable components composed into page layouts
- **Props Drilling Avoidance**: Context used for deeply nested state needs

### Routing Architecture
- **React Router v7**: Client-side routing with BrowserRouter
- **Route-Based Code Splitting**: Pages loaded on-demand
- **Nested Routes**: Product detail routes nested under catalog
- **404 Handling**: Fallback route for invalid paths

### State Management
- **Local State**: useState for component-specific state
- **Global State**: Context API for cart and integration state
- **Derived State**: Computed values from existing state (totals, counts)
- **Side Effects**: useEffect for data fetching and subscriptions

### Data Flow
1. **Product Data**: Static import from products.js → Context → Components
2. **Cart Operations**: User action → CartContext → LocalStorage → UI update
3. **API Integration**: Service layer → Context → Components
4. **Real-Time Updates**: Socket.io → Context → Component re-render

### Styling Strategy
- **Tailwind CSS**: Utility-first styling for rapid development
- **CSS Variables**: Custom properties for theme colors (--color-primary-*)
- **Component CSS**: Scoped styles for complex components (schematics)
- **Responsive Design**: Mobile-first with Tailwind breakpoints

### Build Architecture
- **Vite**: Fast development server and optimized production builds
- **ESLint**: Code quality and consistency enforcement
- **PostCSS**: CSS processing with Tailwind and Autoprefixer
- **GitHub Actions**: Automated deployment to GitHub Pages

## Key Relationships

### Component Dependencies
- Pages → Components (composition)
- Components → Context (state access)
- Context → Services (API calls)
- Services → External APIs (Veeqo, WooCommerce)

### Data Dependencies
- Products.js → Product pages (catalog data)
- CSV files → Import scripts → Products.js (data pipeline)
- Schematics → SchematicDiagrams component (interactive diagrams)
- Reviews store → Reviews component (customer feedback)

### Build Dependencies
- Vite → React plugin → JSX transformation
- Tailwind → PostCSS → Optimized CSS
- ESLint → Code validation → Build quality
- GitHub Actions → Vite build → GitHub Pages deployment
