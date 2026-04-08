# Drywall Toolbox Pro Calculators - React Implementation

Complete React conversion of the professional drywall calculator suite with all enhanced features.

## 🎯 Features Implemented

### ✅ Core Calculators
- **Sheets Calculator** - Multi-wall input, room presets, waste factors, exact deductions
- **Tape Calculator** - Industry-standard formulas (area/3.8), separate corner calculations
- **Corner Bead Calculator** - Straight vs. arch separation, stock length matching
- **Screws Calculator** - IRC-compliant spacing, application-specific calculations

### ✅ Enhanced Features
- **Data Persistence** - Auto-save to localStorage with timestamps
- **Template System** - Save/load job configurations
- **Material Summary** - Unified view of all calculator results
- **Export Functionality** - Generate downloadable text estimates
- **Mobile Optimization** - Touch gestures, responsive grids, swipe navigation
- **Room Presets** - Quick setup for common room sizes
- **Share Links** - URL-based project sharing

## 📦 Component Structure

```
src/components/calculators/
├── CalculatorHub.jsx           # Main container with tabs & state
├── SheetCalculator.jsx         # Drywall sheets calculator
├── TapeCalculator.jsx          # Joint tape calculator
├── CornerBeadCalculator.jsx    # Corner bead calculator
├── ScrewCalculator.jsx         # Screws calculator
├── SummaryView.jsx             # Complete job summary
├── index.js                    # Export barrel
└── shared/
    ├── ResultCard.jsx          # Reusable result display
    ├── InfoBox.jsx             # Contextual tips/warnings
    ├── WasteSelector.jsx       # Waste factor toggle buttons
    └── RoomPresets.jsx         # Quick room size presets
```

## 🚀 Quick Start

### 1. Import in Your App

```jsx
import { CalculatorHub } from './components/calculators'

function App() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <CalculatorHub />
    </div>
  )
}
```

### 2. Or Use Individual Calculators

```jsx
import { SheetCalculator, TapeCalculator } from './components/calculators'

function MyPage() {
  const handleSheetUpdate = (data) => {
    console.log('Sheets needed:', data.sheets)
  }

  return (
    <div>
      <SheetCalculator onUpdate={handleSheetUpdate} />
      <TapeCalculator onUpdate={(data) => console.log(data)} />
    </div>
  )
}
```

## 🎨 Styling

All components use **Tailwind CSS** utility classes. If you're not using Tailwind:

1. **Add Tailwind to your project:**
   ```bash
   npm install -D tailwindcss postcss autoprefixer
   npx tailwindcss init -p
   ```

2. **Configure `tailwind.config.js`:**
   ```js
   module.exports = {
     content: ['./src/**/*.{js,jsx,ts,tsx}'],
     darkMode: 'class',
     theme: { extend: {} },
     plugins: [],
   }
   ```

3. **Import in your CSS:**
   ```css
   @tailwind base;
   @tailwind components;
   @tailwind utilities;
   ```

## 💾 Data Persistence

### Auto-Save
Every change is automatically saved to `localStorage`:
- Current project state: `dwCalc_state`
- Saved templates: `dwCalc_templates`

### Template Management
```jsx
// Save current configuration as template
const saveTemplate = () => {
  // User prompted for template name
  // Stored in localStorage with timestamp
}

// Load saved template
const loadTemplate = () => {
  // Shows list of saved templates
  // User selects which to load
}
```

### Share Links
Projects can be shared via URL parameters:
```
https://yoursite.com/calculators?data=eyJwcm9qZWN0...
```

## 📱 Mobile Features

### Touch Gestures
- **Swipe left** - Next tab
- **Swipe right** - Previous tab
- **Minimum swipe distance** - 50px to prevent accidental triggers

### Responsive Breakpoints
- **Mobile** (`< 768px`) - Single column layout, stacked cards
- **Tablet** (`768px - 1024px`) - Two-column grids
- **Desktop** (`> 1024px`) - Full multi-column layout

## 🔧 API / Integration

Each calculator accepts an `onUpdate` callback that fires when results change:

