# Calculator Hub Implementation Strategy
## Based on Industry Standards & Production-Grade Formulations

---

## 📋 Executive Summary

This document provides a complete implementation roadmap for transforming our calculator hub from basic consumer-grade tools into a **production-grade, industry-standards-compliant estimation system**. Every formula, workflow, and calculation is derived from authoritative sources:

- **ASTM C 840** - Application and finishing of gypsum board
- **GA-214** - Gypsum Association finish level definitions (Levels 0-5)
- **IRC Table R702.3.5** - International Residential Code fastening requirements
- **CertainTeed & USG** - Manufacturer specifications
- **ClarkDietrich** - Steel framing guidelines

---

## 🎯 Core Principles

### 1. **Layout-Based Calculations (Not Area-Based)**
❌ **Wrong**: `Total_Sheets = Wall_Area / Sheet_Area`  
✅ **Correct**: Simulate physical sheet placement on each wall

### 2. **Dynamic Waste Factors (Not Static 10%)**
❌ **Wrong**: Apply flat 10% to all projects  
✅ **Correct**: Calculate based on vertical seam count and complexity

### 3. **Code-Compliant Fastening (Not Estimates)**
❌ **Wrong**: Generic screw counts  
✅ **Correct**: IRC-mandated 12" o.c. spacing for 1/2" board

### 4. **GA-214 Finish Levels (Not Generic Terms)**
❌ **Wrong**: "Light", "Medium", "Heavy" finish  
✅ **Correct**: Levels 0-5 with precise mud formulas

---

## 🏗️ IMPLEMENTATION BLUEPRINT

---

## PART 1: SHEET CALCULATOR UPGRADE

### Current State Analysis
Our existing `SheetCalculator.jsx` likely uses simplified area division. This must be completely rebuilt.

### Required Workflow

#### **Step 1: Input Collection**
```javascript
// User inputs per wall
{
  wallId: unique_identifier,
  length: number,        // feet or inches
  height: number,        // feet or inches
  openings: [           // doors, windows
    { width: number, height: number }
  ]
}
```

#### **Step 2: Layout-Based Sheet Count**
**Formula Implementation:**
```javascript
// For each wall
const sheetsAcross = Math.ceil(wallLength / sheetWidth)
const sheetsVertical = Math.ceil(wallHeight / sheetHeight)
const sheetsPerWall = sheetsAcross * sheetsVertical

// Store these values - they're used by other calculators!
wallData.sheetsAcross = sheetsAcross
wallData.sheetsVertical = sheetsVertical
```

**Critical**: Use `Math.ceil()` not `Math.round()` because partial sheets require full sheets.

**Example from Document:**
- 18' wall × 9' high with 4×8 sheets
- Area method: 162÷32 = 5.06 → **6 sheets** ❌ WRONG
- Layout method: Ceiling(18÷4) × Ceiling(9÷8) = 5 × 2 → **10 sheets** ✅ CORRECT

#### **Step 3: Opening Subtraction**
```javascript
// Subtract openings from gross area BEFORE calculations
const grossWallArea = wallLength * wallHeight
const openingArea = openings.reduce((sum, o) => sum + (o.width * o.height), 0)
const netWallArea = grossWallArea - openingArea
```

#### **Step 4: Dynamic Waste Factor**
```javascript
// Calculate vertical seam complexity
const verticalSeamCount = walls.reduce((sum, wall) => 
  sum + (wall.sheetsAcross - 1), 0
)

// Base waste factor
let wasteFactor = 0.10  // 10% baseline

// Add 2-3% per vertical seam beyond first
const additionalSeams = Math.max(0, verticalSeamCount - walls.length)
wasteFactor += (additionalSeams * 0.025)  // 2.5% per seam

// Apply waste factor
const finalSheetCount = Math.ceil(totalSheets * (1 + wasteFactor))
```

**Why this matters**: A simple room might have 10% waste, but a complex room with 20 vertical seams could need 15-20% waste.

