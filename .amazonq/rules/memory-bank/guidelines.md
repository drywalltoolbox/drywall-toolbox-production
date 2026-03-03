# Development Guidelines

## Code Quality Standards

### Module System
- **ES Modules**: Use `import`/`export` syntax exclusively (type: "module" in package.json)
- **Named Exports**: Prefer named exports for utilities and hooks
- **Default Exports**: Use default exports for React components and main modules
- **Import Order**: External dependencies → Internal modules → Styles → Assets

Example from main.jsx:
```javascript
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/machined-design.css'
import App from './App.jsx'
```

### File Extensions
- **JavaScript**: `.js` for Node.js scripts, `.jsx` for React components
- **CommonJS**: `.cjs` for Node.js scripts requiring CommonJS (e.g., processing scripts)
- **Consistency**: Always include `.jsx` extension when importing React components

### Code Formatting

#### Indentation and Spacing
- **Indentation**: 2 spaces (no tabs)
- **Line Endings**: CRLF (Windows-style `\r\n`)
- **Trailing Commas**: Use in arrays and objects for cleaner diffs
- **Semicolons**: Optional but consistent within files

#### Naming Conventions
- **Components**: PascalCase (e.g., `ProductDetail`, `CartSidebar`)
- **Files**: Match component name (e.g., `ProductDetail.jsx`)
- **Functions/Variables**: camelCase (e.g., `addToCart`, `getCartTotal`)
- **Constants**: UPPER_SNAKE_CASE for true constants (e.g., `MAX_PRICE`)
- **CSS Classes**: kebab-case for custom classes, Tailwind utilities as-is
- **Context Hooks**: Prefix with `use` (e.g., `useCart`, `useVeeqo`)

#### String Formatting
- **Quotes**: Single quotes for strings, double quotes in JSX attributes
- **Template Literals**: Use for string interpolation and multi-line strings
- **JSX Attributes**: Double quotes consistently

Example from Header.jsx:
```javascript
<img src={Logo} alt="Drywall Toolbox Logo" className="logo-image" />
```

### Documentation Standards

#### Comments
- **Minimal Comments**: Code should be self-documenting through clear naming
- **Utility Comments**: Document complex algorithms or coordinate calculations
- **Configuration Comments**: Explain non-obvious configuration choices
- **TODO Comments**: Avoid in production code

Example from calculate-hotspots.js:
```javascript
// Utility to convert hotspot coordinates from JSON to proper CSS percentages
// The normalized_coords are based on a scale factor (pixel_coords / reference_size)
// where reference_size is 300x150
```

#### JSDoc
- **Not Required**: Project doesn't use JSDoc annotations
- **Type Hints**: TypeScript types installed for IDE support only
- **Inline Clarity**: Prefer clear variable names over documentation

## React Patterns

### Component Structure

#### Functional Components Only
- **No Class Components**: All components use function syntax
- **Hooks**: useState, useEffect, useContext, useCallback, useMemo as needed
- **Component Order**: Imports → Component function → Export

Standard component template:
```javascript
import { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { ShoppingCart } from 'lucide-react';

export default function ComponentName({ prop1, prop2 }) {
  const [state, setState] = useState(initialValue);
  const { contextValue } = useCart();

  useEffect(() => {
    // side effects
  }, [dependencies]);

  const handleAction = () => {
    // event handler
  };

  return (
    <div className="container">
      {/* JSX */}
    </div>
  );
}
```

#### Props and Destructuring
- **Destructure Props**: In function parameters for clarity
- **Default Values**: Use default parameters or logical OR
- **Prop Validation**: Not enforced (no PropTypes)

Example from Header.jsx:
```javascript
export default function Header({ onCartToggle }) {
  // onCartToggle is destructured from props
}
```

### State Management

#### Local State (useState)
- **Component-Specific**: Use for UI state (modals, dropdowns, form inputs)
- **Initialization**: Provide initial value or lazy initializer function
- **Naming**: Pair state with setter (e.g., `[cartOpen, setCartOpen]`)

Example from App.jsx:
```javascript
const [cartOpen, setCartOpen] = useState(false);
const toggleCart = () => setCartOpen(!cartOpen);
```

#### Global State (Context API)
- **Context Creation**: Create context with createContext()
- **Custom Hooks**: Export custom hook for consuming context (e.g., useCart)
- **Error Handling**: Throw error if hook used outside provider
- **Provider Wrapping**: Wrap app in providers at top level

Example from CartContext.jsx:
```javascript
const CartContext = createContext();

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

export function CartProvider({ children }) {
  // state and methods
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
```