```jsx
<SheetCalculator 
  onUpdate={(data) => {
    // data = {
    //   sheets: 24,
    //   sheetSize: 48,
    //   hangDir: 'horizontal',
    //   gross: 1200,
    //   net: 1140,
    //   wastePct: 0.10,
    //   numWalls: 4,
    //   doors: 1,
    //   windows: 2
    // }
  }}
/>
```

This allows you to:
- Sync with external state management (Redux, Zustand, etc.)
- Send analytics events
- Update cost estimates in real-time
- Trigger API calls to save to database

## 🧪 Testing Notes

### Key Testing Scenarios

1. **Wall Management**
   - Add/remove walls maintains correct IDs
   - Calculations update immediately
   - Minimum 1 wall always present

2. **Calculation Accuracy**
   - Sheet count always rounds up
   - Tape formula: `area / 3.8 + corners * height`
   - Corner bead: separate standard vs. arch
   - Screws: IRC-compliant spacing enforced

3. **Persistence**
   - Auto-save on every change
   - Correct timestamp formatting
   - Template save/load cycle

4. **Mobile UX**
   - Swipe gestures work smoothly
   - No accidental tab switches
   - Inputs remain touch-friendly (min 44px hit areas)

## 🎓 React Patterns Used

### useMemo for Calculations
All calculations live in `useMemo` hooks:
```jsx
const results = useMemo(() => {
  // Expensive calculations here
  return { sheets, net, gross, withWaste }
}, [walls, ceilHeight, sheetSize, doors, windows, wastePct])
```

**Why:** Only recalculates when dependencies actually change.

### useCallback for Update Handlers
Parent-to-child callbacks use `useCallback`:
```jsx
const handleSheetUpdate = useCallback((data) => {
  setSummaryData(prev => ({ ...prev, sheets: data }))
}, [])
```

**Why:** Prevents unnecessary re-renders of child components.

### Unique IDs with Date.now()
Wall objects use timestamp-based IDs:
```jsx
{ id: Date.now(), length: 10 }
```

**Why:** React keys must be stable and unique. Array indices fail when items are removed from the middle.

## 📊 Export Formats

### Text File Export
```
DRYWALL MATERIAL ESTIMATE
Project: Kitchen Remodel
Date: 4/8/2026
==================================================

DRYWALL SHEETS
  Quantity: 24 sheets
  Size: 4×12 ft
  Direction: Horizontal
  Wall Area: 1200 sq ft

JOINT TAPE
  Quantity: 2 rolls
  Type: Paper tape
  Roll Size: 500 ft
  Total Footage: 340 ft

...
```

### Share Link Format
Base64-encoded JSON state in URL parameter.

## 🔐 Privacy & Security

- **All data stored locally** - No server calls
- **No tracking or analytics** - Privacy-first
- **Share links contain full project data** - Be mindful when sharing

## 🛠️ Customization

### Add New Room Presets
Edit `shared/RoomPresets.jsx`:
```jsx
const presets = [
  { name: 'Custom Office', width: 14, length: 16 },
  // ... add more
]
```

### Change Waste Factor Options
Edit `shared/WasteSelector.jsx`:
```jsx
const wasteLevels = [
  { label: '3% minimal', value: 0.03 },
  { label: '7% standard', value: 0.07 },
  // ... customize
]
```

### Modify Calculation Formulas
Each calculator's `useMemo` block contains the pure calculation logic - easy to modify and test.

## 🐛 Known Limitations

1. **Print styling** - Basic implementation, can be enhanced
2. **No cost estimation** - Material quantities only (add pricing module if needed)
3. **Single project at a time** - No multi-project workspace (could add project selector)
4. **URL share links can be long** - Consider backend storage for production

## 📈 Future Enhancements

- [ ] Cost estimation with pricing database
- [ ] PDF export with formatting
- [ ] Multi-project management
- [ ] Cloud sync (optional)
- [ ] Material supplier API integration
- [ ] Photo upload for measurements
- [ ] Undo/redo functionality

## 📄 License

Part of the Drywall Toolbox project. See main repository for license.

---

**Built with React + Tailwind CSS**  
Industry-accurate calculations • Mobile-first design • Privacy-focused