#### **Step 5: Data Output Structure**
```javascript
// Sheet calculator MUST output this data for other calculators
return {
  totalSheets: number,
  sheetsWith Waste: number,
  wasteFactor: number,
  wallDetails: [
    {
      wallId: string,
      sheetsAcross: number,      // ← CRITICAL for screw calc
      sheetsVertical: number,    // ← CRITICAL for screw calc
      netArea: number,
      jointData: {
        horizontal: number,      // ← CRITICAL for tape/mud
        vertical: number         // ← CRITICAL for tape/mud
      }
    }
  ]
}
```

---

## PART 2: MUD CALCULATOR UPGRADE

### Current State Analysis
Must implement GA-214 finish levels with precise two-part calculation.

### Required Workflow

#### **Step 1: Finish Level Selector**
```javascript
const FINISH_LEVELS = {
  0: { name: "Level 0 - Unfinished", skimCoats: 0, description: "Storage areas only" },
  1: { name: "Level 1 - Basic", skimCoats: 0, description: "Taping & fasteners only" },
  2: { name: "Level 2 - Improved", skimCoats: 0, description: "Taping + fills" },
  3: { name: "Level 3 - High Quality", skimCoats: 1, description: "Most residential" },
  4: { name: "Level 4 - Premium", skimCoats: 2, description: "Commercial/high-end" },
  5: { name: "Level 5 - Supreme", skimCoats: 2, description: "Primed for specialty" }
}
```

#### **Step 2: Taping Mud Calculation**
```javascript
// Part 1: Fixed mud for joints and fasteners
// Get total joint linear feet from sheet calculator data
const totalJointFeet = wallDetails.reduce((sum, wall) => {
  const horizontalJoints = (wall.sheetsVertical - 1) * wall.length
  const verticalJoints = (wall.sheetsAcross - 1) * wall.height
  return sum + horizontalJoints + verticalJoints
}, 0)

// Manufacturer data: ProForm 123-140 lbs per 9 gallons
// Use conservative 140 lbs / 9 gal = 15.56 lbs/gal
const MUD_USAGE_PER_FOOT = 0.053  // lbs per linear foot (industry standard)

const tapingMud = totalJointFeet * MUD_USAGE_PER_FOOT  // pounds
```

#### **Step 3: Skim Coat Calculation**
```javascript
// Part 2: Variable mud for skim coats (Levels 3-5 only)
const skimCoatCount = FINISH_LEVELS[selectedLevel].skimCoats

if (skimCoatCount > 0) {
  const SKIM_THICKNESS = 0.0156  // 1/64 inch per coat in feet
  const MUD_DENSITY = 13.89      // lbs per cubic foot (standard)
  
  const skimCoatMud = totalWallArea * SKIM_THICKNESS * skimCoatCount * MUD_DENSITY
  
  totalMud = tapingMud + skimCoatMud
} else {
  totalMud = tapingMud
}
```

#### **Step 4: Output Conversion**
```javascript
// Convert to user-friendly units
const MUD_LBS_PER_GALLON = 13.89

return {
  totalPounds: totalMud,
  totalGallons: totalMud / MUD_LBS_PER_GALLON,
  breakdown: {
    tapingMud: tapingMud,
    skimCoatMud: skimCoatMud,
    finishLevel: selectedLevel,
    jointLinearFeet: totalJointFeet
  }
}
```

---

## PART 3: SCREW CALCULATOR UPGRADE

### Current State Analysis
Must implement IRC Table R702.3.5 code-compliant spacing.

### Required Workflow

#### **Step 1: Code-Compliant Spacing Rules**
```javascript
const FASTENER_SPACING = {
  '1/2_inch_wood_16oc': {
    screwSpacing: 12,     // inches o.c. (IRC mandated)
    nailSpacing: 7,       // inches o.c. (CertainTeed)
    edgeDistance: 0.5     // inches minimum
  },
  '1/2_inch_wood_24oc': {
    screwSpacing: 12,     // Still 12" for crack prevention
    nailSpacing: 7,
    edgeDistance: 0.5
  },
  '5/8_inch_wood_16oc': {
    screwSpacing: 12,
    nailSpacing: 7,
    edgeDistance: 0.5
  },
  '1/2_inch_steel_16oc': {
    screwSpacing: 16,     // ClarkDietrich Type S screws
    screwType: 'Type S',
    edgeDistance: 0.375
  }
}
```