#### Derived State
- **Compute Don't Store**: Calculate values from existing state
- **Memoization**: Use useMemo for expensive computations
- **Methods**: Provide methods for common calculations (e.g., getCartTotal)

Example from CartContext.jsx:
```javascript
const getCartTotal = () => {
  return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
};
```

### Side Effects (useEffect)

#### Dependency Arrays
- **Always Specify**: Include all dependencies or empty array
- **ESLint Compliance**: Follow exhaustive-deps rule (with exceptions)
- **Cleanup Functions**: Return cleanup for subscriptions and listeners

Example from Header.jsx:
```javascript
useEffect(() => {
  const mq = window.matchMedia('(min-width: 641px) and (max-width: 1024px)');
  const handler = (e) => setIsTablet(e.matches);
  
  if (mq.addEventListener) {
    mq.addEventListener('change', handler);
  } else {
    mq.addListener(handler); // Safari fallback
  }
  
  return () => {
    if (mq.removeEventListener) {
      mq.removeEventListener('change', handler);
    } else {
      mq.removeListener(handler);
    }
  };
}, []);
```

#### Common Patterns
- **Data Fetching**: Use mounted flag to prevent state updates after unmount
- **LocalStorage Sync**: Persist state changes to localStorage
- **Event Listeners**: Add in useEffect, remove in cleanup
- **Route Changes**: Use useLocation with useEffect for scroll-to-top

Example from Products.jsx:
```javascript
useEffect(() => {
  let mounted = true;
  loadProducts().then(list => {
    if (!mounted) return;
    setProducts(list);
  }).catch(() => {});
  return () => { mounted = false; };
}, []);
```

### Event Handling

#### Event Handler Naming
- **Prefix with handle**: `handleClick`, `handleSubmit`, `handleAddToCart`
- **Toggle Functions**: Use `toggle` prefix (e.g., `toggleCart`, `toggleBrand`)
- **Close Functions**: Use `close` prefix (e.g., `closeModal`, `closeMobileMenu`)

#### Event Handler Patterns
- **Inline Arrow Functions**: For simple callbacks or passing parameters
- **Defined Functions**: For complex logic or reusable handlers
- **Event Propagation**: Use `e.stopPropagation()` to prevent bubbling
- **Default Prevention**: Use `e.preventDefault()` for form submissions

Example from Products.jsx:
```javascript
const handleAddToCart = (product, quantity = 1) => {
  addToCart(product, quantity);
  showToast(`${product.name} added to cart!`, 'cart');
};

// In JSX:
<button
  onClick={(e) => {
    e.stopPropagation();
    handleAddToCart(product, 1);
  }}
>
  Add to Cart
</button>
```

### Routing Patterns

#### React Router v7
- **BrowserRouter**: Use with basename for GitHub Pages deployment
- **Routes Structure**: Flat route definitions in App.jsx
- **Navigation**: Use `navigate()` hook for programmatic navigation
- **Link Components**: Use `<Link>` for declarative navigation
- **Route Parameters**: Access via `useParams()` hook

Example from App.jsx:
```javascript
<Router basename="/drywall-toolbox">
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/products" element={<Products />} />
    <Route path="/product/:partNumber" element={<Product />} />
  </Routes>
</Router>
```

#### URL State Management
- **Query Parameters**: Use URLSearchParams for filter state
- **Sync State to URL**: Update URL when filters change
- **Read from URL**: Initialize state from URL on mount
- **Replace History**: Use `{ replace: true }` to avoid history pollution

Example from Products.jsx:
```javascript
// Read from URL
const params = new URLSearchParams(location.search);
const brandParam = params.get('brand');

// Write to URL
navigate(`/products?brand=${encodeURIComponent(brand)}`, { replace: true });
```

#### Scroll Behavior
- **Scroll to Top**: Implement ScrollToTop component with useLocation
- **Route Changes**: Reset scroll position on navigation
- **Modal Opening**: Prevent body scroll when modal open

Example from App.jsx:
```javascript
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
```

## Styling Conventions

### Tailwind CSS Usage

#### Utility-First Approach
- **Prefer Utilities**: Use Tailwind classes over custom CSS
- **Responsive Design**: Mobile-first with breakpoint prefixes (sm:, md:, lg:)
- **State Variants**: Use hover:, focus:, active: for interactive states
- **Composition**: Combine utilities for complex designs

Example from Products.jsx:
```javascript
<div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group border border-gray-200 hover:border-primary-300 hover:-translate-y-1">
```

