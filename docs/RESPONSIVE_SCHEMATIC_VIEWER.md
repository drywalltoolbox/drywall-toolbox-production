# Responsive Schematic Viewer Implementation

## Overview

The schematic viewer now implements a fully responsive design with platform-specific optimizations:

- **Mobile (≤768px)**: Fullscreen by default with floating toolbar at bottom
- **Desktop (≥769px)**: Normal layout with integrated toolbar at top-left of container

## Key Changes

### 1. Fullscreen by Default on Mobile

Previously, fullscreen was an optional toggle button. Now:

```javascript
// Mobile detection on mount and resize
const [isMobile, setIsMobile] = useState(
  typeof window !== 'undefined' ? window.innerWidth <= 768 : false
);

// Fullscreen is automatic - computed from viewport width
const isFullscreen = isMobile;
```

- Mobile users automatically get fullscreen viewer experience
- No toggle button needed - simplifies mobile UI
- Fullscreen state tied directly to viewport size (≤768px)

### 2. Unified Zoom Toolbar

The zoom controls toolbar is now named `schematic-zoom-controls` and handles both responsive layouts:

#### Mobile Behavior
- Position: Fixed bottom-center of viewport
- Style: Floating action button (FAB) style with blur backdrop
- Animation: Slide-in from bottom
- Features: Zoom in/out, reset zoom, percentage indicator

#### Desktop Behavior
- Position: Absolute top-left corner of schematic container
- Style: Compact inline toolbar with reduced size buttons
- Features: Zoom in/out, reset zoom, percentage indicator
- Integration: Part of the schematic container's visual hierarchy

### 3. Removed Elements

- **Fullscreen Toggle Button**: No longer needed since fullscreen is automatic on mobile
- **toggleFullscreen() Function**: Removed - state is now derived from window width
- **fullscreen-btn CSS Class**: Removed - button no longer exists

## Component Structure

```
Section (Parts page)
├── Brand Selector (if no brand selected)
├── Tool Selector (if brand selected, no schematic)
└── Schematic Viewer (if both brand and schematic selected)
    ├── Title Container
    ├── Page Navigator (if multi-page)
    ├── Schematic Zoom Controls (RESPONSIVE TOOLBAR)
    ├── Schematic Container (with image/SVG)
    │   └── Hotspots (interactive elements)
    └── Part Modal (when hotspot selected)
```

## Responsive Breakpoints

### Mobile: max-width 768px
- Section padding: Responsive spacing
- Container: Full width, flex-grow
- Toolbar: Fixed bottom-center, floating style
- Min height: 400px (or 350px on very small screens)

### Desktop: min-width 769px
- Section padding: Normal layout spacing
- Container: Constrained max-height (70vh)
- Toolbar: Absolute positioned top-left, 36px buttons
- Min height: 500px

### Small Mobile: max-width 480px
- Toolbar: Reduced padding and gap
- Buttons: 36px size (from 40px)
- Zoom indicator: Smaller font and width

## Usage Example

### Before (Old Structure)
```jsx
<div className="mobile-zoom-controls">
  <button onClick={toggleFullscreen} className="zoom-control-btn fullscreen-btn">
    {isFullscreen ? <ExitFullscreen /> : <EnterFullscreen />}
  </button>
  {/* other controls */}
</div>
```

### After (New Structure)
```jsx
<div className="schematic-zoom-controls">
  <button onClick={handleZoomIn} className="zoom-control-btn">
    <ZoomIn />
  </button>
  <button onClick={handleZoomOut} className="zoom-control-btn">
    <ZoomOut />
  </button>
  {scale > 1 && (
    <button onClick={handleResetZoom} className="zoom-control-btn reset-btn">
      <Reset />
    </button>
  )}
  <div className="zoom-indicator">{Math.round(scale * 100)}%</div>
</div>
```

## CSS Architecture

### Mobile Styles (@media max-width: 768px)
```css
.schematic-zoom-controls {
  position: fixed;
  bottom: max(8px, env(safe-area-inset-bottom, 8px));
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  /* Floating FAB style */
}
```

### Desktop Styles (@media min-width: 769px)
```css
.schematic-zoom-controls {
  position: absolute;
  top: 12px;
  left: 12px;
  display: flex;
  /* Integrated toolbar style */
}

.zoom-control-btn {
  width: 36px;
  height: 36px;
  /* Smaller buttons on desktop */
}
```

## State Management

### isMobile State
Tracks whether viewport is in mobile mode (≤768px):

```javascript
// On mount and window resize
const [isMobile, setIsMobile] = useState(
  typeof window !== 'undefined' ? window.innerWidth <= 768 : false
);

useEffect(() => {
  const handleResize = () => {
    setIsMobile(window.innerWidth <= 768);
  };
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);
```

### isFullscreen Derived State
No longer stored in state - computed from `isMobile`:

```javascript
const isFullscreen = isMobile;
```

This ensures fullscreen state is always synchronized with viewport size.

## Benefits

✅ **Simplified Mobile UI**: Fewer buttons and options on mobile
✅ **Better UX**: Fullscreen is default behavior users expect
✅ **Desktop Functionality**: Toolbar available on larger screens too
✅ **Responsive**: Automatically adapts to viewport size
✅ **No Manual Toggles**: Users don't need to manage fullscreen state
✅ **Consistent**: Both mobile and desktop have same zoom controls
✅ **Accessible**: Proper ARIA labels and keyboard support

## Future Enhancements

- [ ] Add double-tap to zoom to specific hotspot
- [ ] Landscape orientation optimizations
- [ ] Persistent zoom level per schematic (localStorage)
- [ ] Animated zoom hints for first-time users
- [ ] Keyboard shortcuts for zoom controls
- [ ] Touch gesture tutorials on mobile

## Testing Checklist

- [ ] Mobile portrait: fullscreen by default, toolbar at bottom
- [ ] Mobile landscape: fullscreen, toolbar still accessible
- [ ] Tablet: toolbar visible, fullscreen layout
- [ ] Desktop: normal layout with top-left toolbar
- [ ] Window resize: fullscreen toggles when crossing 768px breakpoint
- [ ] Zoom in/out: works on all viewport sizes
- [ ] Reset zoom: properly resets pan and scale
- [ ] Zoom indicator: updates correctly
- [ ] Hotspot interaction: works with zoom applied
- [ ] Mobile modal: centered and properly scrollable