#### **Step 2: Screw Count Formula**
```javascript
// For each wall (using data from sheet calculator)
function calculateScrewsForWall(wall, boardThickness, framingType, framingSpacing) {
  const spacingConfig = FASTENER_SPACING[`${boardThickness}_${framingType}_${framingSpacing}`]
  
  // Screws per stud line (vertical calculation)
  const screwsPerStudLine = Math.ceil(wall.height / (spacingConfig.screwSpacing / 12))
  
  // Number of stud lines (horizontal calculation)
  // This equals the number of sheets across the wall
  const studLines = wall.sheetsAcross
  
  // Total screws for this wall
  const wallScrews = screwsPerStudLine * studLines
  
  return wallScrews
}

// Sum for all walls
const totalScrews = walls.reduce((sum, wall) => 
  sum + calculateScrewsForWall(wall, boardThickness, framingType, framingSpacing), 0
)
```

**Example from Document:**
- 18' wall, 9' high, 5 sheets across
- Screws per line: Ceiling(108÷12) = 9
- Total: 9 × 5 = **45 screws**

#### **Step 3: Variations & Configurations**
```javascript
// User must select these options
const screwCalculatorInputs = {
  boardThickness: '1/2_inch',      // dropdown
  framingMaterial: 'wood',         // dropdown: wood, steel
  framingSpacing: '16oc',          // dropdown: 16oc, 24oc
  fastenerType: 'screws',          // dropdown: screws, nails
  application: 'walls'             // dropdown: walls, ceilings
}
```

---

## PART 4: TAPE CALCULATOR UPGRADE

### Current State Analysis
Simplest calculator but depends entirely on accurate joint calculation.

### Required Workflow

#### **Step 1: Joint Length Calculation**
```javascript
// This data comes from sheet calculator's wall details
function calculateTotalJointLength(wallDetails) {
  let totalHorizontal = 0
  let totalVertical = 0
  
  wallDetails.forEach(wall => {
    // Horizontal joints (bed joints)
    const horizontalJoints = (wall.sheetsVertical - 1) * wall.length
    totalHorizontal += horizontalJoints
    
    // Vertical joints (edge joints)
    const verticalJoints = (wall.sheetsAcross - 1) * wall.height
    totalVertical += verticalJoints
  })
  
  return {
    horizontal: totalHorizontal,
    vertical: totalVertical,
    total: totalHorizontal + totalVertical
  }
}
```

#### **Step 2: Tape Length with Waste**
```javascript
const TAPE_WASTE_FACTOR = 0.05  // 5% for overlap and trimming

const tapeRequired = totalJointLength * (1 + TAPE_WASTE_FACTOR)

return {
  linearFeet: tapeRequired,
  rolls: Math.ceil(tapeRequired / TAPE_ROLL_LENGTH),  // e.g., 250ft rolls
  breakdown: {
    horizontalJoints: horizontalLength,
    verticalJoints: verticalLength,
    wasteFactor: TAPE_WASTE_FACTOR
  }
}
```

**Example from Document:**
- 16' wall, 10' high
- Horizontal: (2-1) × 16 = 16 ft
- Vertical: (4-1) × 10 = 30 ft
- Total: 46 ft
- With waste: 46 × 1.05 = **48.3 ft**

---

## PART 5: CORNER BEAD CALCULATOR UPGRADE

### Required Workflow

#### **Step 1: Corner Type Classification**
```javascript
const CORNER_TYPES = {
  inside: {
    name: "Inside Corners",
    materialType: "paper_tape",     // or mud
    lengthPerCorner: (height) => height
  },
  outside: {
    name: "Outside Corners",
    materialType: "metal_bead",     // or vinyl
    lengthPerCorner: (height) => height
  },
  bullnose: {
    name: "Bullnose Corners",
    materialType: "bullnose_bead",
    lengthPerCorner: (height) => height
  }
}
```