#### Custom CSS Variables
- **Theme Colors**: Define in index.css as CSS custom properties
- **Tailwind Integration**: Reference variables in tailwind.config.js
- **Naming**: Use `--color-primary-*` and `--color-accent-*` pattern
- **Centralized Theming**: Change colors globally via CSS variables

Example from tailwind.config.js:
```javascript
colors: {
  primary: {
    500: 'var(--color-primary-500)',
    600: 'var(--color-primary-600)',
    // ...
  }
}
```

#### Component-Specific CSS
- **When to Use**: Complex layouts (schematics, machined design)
- **Location**: `src/styles/` directory with descriptive names
- **Import**: Import in component or main.jsx
- **Scoping**: Use unique class names to avoid conflicts

### Responsive Design

#### Breakpoints
- **Mobile First**: Base styles for mobile, add breakpoints for larger screens
- **Tailwind Breakpoints**: sm (640px), md (768px), lg (1024px), xl (1280px)
- **Custom Media Queries**: Use for specific needs (e.g., tablet detection)

Example from Header.jsx:
```javascript
// Mobile layout
<div className="flex md:hidden items-center justify-between w-full">

// Desktop layout
<div className="hidden md:contents">
```

#### Layout Patterns
- **Flexbox**: Primary layout tool (flex, items-center, justify-between)
- **Grid**: For product cards and multi-column layouts
- **Responsive Grids**: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
- **Spacing**: Consistent gap and padding (gap-4, gap-6, p-4, p-6)

### Animation and Transitions

#### Tailwind Transitions
- **Duration**: Use `transition-all` or `transition-colors` with duration
- **Hover Effects**: Combine with hover: variants
- **Transform**: Use translate, scale for lift effects

Example:
```javascript
className="transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
```

#### Custom Animations
- **Keyframes**: Define in tailwind.config.js
- **Animation Classes**: Use `animate-fade-in`, `animate-slide-up`
- **Timing**: Specify duration and easing in keyframes

Example from tailwind.config.js:
```javascript
animation: {
  'fade-in': 'fadeIn 0.5s ease-in-out',
  'slide-up': 'slideUp 0.5s ease-out',
},
keyframes: {
  fadeIn: {
    '0%': { opacity: '0' },
    '100%': { opacity: '1' },
  },
}
```

## Data Management

### Product Data Loading

#### CSV Import Pattern
- **Async Loading**: Use async function to load products
- **Error Handling**: Catch and handle loading errors gracefully
- **Mounted Check**: Prevent state updates after component unmount
- **Unique Brands**: Derive brand list from loaded products

Example from Products.jsx:
```javascript
useEffect(() => {
  let mounted = true;
  loadProducts().then(list => {
    if (!mounted) return;
    setProducts(list);
    const unique = Array.from(new Set(list.map(p => p.brand).filter(Boolean))).sort();
    setBrands(unique);
  }).catch(() => {});
  return () => { mounted = false; };
}, []);
```

### LocalStorage Persistence

#### Cart Persistence
- **Initialize from Storage**: Use lazy initializer in useState
- **Sync on Change**: Use useEffect to persist changes
- **Error Handling**: Wrap in try-catch for quota exceeded errors
- **Key Naming**: Use descriptive keys (e.g., 'drywall-cart')

Example from CartContext.jsx:
```javascript
const [cartItems, setCartItems] = useState(() => {
  try {
    const savedCart = localStorage.getItem('drywall-cart');
    return savedCart ? JSON.parse(savedCart) : [];
  } catch (error) {
    console.error('Failed to load cart from localStorage:', error);
    return [];
  }
});

useEffect(() => {
  try {
    localStorage.setItem('drywall-cart', JSON.stringify(cartItems));
  } catch (error) {
    console.error('Failed to save cart to localStorage:', error);
  }
}, [cartItems]);
```

### Array Operations

#### Filtering and Mapping
- **Immutable Updates**: Use map, filter, reduce (never mutate state)
- **Chaining**: Chain operations for complex transformations
- **Null Safety**: Use optional chaining and filter(Boolean)

Example from Products.jsx:
```javascript
const filteredProducts = (products || []).filter(product => {
  if (selectedBrands.length > 0 && !selectedBrands.includes(product.brand)) return false;
  if (selectedCategories.length > 0 && !selectedCategories.includes(product.category)) return false;
  if (product.price && (product.price < priceRange[0] || product.price > priceRange[1])) return false;
  return true;
});
```

#### Sorting
- **Copy Before Sort**: Use spread operator to avoid mutation
- **Sort Functions**: Return -1, 0, 1 for comparison
- **Multiple Criteria**: Use switch statement for different sort modes

