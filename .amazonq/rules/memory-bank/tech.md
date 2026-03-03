# Technology Stack

## Programming Languages

### JavaScript (ES6+)
- **Version**: ES2015+ with module syntax
- **Usage**: Primary language for all application code
- **Module System**: ES Modules (`import`/`export`)
- **File Extensions**: `.js`, `.jsx`, `.cjs`

### JSX
- **Version**: React 19 JSX transform
- **Usage**: React component markup
- **Transform**: Automatic via Vite + @vitejs/plugin-react

### CSS
- **Version**: CSS3 with custom properties
- **Usage**: Styling via Tailwind utilities and custom CSS
- **Preprocessor**: PostCSS with Tailwind and Autoprefixer

## Core Framework & Libraries

### React
- **Version**: 19.2.0
- **Purpose**: UI library for component-based architecture
- **Key Features**: Hooks, Context API, Functional components
- **DOM Library**: react-dom 19.2.0

### React Router
- **Version**: 7.13.0
- **Purpose**: Client-side routing and navigation
- **Features**: BrowserRouter, nested routes, route parameters

### Lucide React
- **Version**: 0.563.0
- **Purpose**: Professional icon system
- **Usage**: 40+ icons throughout the application
- **Icons Used**: ShoppingCart, Menu, X, Star, Package, Truck, Shield, etc.

## Styling & UI

### Tailwind CSS
- **Version**: 4.1.18
- **Purpose**: Utility-first CSS framework
- **Configuration**: Custom color palette via CSS variables
- **Theme Extensions**: Custom animations, z-index, font families
- **Content Paths**: `./index.html`, `./src/**/*.{js,ts,jsx,tsx}`

### PostCSS
- **Version**: 8.5.6
- **Purpose**: CSS processing pipeline
- **Plugins**: 
  - @tailwindcss/postcss 4.1.18
  - autoprefixer 10.4.23

### Custom CSS
- **CSS Variables**: Theme colors (--color-primary-*, --color-accent-*)
- **Animations**: fadeIn, slideUp, slideDown keyframes
- **Component Styles**: Scoped CSS for schematics and complex components

## Build Tools & Development

### Vite
- **Version**: 7.2.4
- **Purpose**: Build tool and development server
- **Features**: Fast HMR, optimized builds, plugin system
- **Configuration**: Base path `/drywall-toolbox/` for GitHub Pages
- **Plugin**: @vitejs/plugin-react 5.1.1

### ESLint
- **Version**: 9.39.1
- **Purpose**: Code quality and consistency
- **Config**: @eslint/js 9.39.1
- **Plugins**:
  - eslint-plugin-react-hooks 7.0.1
  - eslint-plugin-react-refresh 0.4.24
- **Globals**: globals 16.5.0

## Backend & Real-Time

### Express.js
- **Version**: 4.18.2
- **Purpose**: Backend server for reviews system
- **Location**: `server/index.js`
- **Features**: REST API, static file serving

### Socket.io
- **Version**: 4.8.1 (server and client)
- **Purpose**: Real-time bidirectional communication
- **Usage**: Live review updates, inventory notifications
- **Client**: socket.io-client 4.8.1

### CORS
- **Version**: 2.8.5
- **Purpose**: Cross-origin resource sharing
- **Usage**: Enable API access from frontend

## Security & Sanitization

### DOMPurify
- **Version**: 3.0.6
- **Purpose**: XSS protection for user-generated content
- **Usage**: Sanitize review text and HTML inputs

## External Integrations

### Veeqo API
- **Purpose**: Inventory management and order fulfillment
- **Implementation**: `src/services/veeqo.js`
- **Features**: Product sync, stock levels, order management
- **Auth**: OAuth 2.0 flow

### WooCommerce REST API
- **Purpose**: E-commerce backend integration
- **Implementation**: `src/services/woocommerce.js`
- **Features**: Product catalog sync, order processing
- **Auth**: API key authentication

## Data Formats

### JSON
- **Usage**: Configuration files, data storage, API responses
- **Files**: package.json, reviews_store.json, corrected-positions.json

### CSV
- **Usage**: Product catalog imports
- **Files**: products_catalog.csv, als_taping_tools_catalog.csv, tswfast_all_products.csv
- **Processing**: Custom Node.js scripts in `scripts/` directory

### SVG
- **Usage**: Logo and vector graphics
- **Files**: logo.svg, react.svg

## Development Commands

### Primary Commands
```bash
# Start development server with hot module replacement
npm run dev

# Build optimized production bundle
npm run build

# Preview production build locally
npm run preview

# Run ESLint code quality checks
npm run lint

# Start reviews backend server
npm run reviews-server
```

### Development Server
- **Command**: `npm run dev`
- **Port**: Default Vite port (usually 5173)
- **Features**: HMR, fast refresh, instant updates

### Production Build
- **Command**: `npm run build`
- **Output**: `dist/` directory
- **Optimization**: Minification, tree-shaking, code splitting
- **Assets**: Hashed filenames for cache busting

### Preview Build
- **Command**: `npm run preview`
- **Purpose**: Test production build locally before deployment
- **Server**: Vite preview server

### Linting
- **Command**: `npm run lint`
- **Target**: `src/` directory
- **Purpose**: Enforce code quality standards

### Backend Server
- **Command**: `npm run reviews-server`
- **File**: `server/index.js`
- **Purpose**: Run Express + Socket.io server for reviews

## Deployment

### GitHub Pages
- **Platform**: GitHub Pages static hosting
- **URL**: https://elliotttmiller.github.io/drywall-toolbox/
- **Workflow**: `.github/workflows/deploy.yml`
- **Trigger**: Push to `main` branch
- **Process**: Build → Deploy to `gh-pages` branch

### Build Configuration
- **Base Path**: `/drywall-toolbox/` (configured in vite.config.js)
- **SPA Routing**: 404.html redirects to index.html
- **Jekyll**: Disabled via .nojekyll file
- **Assets**: Served from public/ directory

## Type Checking

### TypeScript Types
- **@types/react**: 19.2.5
- **@types/react-dom**: 19.2.3
- **Purpose**: IDE intellisense and type hints
- **Note**: Project uses JavaScript, types for editor support only

## Node.js Environment

### Requirements
- **Node.js**: 16+ recommended
- **Package Manager**: npm (lockfile: package-lock.json)
- **Module Type**: ES Modules (type: "module" in package.json)

### Environment Variables
- **File**: .env.example (template)
- **Usage**: API keys, configuration secrets
- **Loading**: Vite automatic .env loading

## Browser Support

### Target Browsers
- Modern browsers with ES6+ support
- Chrome, Firefox, Safari, Edge (latest versions)
- Mobile browsers (iOS Safari, Chrome Mobile)

### Polyfills
- Not required (modern browser target)
- Vite handles necessary transforms

## Performance Optimization

### Build Output
- **JavaScript**: ~467 KB (~136 KB gzipped)
- **CSS**: ~60 KB (~11 KB gzipped)
- **Code Splitting**: Route-based lazy loading
- **Tree Shaking**: Unused code elimination

### Runtime Optimization
- **React 19**: Automatic batching, concurrent features
- **Vite HMR**: Fast development iteration
- **Image Optimization**: Proper sizing and formats
- **CSS Purging**: Tailwind removes unused utilities