#### **Step 2: Corner Count Input**
```javascript
// User inputs
const corners = {
  insideCorners: 4,      // number
  outsideCorners: 4,     // number
  bullnoseCorners: 0,    // number
  ceilingHeight: 9       // feet
}

// Calculate lengths
const insideLength = corners.insideCorners * corners.ceilingHeight
const outsideLength = corners.outsideCorners * corners.ceilingHeight
const bullnoseLength = corners.bullnoseCorners * corners.ceilingHeight

// Add 5% waste
const CORNER_WASTE = 0.05

return {
  insideCorners: {
    count: corners.insideCorners,
    linearFeet: insideLength * (1 + CORNER_WASTE),
    material: "Paper tape or no bead needed"
  },
  outsideCorners: {
    count: corners.outsideCorners,
    linearFeet: outsideLength * (1 + CORNER_WASTE),
    pieces: Math.ceil(outsideLength / 10),  // 10ft pieces standard
    material: "Metal corner bead"
  }
}
```

---

## PART 6: SUMMARY VIEW UPGRADE

### Required Data Aggregation

#### **Step 1: Consolidated Output Structure**
```javascript
const projectSummary = {
  metadata: {
    projectName: string,
    projectType: 'Residential' | 'Commercial',
    finishLevel: 0-5,
    boardThickness: string,
    totalWalls: number,
    totalArea: number,
    dateCalculated: timestamp
  },
  
  materials: {
    sheets: {
      total: number,
      withWaste: number,
      wasteFactor: number,
      sheetSize: string,
      estimatedCost: number
    },
    
    mud: {
      totalPounds: number,
      totalGallons: number,
      buckets5Gal: number,
      finishLevel: number,
      breakdown: {
        tapingMud: number,
        skimCoatMud: number,
        jointLinearFeet: number
      },
      estimatedCost: number
    },
    
    tape: {
      linearFeet: number,
      rolls: number,
      breakdown: {
        horizontal: number,
        vertical: number
      },
      estimatedCost: number
    },
    
    screws: {
      total: number,
      boxes: number,  // screws per box (e.g., 1000)
      spacing: string,
      type: string,
      estimatedCost: number
    },
    
    cornerBead: {
      inside: { count: number, feet: number },
      outside: { count: number, feet: number, pieces: number },
      estimatedCost: number
    }
  },
  
  totals: {
    subtotal: number,
    tax: number,
    total: number
  },
  
  explanations: {
    // Tooltips for transparency
    sheetsCalculation: "Layout-based method per wall",
    mudCalculation: "GA-214 Level {X} standard",
    screwsCalculation: "IRC Table R702.3.5 - 12\" o.c.",
    tapeCalculation: "Total joint linear footage + 5% waste"
  }
}
```

#### **Step 2: Export Functionality**
```javascript
// PDF generation
function generatePDF(projectSummary) {
  // Include:
  // - Professional formatting
  // - Company logo
  // - Material breakdown table
  // - Cost estimates
  // - Notes section
  // - "How was this calculated?" section
}

// CSV export for procurement
function generateCSV(projectSummary) {
  // Columns:
  // Material, Quantity, Unit, Unit Cost, Total Cost
}

// Save template
function saveAsTemplate(projectSummary) {
  localStorage.setItem(`template_${Date.now()}`, JSON.stringify({
    name: projectSummary.projectName,
    settings: projectSummary.metadata,
    wallConfigs: projectSummary.walls
  }))
}
```

---

## PART 7: UNIT CONVERSION ENGINE

### Critical Implementation Requirements

#### **Step 1: Base Unit System**
```javascript
// ALL internal calculations use base units
const BASE_UNITS = {
  imperial: {
    length: 'inches',           // Never mix feet and inches in calcs
    area: 'square_feet',
    volume: 'gallons',
    weight: 'pounds'
  },
  metric: {
    length: 'millimeters',      // Never mix meters and mm in calcs
    area: 'square_meters',
    volume: 'liters',
    weight: 'kilograms'
  }
}
```

