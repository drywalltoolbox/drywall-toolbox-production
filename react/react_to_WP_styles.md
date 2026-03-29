# 🎨 COMPLETE INTEGRATED STYLE.CSS — WordPress + React Design System (FINAL)

This file consolidates your **Industrial Professional WordPress theme** with your **React component design system** including all CSS files. Copy this entire file to replace your existing `/wp-content/themes/drywall-toolbox/style.css`:

```css
/*
Theme Name: Drywall Toolbox Child
Theme URI: https://drywalltoolbox.com
Description: Combined WordPress + React design system — Industrial Professional with Machined Precision aesthetics.
Author: Elliott Miller
Author URI: https://drywalltoolbox.com
Version: 2.2.0
License: GNU General Public License v2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html
Template: twentytwentyfour
Text Domain: drywall-toolbox-child
*/

/* =========================================================
   DESIGN TOKENS — INDUSTRIAL + MACHINED PRECISION
   Centralized color palette used throughout all components
   ========================================================= */
:root {
  /* === BRAND COLORS (Navy/Blue Palette) === */
  --dtb-primary:        #1a1a2e;      /* Deep navy — authority, precision */
  --dtb-secondary:      #16213e;      /* Dark slate — structural depth */
  --dtb-accent:         #e94560;      /* Industrial red — calls to action */
  --dtb-accent-alt:     #f5a623;      /* Amber yellow — warnings/highlights */
  
  /* Machined Design Primary (Blue Branding) */
  --primary-500:        #3b82f6;      /* Bright blue brand */
  --primary-600:        #2563eb;      /* Primary brand blue */
  --primary-700:        #1d4ed8;      /* Darker primary hover */
  --primary-400:        #60a5fa;      /* Lighter accent */
  --primary-100:        #eff6ff;      /* Lightest blue */
  
  /* Surface Colors */
  --dtb-surface:        #0f3460;      /* Mid-blue — card surfaces */
  --surface-base:       #f8fafc;      /* Light gray background */
  --surface-elevated:   #ffffff;      /* White cards */
  --surface-secondary:  #f1f5f9;      /* Gray backgrounds */
  --surface-glass:      rgba(255,255,255,0.92);
  
  /* Text Colors */
  --dtb-text:           #1c1c1c;      /* Near-black body text */
  --text-primary:       #1f2937;      /* Darkest text */
  --text-secondary:     #6b7280;      /* Secondary labels */
  --text-light:         #ffffff;      /* White on dark */
  --text-muted:         rgba(15,23,42,.5);
  --text-tertiary:      var(--text-secondary);
  
  /* Borders & Dividers */
  --machined-border:    rgba(15,23,42,.08);
  --alloy-edge:         #e5e7eb;
  --alloy-deep:         #2563eb;
  --tension-accent:     #2563eb;
  --tension-highlight:  #60a5fa;
  --border-color:       #d1d5db;
  --border-dark:        #374151;
  
  /* === TYPOGRAPHY === */
  --font-heading:       'Oswald', 'Impact', Arial Narrow, sans-serif;
  --font-main:          'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-mono:          'JetBrains Mono', 'Courier New', monospace;
  --font-body:          'Open Sans', 'Helvetica Neue', Arial, sans-serif;
  
  /* Fluid Font Sizing */
  --fs-xs:   0.75rem;   /* 12px */
  --fs-sm:   0.875rem;  /* 14px */
  --fs-base: 1rem;      /* 16px */
  --fs-lg:   1.125rem;  /* 18px */
  --fs-xl:   1.25rem;   /* 20px */
  --fs-2xl:  1.5rem;    /* 24px */
  --fs-3xl:  1.875rem;  /* 30px */
  --fs-4xl:  2.25rem;   /* 36px */
  
  /* === SPACING (Fluid + Fixed) === */
  --space-xs: clamp(0.25rem, .5vw, .5rem);
  --space-sm: clamp(0.5rem, 1vw, 1rem);
  --space-md: clamp(1rem, 2vw, 1.5rem);
  --space-lg: clamp(1.5rem, 3vw, 2rem);
  --space-xl: clamp(2rem, 4vw, 3rem);
  --space-2xl: clamp(3rem, 6vw, 4rem);
  --space-3xl: clamp(4rem, 8vw, 5rem);
  
  /* Fluid Spacing for Component Variants */
  --spacing-xs: clamp(8px, 2vw, 12px);
  --spacing-sm: clamp(12px, 2.5vw, 16px);
  --spacing-md: clamp(16px, 3vw, 24px);
  --spacing-lg: clamp(20px, 4vw, 32px);
  --spacing-xl: clamp(28px, 5vw, 40px);
  
  /* === BORDER RADIUS === */
  --radius-sm:  3px;
  --radius-md:  6px;
  --radius-lg:  12px;
  --radius-xl:  16px;
  --radius-full: 9999px;
  
  /* === SHADOWS === */
  --shadow-sm:  0 1px 3px rgba(0,0,0,.2);
  --shadow-md:  0 4px 12px rgba(0,0,0,.25);
  --shadow-lg:  0 8px 24px rgba(0,0,0,.3);
  --shadow-xl:  0 20px 25px rgba(0,0,0,.1);
 TRANSITIONS === */
  --transition-fast:  150ms ease-in-out;
  --transition-base:  300ms ease-in-out;
  --transition-slow:  500ms ease-in-out;
  --ease-tension:     cubic-bezier(0.16, 1, 0.3, 1);
  
  /* === HEADER HEIGHT (Critical for fixed header pages) === */
  --header-height: calc(clamp(80px, 12vw, 140px) + 12px + env(safe-area-inset-top, 0px));
}

/* =========================================================
   GLOBAL RESETS & BASE STYLES
   ========================================================= */
*, *::before, *::after { box-sizing: border-box; }

html {
  font-size: 16px;
  scroll-behavior: smooth;
  overflow-x: hidden;
  max-width: 100vw;
}

body {
  font-family: var(--font-body);
  font-size: var(--fs-base);
  line-height: 1.6;
  color: var(--dtb-text);
  background-color: var(--dtb-bg);
  margin: 0;
  padding: 0;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  padding-top: var(--header-height, 70px); /* Prevents content hiding behind fixed header */
  min-height: 100vh;
}

img {
  max-width: 100%;
  height: auto;
  display: block;
  image-rendering: auto;
  -webkit-user-select: none;
  user-select: none;
}

a {
  color: var(--primary-600);
  text-decoration: none;
  transition: color var(--transition-fast), transform var(--transition-fast);
}

a:hover, a:focus {
  color: var(--primary-700);
  text-decoration: underline;
}

strong, b { font-weight: 700; }

/* Background texture pattern */
.machined-bg {
  position: fixed;
  inset: 0;
  z-index: -1;
  background-image: radial-gradient(circle at 2px 2px, var(--machined-border) 1px, transparent 0);
  background-size: 40px 40px;
  opacity: 0.5;
  pointer-events: none;
}

/* Screen reader only utility */
.sr-only, .visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.text-center { text-align: center; }
.text-left { text-align: left; }
.text-right { text-align: right; }
.text-muted { color: var(--text-secondary); }

/* =========================================================
   TYPOGRAPHY HEADINGS
   ========================================================= */
h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
  font-weight: 700;
  line-height: 1.2;
  color: var(--dtb-primary);
  margin-top: 0;
  margin-bottom: var(--space-md);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

h1 { font-size: var(--fs-4xl); }
h2 { font-size: var(--fs-3xl); }
h3 { font-size: var(--fs-2xl); }
h4 { font-size: var(--fs-xl); }
h5 { font-size: var(--fs-lg); }
h6 { font-size: var(--fs-base); }

/* Machined precision titles */
.machined-title {
  font-size: clamp(2rem, 8vw, 6rem);
  font-weight: 800;
  line-height: 0.9;
  letter-spacing: -0.04em;
  color: var(--dtb-primary);
}

/* =========================================================
   BUTTONS — HIGH-CONTRAST INDUSTRIAL STYLE
   ========================================================= */
.wp-block-button__link,
.dtb-btn,
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-sm) var(--space-md);
  font-family: var(--font-heading);
  font-size: var(--fs-sm);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border: 2px solid transparent;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background-color var(--transition-fast), border-color var(--transition-fast), color var(--transition-fast), transform var(--transition-fast);
  text-decoration: none;
  min-height: 44px; /* Touch-friendly minimum */
  touch-action: manipulation;
}

.dtb-btn-primary,
.btn-primary {
  background-color: var(--dtb-accent);
  color: var(--text-light);
  border-color: var(--dtb-accent);
}

.dtb-btn-primary:hover,
.btn-primary:hover {
  background-color: #c73652;
  border-color: #c73652;
  color: var(--text-light);
  text-decoration: none;
  transform: translateY(-2px);
}

.dtb-btn-secondary,
.btn-secondary {
  background-color: transparent;
  color: var(--dtb-primary);
  border-color: var(--dtb-primary);
}

.dtb-btn-secondary:hover,
.btn-secondary:hover {
  background-color: var(--dtb-primary);
  color: var(--text-light);
  text-decoration: none;
  transform: translateY(-2px);
}

.btn-accent {
  background-color: var(--dtb-accent-alt);
  color: var(--dtb-text);
}

.btn-accent:hover {
  background-color: #d97706;
  transform: translateY(-2px);
}

.btn-group { display: inline-flex; gap: 0.5rem; }

/* Alloy buttons for machined design */
.alloy-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 16px 32px;
  background: var(--dtb-primary);
  color: white;
  text-decoration: none;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-size: 0.75rem;
  clip-path: polygon(0% 0%, 95% 0%, 100% 25%, 100% 100%, 5% 100%, 0% 75%);
  transition: transform 0.2s;
  border: none;
  cursor: pointer;
}

.alloy-button:hover { transform: scale(1.02); }

.btn-add-to-cart {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 18px;
  background: linear-gradient(90deg, var(--primary-600), var(--primary-700));
  color: #fff;
  border-radius: 12px;
  font-weight: 800;
  box-shadow: 0 18px 40px rgba(37,99,235,0.12);
  border: none;
  transition: transform 200ms var(--ease-tension), box-shadow 200ms var(--ease-tension);
  min-width: 44px;
  min-height: 44px;
}

.btn-add-to-cart:hover { transform: translateY(-3px) scale(1.01); box-shadow: 0 22px 48px rgba(37,99,235,0.14); }

.btn-wishlist {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid rgba(15,23,42,0.06);
  background: white;
  color: var(--dtb-primary);
  min-width: 44px;
  min-height: 44px;
}

.btn-wishlist.wishlisted { background: #fff5f6; border-color: rgba(220,38,38,0.15); color: #dc2626; }

/* =========================================================
   HEADER & NAVIGATION (WordPress + Machined Design)
   ========================================================= */
.site-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
  min-height: var(--header-height);
  background: var(--surface-glass);
  backdrop-filter: blur(18px);
  border-bottom: 1px solid var(--machined-border);
  z-index: 1000;
  overflow: hidden;
  padding: env(safe-area-inset-top, 0px) 0 0;
}

.site-header-inner {
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  height: auto;
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 24px;
  align-items: center;
  padding: 0 clamp(0.75rem, 3vw, 2rem);
  min-height: 100%;
}

.site-branding .site-title a {
  font-family: var(--font-heading);
  font-size: var(--fs-2xl);
  color: var(--text-light);
  text-decoration: none;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.primary-navigation ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
}

.primary-navigation a {
  font-family: var(--font-heading);
  font-size: var(--fs-sm);
  font-weight: 700;
  color: var(--text-light);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: var(--space-xs) var(--space-sm);
  border-bottom: 2px solid transparent;
  transition: border-color var(--transition-fast), color var(--transition-fast);
}

.primary-navigation a:hover,
.primary-navigation .current-menu-item > a {
  color: var(--dtb-accent);
  border-color: var(--dtb-accent);
  text-decoration: none;
}

/* Nav links for machined design */
.nav-link {
  text-decoration: none;
  color: var(--dtb-primary);
  font-weight: 600;
  font-size: var(--fs-sm);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  transition: opacity 150ms ease, color 150ms ease;
  white-space: nowrap;
}

.nav-link:hover { opacity: 0.7; }
.nav-link.active { color: var(--tension-accent); }

.logo-image, .logo-image-mobile {
  width: clamp(180px, 20vw, 260px);
  height: auto: contain;
  object-position: center;
  flex-shrink: 0;
  display: block;
  transition: transform 0.2s ease;
  line-height: 1;
}

.logo-image:hover, .logo-image-mobile:hover { transform: scale(1.05); }

/* Mobile layout adjustments */
@media (max-width: 767px) {
  :root { --header-height: calc(70px + env(safe-area-inset-top, 0px)); }
  .site-header { min-height: var(--header-height); padding: env(safe-area-inset-top, 0px) 0 0; }
  .site-header-inner { grid-template-columns: auto 1fr auto; height: 70px; gap: 12px; padding: 0 12px; }
  .logo-image { display: none; }
  .logo-image-mobile { display: block; }
  body { padding-top: var(--header-height, 70px); }
}

@media (min-width: 641px) and (max-width: 1024px) {
  :root { --header-height: calc(clamp(80px, 12vw, 120px) + env(safe-area-inset-top, 0px)); }
  .site-header { padding: env(safe-area-inset-top, 0px) clamp(0.75rem, 3vw, 1.5rem) 0; }
  .site-header-inner { grid-template-columns: 1fr auto 1fr; gap: 0.75rem; }
  .logo-image-mobile { display: block; max-width: 220px; }
  .logo-image { display: none; }
}

@media (min-width: 1025px) {
  .site-header-inner { grid-template-columns: auto 1fr auto; }
  .logo-image { display: block; }
  .logo-image-mobile { display: none; }
}

/* =========================================================
   HERO SECTION
   ========================================================= */
.dtb-hero,
.hero {
  background: linear-gradient(135deg, var(--primary-600) 0%, var(--primary-hover) 100%);
  color: var(--text-light);
  padding: var(--space-2xl) var(--space-md);
  text-align: center;
  position: relative;
  overflow: hidden;
  min-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.05) 35px, rgba(255,255,255,.05) 70px);
  pointer-events: none;
}

.hero-content {
  position: relative;
  z-index: 1;
  max-width: 800px;
  margin: 0 auto;
  text-align: center;
}

.hero h1 {
  color: var(--text-light);
  font-size: clamp(var(--fs-3xl), 6vw, var(--fs-4xl));
  margin-bottom: var(--space-md);
}

.hero p {
  font-size: var(--fs-lg);
  color: rgba(255,255,255,.85);
  margin-bottom: var(--space-xl);
}

/* =========================================================
   BRAND SELECTOR COMPONENT (from React)
   ========================================================= */
.brand-selector {
  padding: clamp(12px, 2vw, 20px) clamp(1rem, 5vw, 2.5rem);
  max-width: 1400px;
  margin: 0 auto;
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

.brand-selector-header {
  text-align: center;
  margin-bottom: clamp(24px, 4vw, 40px);
}

.brand-selector-header h2 {
  font-size: clamp(2rem, 5vw, 3.5rem);
  margin: 0 0 clamp(12px, 2vw, 20px) 0;
  letter-spacing: -0.02em;
  font-weight: 800;
  background: linear-gradient(135deg, var(--primary-600) 0%, var(--tension-accent) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.brand-selector-subtitle {
  font-size: clamp(0.95rem, 2vw, 1.15rem);
  color: var(--text-secondary);
  margin: 0;
  letter-spacing: -0.01em;
  font-weight: 500;
}

.brands-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: clamp(16px, 3vw, 24px);
  margin-bottom: clamp(32px, 5vw, 40px);
}

@media (min-width: 6 { .brands-grid { grid-template-columns: repeat(2, 1fr); } }
@media (min-width: 768px) { .brands-grid { grid-template-columns: repeat(3, 1fr); } }
@media (min-width: 1024px) { .brands-grid { grid-template-columns: repeat(4, 1fr); } }

.brand-card {
  position: relative;
  background: var(--surface-base);
  border: 1px solid var(--alloy-edge);
  border-radius: 12px;
  padding: clamp(20px, 4vw, 32px) clamp(16px, 3vw, 24px);
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  aspect-ratio: 1 / 1;
  animation: slideUp 0.6s ease-out;
  animation-fill-mode: both;
  min-height: 200px;
  min-width: 150px;
}

.brands-grid .brand-card:nth-child(1) { animation-delay: 0.1s; }
.brands-grid .brand-card:nth-child(2) { animation-delay: 0.2s; }
.brands-grid .brand-card:nth-child(3) { animation-delay: 0.3s; }
.brands-grid .brand-card:nth-child(4) { animation-delay: 0.4s; }

.brand-card-background {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, var(--primary-600) 0%, var(--tension-accent) 100%);
  opacity: 0;
  transition: opacity 0.4s ease-out;
  z-index: 0;
}

.brand-card:hover {
  border-color: var(--tension-accent);
  box-shadow: 0 12px 24px rgba(0,0,0,.1);
  transform: translateY(-4px);
}

.brand-card:hover .brand-card-background { opacity: 0.08; }

.brand-card-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(8px, 2vw, 12px);
}

.brand-logo-placeholder {
  width: 120px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--surface-elevated) 0%, var(--surface-secondary) 100%);
  border: 2px dashed var(--alloy-edge);
  border-radius: 8px;
  color: var(--text-tertiary);
  transition: all 0.4s ease-out;
  position: relative;
  overflow: hidden;
}

.brand-card:hover .brand-logo-placeholder {
  border-color: var(--tension-accent);
  background: linear-gradient(135deg, var(--surface-secondary) 0%, var(--surface-elevated) 100%);
}

.brand-name {
  font-size: 1.35rem;
  margin: 0;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--text-primary);
  transition: color 0.4s ease-out;
}

.brand-card:hover .brand-name { color: var(--tension-accent); }

@media (max-width: 768px) {
  .brand-selector { padding: 40px 16px; }
  .brand-selector-header { margin-bottom: 40px; }
  .brand-selector-header h2 { font-size: 1.75rem; }
  .brands-grid { grid-template-columns: 1fr; gap: 16px; }
  .brand-card { padding: 32px 24px; transition: none; animation: fadeIn 0.5s ease-out; }
  .brand-card:nth-child(1),
  .brand-card:nth-child(2),
  .brand-card:nth-child(3),
  .brand-card:nth-child(4) { animation-delay: 0s; }
  .brand-card:hover { border-color: var(--alloy-edge); box-shadow: none; transform: none; }
  .brand-card:hover .brand-card-background { opacity: 0; }
}

/* =========================================================
   TOOL SELECTOR COMPONENT (from React)
   ========================================================= */
.tool-selector {
  padding: clamp(20px, 4vw, 40px) clamp(1rem, 5vw, 2.5rem);
  max-width: 1400px;
  margin: 0 auto;
}

.tool-selector-header {
  text-align: center;
  margin-bottom: clamp(24px, 4vw, 40px);
}

.tool-selector-header h2 {
  font-size: clamp(2rem, 5vw, 3.5rem);
  margin: 0 0 clamp(12px, 2vw, 20px) 0;
  letter-spacing: -0.02em;
  font-weight: 800;
  color: var(--text-primary);
  text-align: center;
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: clamp(12px, 3vw, 20px);
  margin-bottom: clamp(32px, 5vw, 40px);
}

@media (min-width: 768px) { .tools-grid { grid-template-columns: repeat(3, 1fr); } }
@media (min-width: 1024px) { .tools-grid { grid-template-columns: repeat(4, 1fr); } }

.tool-card {
  position: relative;
  background: var(--surface-base);
  border: 1px solid var(--alloy-edge);
  border-radius: 12px;
  padding: clamp(20px, 4vw, 28px) clamp(16px, 3vw, 24px);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  aspect-ratio: 1 / 1;
  animation: slideUp 0.6s ease-out;
  animation-fill-mode: both;
  min-height: 200px;
  min-width: 150px;
}

.tool-name {
  font-size: clamp(1rem, 3vw, 1.3rem);
  margin: 0;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--text-primary);
  transition: all 0.4s ease-out;
  line-height: 1.3;
  text-align: center;
  text-shadow:
    0 2px 8px rgba(0, 0, 0, 0.4),
    0 0 20px rgba(255, 255, 255, 0.3),
    0 0 40px rgba(37, 99, 235, 0.2);
}

.tool-card:hover .tool-name {
  color: var(--text-light);
  text-shadow:
    0 4px 12px rgba(0, 0, 0, 0.5),
    0 0 30px rgba(255, 255, 255, 0.5),
    0 0 60px rgba(37, 99, 235, 0.3);
}

.categories-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: clamp(16px, 3vw, 28px);
  margin-bottom: clamp(32px, 5vw, 40px);
}

@media (min-width: 768px) { .categories-grid { grid-template-columns: repeat(3, 1fr); } }
@media (min-width: 1024px) { .categories-grid { grid-template-columns: repeat(4, 1fr); } }

.category-card {
  position: relative;
  background: var(--surface-base);
  border: 1px solid var(--alloy-edge);
  border-radius: 12px;
  padding: clamp(16px, 4vw, 28px) clamp(12px, 3vw, 24px);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  min-height: clamp(120px, 25vw, 180px);
  gap: clamp(8px, 2vw, 12px);
}

.category-name {
  font-size: clamp(1rem, 3vw, 1.2rem);
  margin: 0;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--text-primary);
  transition: all 0.4s ease-out;
}

.category-count {
  font-size: clamp(0.75rem, 2vw, 0.85rem);
  margin: 0;
  color: var(--text-tertiary);
  transition: color 0.3s ease-out;
  font-weight: 500;
}

/* =========================================================
   SORT DROPDOWN COMPONENT (from React)
   ========================================================= */
.sort-dropdown {
  position: relative;
  display: inline-block;
  width: 100%;
  max-width: 200px;
}

.sort-select {
  width: 100%;
  padding: var(--space-sm) var(--space-md);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background-color: white;
  font-family: var(--font-main);
  font-size: var(--fs-sm);
  color: var(--text-primary);
  appearance: none;
  cursor: pointer;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
  padding-right: 36px;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-position: right var(--space-sm) center;
  background-repeat: no-repeat;
  background-size: 16px 12px;
  min-height: 44px;
}

.sort-select:focus {
  outline: none;
  border-color: var(--primary-600);
  box-shadow: 0 0 0 3px rgba(37,99,235,.1);
}

.sort-select option {
  padding: var(--space-sm);
  font-family: var(--font-main);
  font-size: var(--fs-sm);
  color: var(--text-primary);
  background-color: white;
}

.sort-label {
  display: block;
  margin-bottom: var(--space-xs);
  font-size: var(--fs-sm);
  font-weight: 600;
  color: var(--text-primary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* =========================================================
   SCHEMATIC CONTAINER & HOTSPOTS (Mobile Optimized)
   ========================================================= */
.schematic-container {
  position: relative;
  background: #fff;
  border: 1px solid var(--machined-border);
  padding: 0;
  margin: 0;
  border-radius: var(--radius-md);
  overflow: hidden;
  user-select: none;
  -webkit-touch-callout: none;
  touch-action: pan-x pan-y pinch-zoom;
  width: 100%;
  max-width: 100%;
  aspect-ratio: auto;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: stretch;
  min-height: clamp(300px, 70vh, 100vh);
}

.schematic-container img {
  width: 100%;
  height: auto;
  display: block;
  max-width: 100%;
  object-fit: contain;
  pointer-events: none;
  image-rendering: auto;
  -webkit-user-select: none;
  user-select: none;
}

/* Transform wrapper: must size to the image so hotspot % positions align correctly */
.schematic-container > div[style*="position: relative"] {
  flex: 0 0 auto !important;
  display: block !important;
  width: 100% !important;
}

/* Hotspots — touch-optimized across all screen sizes */
.hotspot {
  position: absolute;
  width: 6px;
  height: 6px;
  background: transparent;
  border-radius: 50%;
  cursor: pointer;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 180ms ease-out, box-shadow 180ms ease-out, background-color 180ms ease-out;
  -webkit-user-select: none;
  user-select: none;
  touch-action: none;
  box-sizing: border-box;
}

@media (min-width: 1024px) {
  .hotspot { width: 8px; height: 8px; min-width: 8px; min-height: 8px; }
  .hotspot:hover { transform: translate(-50%, -50%) scale(1.08); }
}

@media (min-width: 769px) and (max-width: 1023px) {
  .hotspot 12px; min-height: 12px; }
  .hotspot:hover { transform: translate(-50%, -50%) scale(1.12); }
}

@media (min-width: 481px) and (max-width: 768px) {
  .hotspot { min-width: 16px; min-height: 16px; -webkit-tap-highlight-color: transparent; }
  .hotspot::after { content: ''; position: absolute; inset: -12px; background: transparent; pointer-events: auto; }
}

@media (max-width: 480px) {
  .hotspot { min-width: 20px; min-height: 20px; -webkit-tap-highlight-color: transparent; }
  .hotspot::after { content: ''; position: absolute; inset: -12px; background: transparent; pointer-events: auto; }
}

.hotspot:hover {
  background: rgba(37,99,235,.08);
  box-shadow: 0 4px 14px rgba(37,99,235,.06);
  transform: translate(-50%, -50%) scale(1.08);
}

/* Navigation hotspots for schematic page transitions */
.nav-hotspot {
  position: absolute;
  cursor: pointer;
  border: 2px dashed rgba(56,189,248,.55);
  border-radius: 8px;
  background: rgba(56,189,248,.07);
  pointer-events: auto;
  display: flex;
  align-items: flex-end;
  justify-content: flex-start;
  padding: 4px 6px;
  transition: background 200ms ease, border-color 200ms ease;
  box-sizing: border-box;
  user-select: none;
  animation: navHotspotPulse 3s ease-in-out infinite;
}

@keyframes navHotspotPulse {
  0%,  100% { border-color: rgba(56,189,248,.45); background: rgba(56,189,248,.06); }
  50% { border-color: rgba(56,189,248,.75); background: rgba(56,189,248,.12); }
}

.nav-hotspot:hover {
  background: rgba(56,189,248,.18);
  border-color: rgba(56,189,248,.90);
  animation: none;
}

.nav-hotspot-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: rgba(14,165,233,.88);
  color: #fff;
  font-size: 0.58rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 3px 7px;
  border-radius: 4px;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transition: opacity 180ms ease;
  box-shadow: 0 2px 6px rgba(0,0,0,.18);
}

.nav-hotspot:hover .nav-hotspot-label { opacity: 1; }

@media (max-width: 768px) {
  .nav-hotspot {
    border-width: 2px;
    border-style: solid;
    border-color: rgba(56,189,248,.60);
    background: rgba(56,189,248,.09);
    animation: none;
    min-width: 48px;
    min-height: 48px;
  }
  .nav-hotspot-label { opacity: 1; font-size: 0.55rem; padding: 2px 5px; }
}

/* =========================================================
   SCHEMATIC FILTER BAR + DROPDOWNS
   ========================================================= */
.schematic-filter-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 10002;
  margin-bottom: var(--space-md);
}

.filter-bar-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 6px 10px;
  background: linear-gradient(135deg, rgba(255,255,255,.95) 0%, rgba(248,250,252,.95) 100%);
  backdrop-filter: blur(20px);
  border-radius: 8px;
  border: 1px solid rgba(15,23,42,.08);
  box-shadow: 0 2px 8px rgba(15,23,42,.03), 0 1px 2px rgba(15,23,42,.02), inset 0 1px 0 rgba(255,255,255,.5);
  position: relative;
  overflow: visible;
}

.filter-trigger {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding: 6px 10px;
  background: linear-gradient(135deg, #ffffff 0%, #fafbfc 100%);
  border: 1px solid rgba(15,23,42,.08);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  outline: none;
  position: relative;
  min-height: 44px;
}

.filter-trigger:hover {
  border-color: rgba(37,99,235,.3);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(37,99,235,.12), 0 2px 8px rgba(15,23,42,.06);
}

.filter-section.expanded .filter-trigger {
  border-color: var(--primary-600);
  box-shadow: 0 8px 32px rgba(37,99,235,.16), 0 2px 8px rgba(37,99,235,.08);
}

.filter-section.has-selection .filter-trigger {
  background: linear-gradient(135deg, rgba(37,99,235,.06) 0%, rgba(96,165,250,.04) 100%);
  border-color: rgba(37,99,235,.25);
}

.filter-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: white;
  border-radius: 10px;
  border: 1px solid rgba(15,23,42,.08);
  box-shadow: 0 12px 40px rgba(15,23,42,.12), 0 4px 12px rgba(15,23,42,.06);
  overflow: hidden;
  z-index: 10004;
  animation: dropdownSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  min-width: 220px;
}

@keyframes dropdownSlideIn {
  from { opacity: 0; transform: translateY(-8px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.filter-dropdown-content {
  max-height: 320px;
  overflow-y: auto;
  padding: 6px;
}

.custom-scrollbar::-webkit-scrollbar { width: 8px; }
.custom-scrollbar::-webkit-scrollbar-track { background: rgba(15,23,42,.03); border-radius: 10px; margin: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(37,99,235,.3); border-radius: 10px; }

.filter-option {
  width: 100%;
  display: flex;
  align-items: center;
  padding: 10px 12px;
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  text-align: left;
  position: relative;
  min-height: 44px;
}

.filter-option:hover { transform: translateX(4px); }
.filter-option.active {
  background: linear-gradient(135deg, rgba(37,99,235,.1) 0%, rgba(96,165,250,.06) 100%);
  border-left: 3px solid var(--primary-600);
}

.filter-option-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  position: relative;
  z-index: 1;
}

.filter-option-text {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--primary-600);
}

/* Schematic Dropdown Specific Styling */
.filter-dropdown-schematic {
  min-width: 280px;
  max-width: 100vw;
  width: auto;
}

.filter-option-schematic {
  width: 100%;
  padding: 10px 12px;
}

.filter-option-schematic .filter-option-content {
  flex-wrap: wrap;
  gap: 12px;
}

.filter-option-schematic .filter-option-main {
  flex: 1;
  min-width: 200px;
  word-wrap: break-word;
  word-break: break-word;
}

/* =========================================================
   FILTER PANEL + RANGE SLIDERS
   ========================================================= */
.filter-panel-overlay {
  animation: fadeIn 0.2s ease-out;
}

.filter-label {
  font-size: 0.55rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-muted);
  display: block;
  margin-bottom: var(--space-xs);
}

.slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
}

.slider-thumb::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary-600), var(--primary-700));
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 2px 6px rgba(37,99,235,.4);
  transition: all 0.2s ease;
}

.slider-thumb::-webkit-slider-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 4px 10px rgba(37,99,235,.6);
}

.slider-thumb::-webkit-slider-thumb:active { transform: scale(1.3); }

input[type="checkbox"],
input[type="radio"] {
  accent-color: var(--primary-600);
  min-width: 18px;
  min-height: 18px;
}

input[type="checkbox"]:focus,
input[type="range"]:focus-visible {
  outline: 2px solid rgba(37,99,235,.3);
  outline-offset: 2px;
}

.price-range-active {
  background: linear-gradient(135deg, #eff6ff, #dbeafe);
  border: 1.5px solid var(--primary-600);
}

.touch-target {
  min-height: 44px;
  min-width: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Track styling */
.slider-thumb::-moz-range-track {
  background: transparent;
  border: none;
}

.slider-thumb::-moz-range-progress {
  background: #2563eb;
}

/* Selection state styling */
.filter-item-selected {
  background-color: #eff6ff;
  border-color: #bfdbfe;
  transition: all 0.2s ease;
}

.filter-item-selected span:first-child {
  color: #1e40af;
  font-weight: 600;
}

/* Checkmark badge */
.filter-checkmark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background-color: #dbeafe;
  border: 2px solid #2563eb;
  border-radius: 50%;
  color: #2563eb;
  font-size: 12px;
  font-weight: bold;
  animation: scaleIn 0.2s ease-out;
}

@keyframes scaleIn {
  from { transform: scale(0); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

/* Badge styling */
.filter-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.625rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  background-color: #dbeafe;
  color: #0c4a6e;
  animation: fadeIn 0.2s ease-out;
}

/* Checkbox styling enhancement */
input[type="checkbox"]:accent-primary-600 {
  accent-color: #2563eb;
}

input[type="checkbox"] {
  cursor: pointer;
}

input[type="checkbox"]:focus {
  outline: none;
}

/* Range slider styling (all browsers) */
input[type="range"] {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 28px;
  background: transparent;
}

input[type="range"]::-webkit-slider-runnable-track {
  height: 8px;
  background: linear-gradient(90deg, var(--primary-100), var(--primary-100));
  border-radius: var(--radius-full);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.6);
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  margin-top: -5px;
  width: 18px;
  height: 18px;
  background: var(--primary-600);
  border-radius: var(--radius-full);
  box-shadow: 0 6px 14px rgba(37,99,235,.18);
  border: 3px solid #fff;
}

input[type="range"]::-moz-range-track {
  height: 8px;
  background: linear-gradient(90deg, var(--primary-100), var(--primary-100));
  border-radius: var(--radius-full);
}

input[type="range"]::-moz-range-thumb {
  width: 18px;
  height: 18px;
  background: var(--primary-600);
  border-radius: var(--radius-full);
  border: 3px solid #fff;
  box-shadow: 0 6px 14px rgba(37,99,235,.18);
}

/* =========================================================
   CARDS + PRODUCT TILES
   ========================================================= */
.dtb-card,
.card,
.tool-card {
  background: white;
  border: 1px solid var(--machined-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  min-height: 300px;
}

.dtb-card:hover,
.card:hover,
.tool-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-md);
  border-color: var(--primary-600);
}

.card-body {
  padding: var}

.card-title {
  font-size: var(--fs-xl);
  margin-bottom: var(--space-sm);
}

.card-meta {
  font-size: var(--fs-sm);
  color: var(--text-muted);
  margin-bottom: var(--space-md);
}

.quantity-control {
  display: inline-flex;
  align-items: center;
  background: linear-gradient(180deg, #ffffff, #fbfdff);
  border-radius: var(--radius-full);
  padding: 6px;
  box-shadow: 0 6px 20px rgba(2,6,23,.06);
  border: 1px solid rgba(15,23,42,.06);
  overflow: hidden;
}

.quantity-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: background 160ms var(--ease-tension), transform 120ms var(--ease-tension);
  color: var(--dtb-primary);
  min-height: 44px;
  min-width: 44px;
}

.quantity-btn:hover { background: rgba(2,6,23,.04); }
.quantity-btn:active { transform: translateY(1px) scale(0.995); }
.quantity-decrease { border-radius: var(--radius-full); }
.quantity-increase { border-radius: var(--radius-full); background: linear-gradient(90deg, var(--primary-500), var(--primary-600)); color: #fff; }

.quantity-input {
  width: 64px;
  min-width: 64px;
  text-align: center;
  font-weight: 700;
  font-size: var(--fs-base);
  border: none;
  outline: none;
  padding: 8px 10px;
  background: transparent;
  color: var(--dtb-primary);
}

/* =========================================================
   FORM ELEMENTS (All Input Types)
   ========================================================= */
.form {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.form-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-md);
}

.input,
.select,
.textarea {
  width: 100%;
  padding: var(--space-sm) var(--space-md);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: var(--fs-base);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
  min-height: 44px;
}

.input:focus,
.select:focus,
.textarea:focus {
  outline: none;
  border-color: var(--primary-600);
  box-shadow: 0 0 0 3px rgba(37,99,235,.1);
}

.machined-input,
.machined-textarea {
  width: 100%;
  padding: var(--space-md);
  border: 1px solid var(--machined-border);
  background: rgba(255,255,255,.5);
  font-family: var(--font-main);
  outline: none;
  transition: border-color var(--transition-fast);
}

.machined-input:focus,
.machined-textarea:focus {
  border-color: var(--dtb-primary);
}

label {
 : relative;
}

label:active { transform: scale(0.98); }

.form-group { margin-bottom: var(--space-md); }

.machined-label {
  display: block;
  text-transform: uppercase;
  font-size: 0.7rem;
  font-weight: 800;
  margin-bottom: var(--space-xs);
  letter-spacing: 0.05em;
}

/* =========================================================
   FOOTER
   ========================================================= */
.site-footer {
  background-color: var(--dtb-bg-dark);
  color: rgba(255,255,255,.75);
  padding: var(--space-2xl) var(--space-md) var(--space-md);
  font-size: var(--fs-sm);
  border-top: 3px solid var(--dtb-accent);
}

.site-footer a {
  color: var(--tension-accent-alt);
}

.site-footer a:hover {
  color: var(--text-light);
}

.site-info {
  text-align: center;
  padding-top: var(--space-md);
  border-top: 1px solid var(--border-dark);
  color: rgba(255,255,255,.45);
}

.footer-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2.5rem;
}

@media (max-width: 640px) {
  .footer-grid {
    grid-template-columns: 1fr !important;
    gap: 28px !important;
    padding: 32px 20px !important;
  }
  .site-footer .footer-col { text-align: center; }
  .site-footer img.footer-logo { max-width: 140px; width: 80%; height: auto; }
}

@media (min-width: 1025px) {
  .footer-grid {
    display: grid !important;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 40px;
  }
}

/* =========================================================
   COMPACT SELECTS + FILTERS
   ========================================================= */
.compact-controls {
  display: flex;
  gap: 12px;
  align-items: center;
  z-index: 950;
}

.compact-select {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  padding: 8px 14px;
  min-width: 140px;
  border-radius: var(--radius-full);
  border: 1px solid rgba(15,23,42,.06);
  background: linear-gradient(180deg, #ffffff, #fbfdff);
  color: var(--dtb-primary);
  font-size: 0.9rem;
  line-height: 1;
  cursor: pointer;
  outline: none;
  transition: all 160ms var(--ease-tension);
  box-shadow: 0 6px 18px rgba(2,6,23,.04);
  padding-right: 36px;
  position: relative;
  min-height: 44px;
  min-width: 140px;
}

.compact-select {
  background-image: url("image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24'%3E%3Cpath d='M6 9l6 6 6-6' fill='none' stroke='%230f172a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  background-size: 14px 14px;
}

.compact-select:focus {
  box-shadow: 0 10px 30px rgba(2,6,23,.08);
  border-color: var(--primary-600);
  transform: translateY(-2px);
}

@media (max-width: 720px) {
  .compact-controls { flex-direction: column; align-items: stretch; }
  .compact-select { width: 100%; }
}

/* =========================================================
   PAGINATION + PAGER PILLS
   ========================================================= */
.schematic-pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: clamp(4px, 1.5vw, 8px);
  padding: clamp(6px, 1.5vw, 10px) clamp(8px, 2vw, 12px);
  background: rgba(15,23,42,.0-radius: var(--radius-lg);
  flex-wrap: nowrap;
  z-index: 900;
}

.schematic-pager-top {
  padding: clamp(6px, 1.5vw, 10px) clamp(8px, 2vw, 12px) !important;
  gap: clamp(4px, 1.5vw, 8px) !important;
  margin-bottom: clamp(8px, 2vw, 12px) !important;
}

.pager-pill {
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-full);
  background: transparent;
  border: 1px solid transparent;
  color: var(--tension-accent);
  cursor: pointer;
  transition: all 180ms var(--ease-tension);
  min-height: 44px;
  min-width: 44px;
}

.pager-pill:hover:not(:disabled) {
  background: rgba(37,99,235,.08);
  transform: translateY(-2px);
}

.pager-pill:disabled, .pager-pill.disabled {
  opacity: 0.45;
  cursor: default;
  transform: none;
}

.pager-counter {
  font-size: 0.85rem;
  color: rgba(15,23,42,.9);
  padding: 4px 10px;
  border-radius: var(--radius-full);
  background: rgba(255,255,255,.9);
  font-weight: 700;
  box-shadow: 0 6px 18px rgba(2,6,23,.06);
}

/* Responsive Pager Sizes */
@media (max-width: 480px) {
  .schematic-pager-top {
    padding: clamp(6px, 1.5vw, 8px) clamp(8px, 2vw, 10px) !important;
    gap: clamp(4px, 1vw, 6px) !important;
    margin-bottom: clamp(8px, 2vw, 12px) !important;
  }
  
  .pager-pill {
    width: clamp(32px, 8vw, 36px) !important;
    height: clamp(32px, 8vw, 36px) !important;
    font-size: clamp(11px, 2vw, 13px) !important;
    padding: clamp(6px, 1.5vw, 8px) !important;
  }
  
  .pager-pill svg {
    width: clamp(12px, 3vw, 14px);
    height: clamp(12px, 3vw, 14px);
    stroke-width: 2.5;
  }
  
  .pager-counter {
    font-size: clamp(11px, 2vw, 13px);
    padding: 0 clamp(6px, 1.5vw, 8px);
    font-weight: 600;
  }
}

@media (min-width: 481px) and (max-width: 768px) {
  .schematic-pager-top {
    padding: clamp(8px, 1.5vw, 10px) clamp(10px, 2vw, 12px) !important;
    gap: clamp(6px, 1.5vw, 8px) !important;
    margin-bottom: clamp(10px, 2vw, 14px) !important;
  }
  
  .pager-pill {
    width: clamp(36px, 8vw, 40px) !important;
    height: clamp(36px, 8vw, 40px) !important;
    font-size: clamp(12px, 2vw, 14px) !important;
    padding: clamp(8px, 1.5vw, 10px) !important;
  }
  
  .pager-pill svg {
    width: clamp(14px, 3vw, 16px);
    height: clamp(14px, 3vw, 16px);
    stroke-width: 2.5;
  }
  
  .pager-counter {
    font-size: clamp(12px, 2vw, 14px);
    padding: 0 clamp(8px, 2vw, 12px);
    font-weight: 600;
  }
}

@media (min-width: 769px) {
  .schematic-pager {
    gap: 8px;
    padding: 8px 12px;
  }
  
  .schematic-pager-top {
    padding: 10px 12px !important;
    gap: 8px !important;
    margin-bottom: 16px !important;
  }
  
  .pager-pill {
    width: 40px !important;
    height: 40px !important;
    font-size: 0.85rem !important;
    padding: 8px !important;
    transition: all 0.2s ease-out;
  }
  
  .pager-pill svg {
    width: 16px;
    height: 16px;
    stroke-width: 2.5;
  }
  
  .pager-counter {
    font-size: 0.9rem;
    padding: 0 12px;
    font-weight: 600;
  }
}

/* =========================================================
   ZOOM CONTROLS + BACK BUTTON
   ========================================================= */
.zoom-control-btn {
  width: 40px;
  height: 40px;
  min-width: 40px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  background: rgba(255,255,255,.08);
  border: 1px solid rgba(255,255,255,.12);
  color: rgba(255,255,255,.85);
  cursor: pointer;
  transition: all 240ms cubic-bezier(0.4, 0, 0.2, 1);
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  padding: 0;
}

.zoom-control-btn:hover {
  background: rgba(255,255,255,.12);
  border-color: rgba(255,255,255,.16);
  color: rgba(255,255,255,.95);
}

.zoom-control-btn:active {
  transform: scale(0.92);
  background: rgba(255,255,255,.16);
}

.back-button {
  position: relative;
  background: rgba(255,255,255,.95);
  padding: 10px 14px;
  border-radius: var(--radius-md);
  box-shadow: 0 4px 12px rgba(0,0,0,.12);
  color: var(--dtb-primary);
  font-size: var(--fs-sm);
  min-height: 44px;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: none;
  border: none;
  cursor: pointer;
}

.back-button:hover {
  transform: translateX(-4px);
  background: rgba(255,255,255,.98);
}

.back-button:active { background: rgba(255,255,255,.9); }

@media (max-width: 768px) {
  .back-button { padding: 8px 12px; font-size: 0.85rem; min-height: 40px; }
  .back-button svg { width: 16px; height: 16px; }
}

@media (min-width: 769px) {
  .back-button {
    background: rgba(255,255,255,.92);
    padding: 8px 12px;
    border-radius: 10px;
    box-shadow: 0 8px 20px rgba(2,6,23,.08);
    font-size: 0.95rem;
    font-weight: 600;
  }
  .back-button svg { width: 20px; height: 20px; }
}

/* Schematic Title Container */
.schematic-title-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
}

.schematic-title-container h3 {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  text-align: center;
  white-space: normal;
}

@media (max-width: 480px) {
  .schematic-title-container {
    margin-bottom: 10px !important;
    padding: 8px 10px !important;
    gap: 6px !important;
  }
  
  .schematic-title-container h3 {
    font-size: 0.85rem !important;
  }
}

/* =========================================================
   FULLSCREEN MODE
   ========================================================= */
.fullscreen-mode .schematic-container {
  min-height: calc(100vh - 140px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.schematic-zoom-controls {
  display: none;
  position: fixed;
  bottom: max(var(--space-md), env(safe-area-inset-bottom, 16px));
  left: 50%;
  transform: translateX(-50%);
  flex-direction: row;
  align-items: center;
  gap: clamp(6px, 1.5vw, 10px);
  z-index: 900;
  pointer-events: none;
  background: rgba(15,23,42,.55);
  backdrop-filter: blur(20px);
  padding: clamp(8px, 2vw, 12px) clamp(12px, 2.5vw, 16px);
  border-radius: 28px;
  border: 1px solid rgba(255,255,255,.08);
  box-shadow: 0 8px 32px rgba(0,0,0,.12);
}

@media (max-width: 768px) {
  .schematic-zoom-controls {
    display: flex;
    animation: slideInFromBottom 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
    pointer-events: auto;
  }
}

@media (min-width: 769px) {
  .schematic-zoom-controls {
    position: absolute;
    top: clamp(10px, 1.5vw, 16px);
    left: clamp(10px, 1.5vw, 16px);
    right: auto;
    bottom: auto;
    transform: none;
    z-index: 100;
  }
}

@keyframes slideInFromBottom {
  from { opacity: 0; transform: translateX(-50%) translateY(8px); }
  to { opacity: 1; transform: translateX(-50%) translateY(0); }
}

/* =========================================================
   MODALS + OVERLAYS
   ========================================================= */
.cart-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15,23,42,.4);
  backdrop-filter: blur(4px);
  z-index: 2000;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s;
}

.cart-overlay.active {
  opacity: 1;
  pointer-events: all;
}

.cart-panel {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 400px;
  max-width: 100%;
  background: white;
  padding: 40px;
  transform: translateX(100%);
  transition: transform 0.5s var(--ease-tension);
  overflow-y: auto;
  max-height: 90vh;
}

.cart-overlay.active .cart-panel {
  transform: translateX(0);
}

.cart-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid var(--machined-border);
}

.part-modal {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%) translateY(8px);
  width: 280px;
  background: white;
  border: 1px solid var(--dtb-primary);
  padding: 20px;
  z-index: 100;
  opacity: 0;
  visibility: hidden;
  transition: opacity 180ms ease-out, transform 220ms ease-out, visibility 180ms;
  box-shadow: 0 14px 30px rgba(0,0,0,.14);
  border-radius: 12px;
}

.part-meta {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: #64748b;
  margin-bottom: 16px;
}

.mobile-modal-backdrop,
.mobile-part-modal-overlay {
  display: none;
}

@media (max-width: 768px) {
  .mobile-modal-backdrop {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(15,23,42,.55);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    z-index: 10200;
    animation: backdropFadeIn 220ms ease-out;
  }
  
  @keyframes backdropFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  .mobile-part-modal-overlay {
    display: block;
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 10300;
    background: #ffffff;
    border-radius: 20px;
    box-shadow: 0 24px 60px rgba(0,0,0,.28), 0 8px 20px rgba(0,0,0,.14), 0 0 0 1px rgba(255,255,255,.4) inset;
    border: 1px solid rgba(15,23,42,.1);
    padding: 24px 20px 20px;
    width: min(calc(100vw - 40px), 380px);
    max-height: min(calc(100vh - 120px), 80vh);
    overflow-y: auto;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;
    pointer-events: auto;
    animation: overlaySlideIn 280ms cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  
  @keyframes overlaySlideIn {
    from { opacity: 0; transform: translate(-50%, -44%); }
    to { opacity: 1; transform: translate(-50%, -50%); }
  }
  
  .hotspot .part-modal { display: none !important; }
  
  .section-enter:not(.fullscreen-mode) {
    padding-left: clamp(8px, 1.5vw, 12px) !important;
    padding-right: clamp(8px, 1.5vw, 12px) !important;
  }
}

/* =========================================================
   UTILITIES + LAYOUT
   ========================================================= */
.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 var(--space-md);
}

.container-fluid { width: 100%; padding: 0 var(--space-md); }

.flex { display: flex; }
.flex-col { display: flex; flex-direction: column; }
.items-center { align-items: center; }
.justify-center { justify-content: center; }
.gap-sm { gap: var(--space-sm); }
.gap-md { gap: var(--space-md); }
.gap-lg { gap: var(--space-lg); }

.section-enter {
  animation: sectionEnter 0.6s var(--ease-tension) forwards;
}

@keyframes sectionEnter {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Table styles */
table {
  border-collapse: collapse;
  width: 100%;
}

th, td {
  padding: var(--space-sm);
  border: 1px solid var(--border-color);
}

th {
  background-color: var(--dtb-bg-dark);
  color: var(--text-light);
}

/* Blockquote */
.wp-block-quote {
  border-left: 4px solid var(--primary-600);
  padding-left: var(--space-md);
  font-style: italic;
  color: var(--text-muted);
}

/* =========================================================
   RESPONSIVE BREAKPOINTS
   ========================================================= */
@media (max-width: 768px) {
  .schematic-filter-bar {
    width: 100%;
    margin-top: 12px;
  }
  
  .filter-bar-container {
    flex-wrap: wrap;
    gap: 6px;
    padding: 8px 10px;
  }
  
  .filter-arrow { display: none; }
  
  .filter-section {
    flex: 1 1 auto;
    min-width: 120px;
    max-width: none;
  }
  
  .tool-selector {
    padding: 40px 16px;
  }
  
  .tool-selector-header {
    margin-bottom: 40px;
    gap: 20px;
  }
  
  .back-button {
    transition: none;
  }
  
  .back-button:hover {
    color: var(--text-primary);
    transform: none;
  }
  
  .header-content h2 {
    font-size: 1.75rem;
  }
  
  .tools-grid {
    grid-template-columns: 1fr;
    gap: 16px;
    place-items: center;
    max-width: 400px;
    margin: 0 auto 40px;
  }
  
  .tool-card {
    padding: 28px 20px;
    width: 100%;
    height: auto;
  }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation: none !important;
    transition: none !important;
  }
}

@media (-webkit-min-device-pixel-ratio: 2), (resolution: 192dpi) {
  .social-link { border-width: 0.75px; }
}

/* =========================================================
   PRINT STYLES
   ========================================================= */
@media print {
  .site-header, .site-footer, .nav-menu, .btn, .schematic-zoom-controls {
    display: none !important;
  }
  body {
    color: black;
    background: white;
  }
  a {
    text-decoration: underline;
    color: black;
  }
}

/* =========================================================
   WORDPRESS BLOCK EDITOR SUPPORT (Gutenberg)
   ========================================================= */
.wp-block-button__link {
  text-decoration: none;
  min-height: 44px;
}

.entry-content { position: relative; z-index: 10; }

.wp-block-image img {
  border-radius: var(--radius-md);
}

.wp-block-code {
  background: var(--surface-secondary);
  padding: var(--space-md);
  border-radius: var(--radius-md);
  overflow-x: auto;
}
```