Example from Products.jsx:
```javascript
const sortedProducts = [...filteredProducts].sort((a, b) => {
  switch (sortBy) {
    case 'price-low':
      return a.price - b.price;
    case 'price-high':
      return b.price - a.price;
    case 'rating':
      return b.rating - a.rating;
    default:
      return 0;
  }
});
```

## ESLint Configuration

### Rules and Exceptions

#### Unused Variables
- **Rule**: Error on unused variables
- **Exception**: Ignore variables starting with uppercase or underscore
- **Pattern**: `varsIgnorePattern: '^[A-Z_]'`

Example from eslint.config.js:
```javascript
rules: {
  'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
}
```

#### React Hooks
- **exhaustive-deps**: Follow dependency array rules
- **Exceptions**: Use eslint-disable-line when intentional
- **react-refresh**: Only export components for fast refresh

Example from CartContext.jsx:
```javascript
// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
  // custom hook export
}
```

### Configuration Structure
- **Flat Config**: Use new ESLint flat config format
- **File Patterns**: Target `**/*.{js,jsx}` files
- **Extends**: Use recommended configs from plugins
- **Global Ignores**: Ignore dist/ directory

## API Integration Patterns

### Service Layer
- **Separation**: Keep API logic in `src/services/` directory
- **Client Functions**: Export functions for specific API operations
- **Error Handling**: Handle errors at service level
- **Authentication**: Manage tokens and credentials in service

### Context Integration
- **Service Wrapper**: Wrap service calls in Context providers
- **State Management**: Store API data in context state
- **Loading States**: Track loading and error states
- **Retry Logic**: Implement retry for failed requests

## Performance Optimization

### Image Loading
- **Lazy Loading**: Use `loading="lazy"` attribute
- **Error Handling**: Provide fallback with onError handler
- **Aspect Ratio**: Use aspect-square for consistent sizing
- **Optimization**: Serve appropriately sized images

Example from Products.jsx:
```javascript
<img
  src={product.image}
  alt={product.name}
  className="object-contain w-full h-full"
  loading="lazy"
  onError={(e) => { 
    e.currentTarget.onerror = null; 
    e.currentTarget.src = '/product-placeholder.jpg'; 
  }}
/>
```

### Component Optimization
- **Avoid Unnecessary Renders**: Use React.memo for expensive components
- **Callback Memoization**: Use useCallback for event handlers passed as props
- **Computed Values**: Use useMemo for expensive calculations
- **Code Splitting**: Route-based splitting via React Router

## Accessibility

### Semantic HTML
- **Proper Elements**: Use button, nav, header, main, footer
- **ARIA Labels**: Add aria-label for icon-only buttons
- **ARIA Roles**: Use role="banner" for header, role="navigation" for nav

Example from Header.jsx:
```javascript
<header className="site-header" role="banner">
  <nav className="nav-links" aria-label="Primary">
    <button aria-label="Toggle cart">
```

### Keyboard Navigation
- **Focus Management**: Ensure all interactive elements are keyboard accessible
- **Escape Key**: Close modals with Escape key
- **Tab Order**: Maintain logical tab order

Example from Products.jsx:
```javascript
useEffect(() => {
  const onKey = (e) => { if (e.key === 'Escape') closeModal(); };
  window.addEventListener('keydown', onKey);
  return () => window.removeEventListener('keydown', onKey);
}, []);
```

## Build and Deployment

### Vite Configuration
- **Base Path**: Set for GitHub Pages deployment
- **Plugins**: Use @vitejs/plugin-react for JSX transform
- **Minimal Config**: Keep configuration simple and focused

Example from vite.config.js:
```javascript
export default defineConfig({
  plugins: [react()],
  base: '/drywall-toolbox/',
})
```

### GitHub Pages Deployment
- **404 Handling**: Include 404.html for SPA routing
- **Jekyll Disable**: Add .nojekyll file
- **GitHub Actions**: Automate build and deploy
- **Base Path**: Match repository name in router and vite config

## Testing and Debugging

### Error Handling
- **Try-Catch**: Wrap localStorage and API calls
- **Console Errors**: Log errors for debugging
- **Graceful Degradation**: Provide fallbacks for failures
- **User Feedback**: Show toast notifications for errors

### Browser Compatibility
- **Modern Browsers**: Target ES6+ supporting browsers
- **Fallbacks**: Provide fallbacks for older APIs (e.g., matchMedia)
- **Testing**: Test on Chrome, Firefox, Safari, Edge

Example from Header.jsx:
```javascript
if (mq.addEventListener) {
  mq.addEventListener('change', handler);
} else {
  // Safari fallback
  mq.addListener(handler);
}
```