#### **Step 2: Conversion Functions**
```javascript
// Imperial input parsing
function parseImperialLength(input) {
  // Handle: "10'4\"", "10' 4\"", "10ft 4in", "124\"", etc.
  const feetMatch = input.match(/(\d+)(?:'|ft)/i)
  const inchesMatch = input.match(/(\d+)(?:\"|in)/i)
  
  const feet = feetMatch ? parseInt(feetMatch[1]) : 0
  const inches = inchesMatch ? parseInt(inchesMatch[1]) : 0
  
  // Convert to inches (base unit)
  return (feet * 12) + inches
}

// Metric input parsing
function parseMetricLength(input) {
  // Handle: "2.5m", "2500mm", "250cm"
  const metersMatch = input.match(/(\d+\.?\d*)m$/i)
  const mmMatch = input.match(/(\d+)mm$/i)
  const cmMatch = input.match(/(\d+\.?\d*)cm$/i)
  
  let millimeters = 0
  if (metersMatch) millimeters = parseFloat(metersMatch[1]) * 1000
  if (mmMatch) millimeters = parseInt(mmMatch[1])
  if (cmMatch) millimeters = parseFloat(cmMatch[1]) * 10
  
  return millimeters
}
```

#### **Step 3: Conversion Constants**
```javascript
const CONVERSIONS = {
  // Length
  INCH_TO_MM: 25.4,
  FOOT_TO_M: 0.3048,
  
  // Area
  SQFT_TO_SQM: 0.09290304,
  
  // Volume
  GALLON_TO_LITER: 3.78541,
  
  // Weight
  LBS_TO_KG: 0.453592,
  
  // Sheet sizes
  SHEET_4x8_IMPERIAL: { width: 48, height: 96 },        // inches
  SHEET_4x8_METRIC: { width: 1200, height: 2400 },     // mm
  
  SHEET_4x10_IMPERIAL: { width: 48, height: 120 },
  SHEET_4x10_METRIC: { width: 1200, height: 3000 },
  
  SHEET_4x12_IMPERIAL: { width: 48, height: 144 },
  SHEET_4x12_METRIC: { width: 1200, height: 3600 },
  
  // Spacing
  SCREW_SPACING_12_IMPERIAL: 12,      // inches
  SCREW_SPACING_12_METRIC: 300        // mm
}
```

#### **Step 4: Display Formatting**
```javascript
function formatOutput(value, unit, system) {
  if (system === 'imperial') {
    switch(unit) {
      case 'length':
        // Convert inches to feet+inches for display
        const feet = Math.floor(value / 12)
        const inches = value % 12
        return `${feet}' ${inches}"`
      
      case 'area':
        return `${value.toFixed(1)} sq ft`
      
      case 'volume':
        return `${value.toFixed(2)} gallons`
      
      case 'weight':
        return `${value.toFixed(1)} lbs`
    }
  } else {
    switch(unit) {
      case 'length':
        // Convert mm to meters for display
        const meters = value / 1000
        return `${meters.toFixed(2)} m`
      
      case 'area':
        return `${value.toFixed(2)} m²`
      
      case 'volume':
        return `${value.toFixed(2)} L`
      
      case 'weight':
        return `${value.toFixed(1)} kg`
    }
  }
}
```

---

## PART 8: DATA FLOW ARCHITECTURE

### Critical Dependencies

```
┌─────────────────────────────────────────────────────────────┐
│                     SHEET CALCULATOR                         │
│  Input: Wall dimensions, openings                            │
│  Output: sheetsAcross, sheetsVertical, jointData per wall   │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ├──────────────────┬──────────────────┬───────┐
                 ▼                  ▼                  ▼       ▼
        ┌────────────────┐ ┌────────────────┐ ┌────────────┐ │
        │ MUD CALCULATOR │ │ TAPE CALCULATOR│ │   SCREW    │ │
        │ Needs:         │ │ Needs:         │ │ CALCULATOR │ │
        │ - jointData    │ │ - jointData    │ │ Needs:     │ │
        │ - wallArea     │ │                │ │ - sheetsAcross│
        │ - finishLevel  │ │                │ │ - wallHeight│ │
        └────────────────┘ └────────────────┘ └────────────┘ │
                 │                  │                  │       │
                 └──────────────────┴──────────────────┴───────┘
                                    ▼
                         ┌─────────────────────┐
                         │   SUMMARY VIEW      │
                         │   Aggregates all    │
                         │   + Cost estimates  │
                         │   + Export options  │
                         └─────────────────────┘