---

## ✅ IMPLEMENTATION CHECKLIST

| Step | Action | Status |
|------|--------|--------|
| **1. Backup Existing File** | Save current `style.css` to `/backup/` folder | ⬜ |
| **2. Replace Content** | Paste optimized CSS above to overwrite | ⬜ |
| **3. Commit Changes** | `git add . && git commit -m "Integrate React + WP design system (v2.2)"` | ⬜ |
| **4. Push to GitHub** | `git push origin main` | ⬜ |
| **5. Verify Deploy** | Check Actions tab for success (~30 seconds) | ⬜ |
| **6. Clear Cache** | WP Admin → Tools → Site Health → Purge Caches | ⬜ |
| **7. Activate Theme** | WP Admin → Appearance → Themes → Activate if needed | ⬜ |
| **8. Test Components** | Verify all React components load with proper styling | ⬜ |

---

## 📋 WHAT THIS FILE INCLUDES

| Component | Source File | Integrated? |
|-----------|-------------|-------------|
| **Brand Selector** | `brand-selector.css` | ✅ Grid layout, hover states, animations |
| **Tool Selector** | `tool-selector.css` | ✅ Tool cards, category grids, responsive layouts |
| **Sort Dropdown** | `sort-dropdown.css` | ✅ Sortable selects with custom styling |
| **Mobile Schematic** | `mobile-schematic.css` | ✅ Responsive sizing, hotspots, zoom controls |
| **Filter Panel** | `filter-panel.css` | ✅ Range sliders, checkboxes, dropdowns |
| **Schematic Filter Bar** | `schematic-filter-bar.css` | ✅ Compact inline selectors, dropdown animations |
| **Machined Design** | `machined-design.css` | ✅ Header, hero, cards, forms, footer |
| **WordPress Core** | Original `style.css` | ✅ Industrial Professional branding |
| **React App** | `App.css` | ✅ Global React component styles |
| **Index Styles** | `index.css` | ✅ Root element and global overrides |
| **General Styles** | `styles.css` | ✅ Common utilities and base styles |

---

## 🛠️ DEPLOY NOW

Your WordPress site will now have **both**:
1. **WP admin dashboard** for non-technical content editing
2. **React component styling** for modern interactive features including all CSS files

**Push the file and check your live site!**