```

### State Management Structure
```javascript
const calculatorState = {
  // Global settings (from Project Setup)
  settings: {
    projectType: 'Residential' | 'Commercial',
    finishLevel: 0-5,
    boardThickness: '1/2' | '5/8',
    sheetSize: '4x8' | '4x10' | '4x12',
    framingType: 'wood' | 'steel',
    framingSpacing: '16oc' | '24oc',
    unitSystem: 'imperial' | 'metric'
  },
  
  // Wall data (from Room Dimensions)
  walls: [
    {
      id: string,
      length: number,  // base units
      height: number,  // base units
      openings: [...],
      
      // Calculated by sheet calculator
      sheetsAcross: number,
      sheetsVertical: number,
      sheetsTotal: number,
      netArea: number,
      
      // Calculated joint data
      horizontalJoints: number,
      verticalJoints: number
    }
  ],
  
  // Calculated results (auto-computed)
  results: {
    sheets: {...},
    mud: {...},
    tape: {...},
    screws: {...},
    cornerBead: {...}
  }
}
```

---

## PART 9: UI/UX IMPLEMENTATION NOTES

### Calculator Hub Layout
```
┌────────────────────────────────────────────────────────────┐
│  PROJECT: Kitchen Renovation              [Save] [Load]     │
│  ──────────────────────────────────────────────────────────│
│                                                              │
│  ┌─────┬─────┬─────┬─────┬─────┬─────────┐                │
│  │Sheet│ Mud │Tape │Screw│Bead │ Summary │   ← Tabs      │
│  └─────┴─────┴─────┴─────┴─────┴─────────┘                │
│                                                              │
│  [Active Tab Content]                                       │
│                                                              │
│  • Visual feedback on dependencies                          │
│  • Real-time calculations                                   │
│  • Clear formulas with tooltips                            │
│  • "How was this calculated?" links                        │
│                                                              │
└────────────────────────────────────────────────────────────┘
```

### Critical UX Features

1. **Dependency Indicators**
   - Show when data from Sheet Calculator is being used
   - Highlight incomplete inputs
   - Display calculation confidence level

2. **Transparency Tooltips**
   ```javascript
   <InfoIcon tooltip="This uses IRC Table R702.3.5: 12-inch screw spacing for 1/2-inch board on 16-inch centers" />
   ```

3. **Real-time Validation**
   - Check for impossible dimensions
   - Warn about unusual waste factors
   - Flag potential errors

4. **Professional Output**
   - Printable material lists
   - Cost breakdown
   - Notes section for contractor
   - QR code link back to calculator

---

## PART 10: TESTING & VALIDATION

### Test Cases (from Document Examples)

#### Test Case 1: Sheet Calculation Accuracy
```javascript
Input:
  - Wall: 18' × 9'
  - Sheet: 4' × 8'

Expected Output:
  - Sheets Across: 5
  - Sheets Vertical: 2
  - Total Sheets: 10 (NOT 6)

Validation: Layout method vs. area method
```

#### Test Case 2: Screw Count Accuracy
```javascript
Input:
  - Wall: 18' × 9'
  - Sheets Across: 5
  - Spacing: 12" o.c.

Expected Output:
  - Screws per line: 9
  - Total screws: 45

Validation: IRC compliance
```

#### Test Case 3: Tape Length Accuracy
```javascript
Input:
  - Wall: 16' × 10'
  - Sheets: 4 across, 2 vertical

Expected Output:
  - Horizontal: 16 ft
  - Vertical: 30 ft
  - Total: 46 ft
  - With waste: 48.3 ft

Validation: Joint math
```

#### Test Case 4: Mud Calculation by Level
```javascript
Input:
  - Joint Linear Feet: 100 ft
  - Wall Area: 500 sq ft
  - Finish Level: 3

Expected Output:
  - Taping Mud: ~5.3 lbs
  - Skim Coat: ~10.8 lbs
  - Total: ~16.1 lbs (~1.16 gallons)

Validation: GA-214 compliance
```

---

## PART 11: IMPLEMENTATION PRIORITY

### Phase 1: Core Engine (Week 1-2)
1. ✅ Rebuild SheetCalculator with layout-based logic
2. ✅ Implement dynamic waste factor
3. ✅ Create data output structure for dependencies

### Phase 2: Dependent Calculators (Week 3-4)
4. ✅ Upgrade MudCalculator with GA-214 levels
5. ✅ Upgrade ScrewCalculator with IRC compliance
6. ✅ Upgrade TapeCalculator with joint formulas
7. ✅ Upgrade CornerBeadCalculator

### Phase 3: Integration (Week 5)
8. ✅ Connect all calculators via shared state
9. ✅ Implement SummaryView aggregation
10. ✅ Add cost estimation features

### Phase 4: Enhancement (Week 6)
11. ✅ Build unit conversion engine
12. ✅ Add export functionality (PDF, CSV)
13. ✅ Implement template save/load

### Phase 5: Polish (Week 7)
14. ✅ Add tooltips and explanations
15. ✅ Create "How was this calculated?" modals
16. ✅ Professional styling and branding

### Phase 6: Testing (Week 8)
17. ✅ Run all test cases
18. ✅ User testing with contractors
19. ✅ Performance optimization

---

## PART 12: CODE QUALITY STANDARDS

### Formula Documentation
Every calculation must include:
```javascript
/**
 * Calculate screw quantity per IRC Table R702.3.5
 * 
 * @standard IRC 2021 Table R702.3.5
 * @condition 1/2" board, wood studs, 16" o.c.
 * @spacing 12 inches on center (code maximum)
 * 
 * @param {number} wallHeight - Height in inches
 * @param {number} sheetsAcross - From sheet layout calculation
 * @returns {number} Total screw count for wall
 * 
 * @example
 * // 9-foot wall, 5 sheets across
 * calculateScrews(108, 5) // Returns 45
 */
function calculateScrews(wallHeight, sheetsAcross) {
  const SCREW_SPACING = 12  // IRC mandated
  const screwsPerLine = Math.ceil(wallHeight / SCREW_SPACING)
  return screwsPerLine * sheetsAcross
}
```

### Constants File
```javascript
// constants/industry-standards.js

export const ASTM_C840 = {
  description: "Standard Specification for Application and Finishing of Gypsum Board",
  version: "2023"
}

export const GA_214_LEVELS = {
  0: { skimCoats: 0, description: "Unfinished" },
  1: { skimCoats: 0, description: "Taped joints" },
  2: { skimCoats: 0, description: "Taped + filled" },
  3: { skimCoats: 1, description: "Skim coated" },
  4: { skimCoats: 2, description: "Double skim" },
  5: { skimCoats: 2, description: "Primed" }
}

export const IRC_2021_TABLE_R702_3_5 = {
  wood_1_2_inch_16oc: {
    screwSpacing: 12,
    nailSpacing: 7,
    source: "IRC 2021 Table R702.3.5"
  }
}

export const MANUFACTURER_DATA = {
  proform_taping_compound: {
    usageRate: 15.56,  // lbs per gallon (140 lbs / 9 gal)
    source: "National Gypsum ProForm Product Data"
  }
}
```

---

## 🎯 SUCCESS METRICS

### Accuracy Goals
- ✅ Sheet calculations match layout reality (not area approximation)
- ✅ Screw counts comply with IRC spacing requirements
- ✅ Mud quantities align with GA-214 finish standards
- ✅ Tape lengths reflect actual joint footage

### User Experience Goals
- ✅ Calculator produces professional-grade estimates
- ✅ Output can be printed as procurement list
- ✅ Explanations build user confidence
- ✅ Cost estimates help with budgeting

### Technical Goals
- ✅ Zero formula heuristics - all from standards
- ✅ Unit conversion maintains precision
- ✅ Data flows correctly between calculators
- ✅ Export formats suitable for contractors

---

## 📚 REFERENCE IMPLEMENTATION

See complete formulas in:
- `/docs/Heuristic_Guesswork_Summary.md` - Full industry standards analysis
- `/docs/CALCULATOR_HUB_REDESIGN.md` - UI/UX modernization plan
- This document - Complete implementation blueprint

---

**Status**: 📋 **Ready for Implementation**  
**Next Step**: Begin Phase 1 - Core Engine Rebuild  
**Timeline**: 8 weeks to production-grade calculator hub
