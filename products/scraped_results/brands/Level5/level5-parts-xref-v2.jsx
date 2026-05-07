import { useState, useMemo } from "react";

// ─── RETAILER SOURCE DEFINITIONS ────────────────────────────────────────────────
const RETAILERS = {
  WALLTOOLS: {
    id: "WALLTOOLS",
    name: "WallTools.com",
    icon: "🔵",
    color: "#3b82f6",
    bg: "#0a1628",
    note: "Carries Level5, Columbia, TapeTech, Tapepro, Blue Line USA parts — direct parts catalog",
    baseUrl: "https://walltools.com",
    searchUrl: (q) => `https://walltools.com/search.php?search_query=${encodeURIComponent(q)}`,
    partsBrandUrls: {
      "Level5":   "https://walltools.com/automatic-taping-tools/taping-tool-parts-repair-kits-accessories/level-5-parts/",
      "Columbia": "https://walltools.com/automatic-taping-tools/taping-tool-parts-repair-kits-accessories/columbia-taping-tools-parts/",
      "TapeTech": "https://walltools.com/automatic-taping-tools/taping-tool-parts-repair-kits-accessories/tapetech-parts/",
      "Tapepro":  "https://walltools.com/tapepro-parts/",
      "BlueLine": "https://walltools.com/automatic-taping-tools/taping-tool-parts-repair-kits-accessories/blue-line-usa-parts/",
    },
  },
  ALL_WALL: {
    id: "ALL_WALL",
    name: "All-Wall.com",
    icon: "🟠",
    color: "#f97316",
    bg: "#1c0a00",
    note: "TapeTech, Columbia, AMES, Drywall Master, Wal-Board, Graco parts — strong images",
    baseUrl: "https://www.all-wall.com",
    searchUrl: (q) => `https://www.all-wall.com/search?search=${encodeURIComponent(q)}`,
    partsBrandUrls: {
      "TapeTech":       "https://www.all-wall.com/parts/tapetech-taping-tools-parts",
      "Columbia":       "https://www.all-wall.com/parts/columbia-taping-tools-parts",
      "AMES":           "https://www.all-wall.com/parts/AMES-Parts",
      "DrywallMaster":  "https://www.all-wall.com/parts/drywall-master-parts",
    },
  },
  GREAT_LAKES: {
    id: "GREAT_LAKES",
    name: "GreatLakesTapingTools.com",
    icon: "🟢",
    color: "#22c55e",
    bg: "#021008",
    note: "NorthStar, TapeTech, Columbia, Drywall Master, Tapepro parts — deep sub-category catalog",
    baseUrl: "https://greatlakestapingtools.com",
    searchUrl: (q) => `https://greatlakestapingtools.com/search/site/${encodeURIComponent(q)}`,
    partsBrandUrls: {
      "NorthStar":      "https://greatlakestapingtools.com/parts/northstar-parts",
      "TapeTech":       "https://greatlakestapingtools.com/parts/tapetech-parts",
      "Columbia":       "https://greatlakestapingtools.com/parts/columbia-parts",
      "DrywallMaster":  "https://greatlakestapingtools.com/parts/drywall-master-parts",
      "Tapepro":        "https://greatlakestapingtools.com/parts/tapepro-parts",
    },
    subCategoryUrls: {
      "flat-box":        { NorthStar: "https://greatlakestapingtools.com/parts/northstar-parts/northstar-flat-box-parts", TapeTech: "https://greatlakestapingtools.com/parts/tapetech-parts/tapetech-flat-box-parts", Columbia: "https://greatlakestapingtools.com/parts/columbia-parts/columbia-flat-box-parts", DrywallMaster: "https://greatlakestapingtools.com/parts/drywall-master-parts/drywall-master-flat-box-parts", Tapepro: "https://greatlakestapingtools.com/parts/tapepro-parts/tapepro-flat-box-parts" },
      "pump":            { NorthStar: "https://greatlakestapingtools.com/parts/northstar-parts/northstar-pump-parts", TapeTech: "https://greatlakestapingtools.com/parts/tapetech-parts/tapetech-pump-parts", Columbia: "https://greatlakestapingtools.com/parts/columbia-parts/columbia-pump-parts", DrywallMaster: "https://greatlakestapingtools.com/parts/drywall-master-parts/drywall-master-pump-parts", Tapepro: "https://greatlakestapingtools.com/parts/tapepro-parts/tapepro-loading-pump-parts" },
      "auto-taper":      { NorthStar: "https://greatlakestapingtools.com/parts/northstar-parts/northstar-taper-head-parts", TapeTech: "https://greatlakestapingtools.com/parts/tapetech-parts/tapetech-taper-head-parts", Columbia: "https://greatlakestapingtools.com/parts/columbia-parts/columbia-taper-parts", DrywallMaster: "https://greatlakestapingtools.com/parts/drywall-master-parts/drywall-master-taper-parts", Tapepro: "https://greatlakestapingtools.com/parts/tapepro-parts/tapepro-automatic-taper-parts" },
      "handles":         { NorthStar: "https://greatlakestapingtools.com/parts/northstar-parts/northstar-box-handle-parts", TapeTech: "https://greatlakestapingtools.com/parts/tapetech-parts/tapetech-box-handle-parts", Columbia: "https://greatlakestapingtools.com/parts/columbia-parts/columbia-box-handle-parts" },
      "corner-finisher": { TapeTech: "https://greatlakestapingtools.com/parts/tapetech-parts", Columbia: "https://greatlakestapingtools.com/parts/columbia-parts" },
      "corner-applicator":{ NorthStar: "https://greatlakestapingtools.com/parts/northstar-parts", Columbia: "https://greatlakestapingtools.com/parts/columbia-parts" },
      "roller":          { NorthStar: "https://greatlakestapingtools.com/parts/northstar-parts/northstar-corner-roller-parts", TapeTech: "https://greatlakestapingtools.com/parts/tapetech-parts/tapetech-corner-roller-parts", Columbia: "https://greatlakestapingtools.com/parts/columbia-parts/columbia-corner-roller-parts", DrywallMaster: "https://greatlakestapingtools.com/parts/drywall-master-parts/drywall-master-corner-roller-parts" },
      "spotter":         { NorthStar: "https://greatlakestapingtools.com/parts/northstar-parts", TapeTech: "https://greatlakestapingtools.com/parts/tapetech-parts/tapetech-nail-spotter-parts", Columbia: "https://greatlakestapingtools.com/parts/columbia-parts/columbia-nail-spotter-parts", Tapepro: "https://greatlakestapingtools.com/parts/tapepro-parts/tapepro-nail-spotter-parts" },
    },
  },
  CSR: {
    id: "CSR",
    name: "CSRBuilding.com",
    icon: "🔴",
    color: "#ef4444",
    bg: "#1c0000",
    note: "Canadian distributor — Level5, Columbia, Drywall Master, TapePro, Blue Line, TapeTech",
    baseUrl: "https://csrbuilding.com",
    searchUrl: (q) => `https://csrbuilding.com/en-us/search?q=${encodeURIComponent(q)}`,
    partsBrandUrls: {
      "Level5":         "https://csrbuilding.com/en-us/collections/level-5",
      "Columbia":       "https://csrbuilding.com/en-us/collections/columbia",
      "DrywallMaster":  "https://csrbuilding.com/en-us/collections/drywall-master",
      "BlueLine":       "https://csrbuilding.com/en-us/collections/blue-line-usa",
      "TapeTech":       "https://csrbuilding.com/en-us/collections/tapetech",
      "Tapepro":        "https://csrbuilding.com/en-us/collections/tapepro",
    },
  },
};

// ─── BRAND CROSS-REFERENCE MAP (by tool group) ─────────────────────────────────
// Which competitor brands have compatible/identical parts for each Level5 tool group
const GROUP_BRAND_XREF = {
  "auto-taper": {
    label: "Automatic Taper",
    sku: "4-760",
    compatibleBrands: [
      { brand: "TapeTech",      confidence: "HIGH",   note: "TapeTech 60 Taper — same functional architecture, many sub-assembly equivalents" },
      { brand: "Columbia",      confidence: "HIGH",   note: "Columbia AT — direct competitor, shared part geometry on wheel/gooser assemblies" },
      { brand: "NorthStar",     confidence: "HIGH",   note: "NorthStar Taper (made by Great Lakes) — full parts catalog available" },
      { brand: "DrywallMaster", confidence: "MEDIUM", note: "Drywall Master Taper — similar gooser, cutter, and wheel designs" },
      { brand: "Tapepro",       confidence: "MEDIUM", note: "Tapepro Taper — compatible cutter chain and drive assemblies" },
    ],
  },
  "flat-boxes": {
    label: "Flat Boxes",
    sku: "4-764 / 4-765 / 4-766 / 4-770",
    compatibleBrands: [
      { brand: "TapeTech",      confidence: "HIGH",   note: "TapeTech flat boxes — nearly identical pressure plate, wheel, bearing, and blade holder layouts" },
      { brand: "Columbia",      confidence: "HIGH",   note: "Columbia flat boxes — parallel SKU lineup (7/10/12/14in), compatible gaskets/springs/blades" },
      { brand: "NorthStar",     confidence: "HIGH",   note: "NorthStar flat boxes — full parts sub-category catalog at Great Lakes" },
      { brand: "DrywallMaster", confidence: "HIGH",   note: "Drywall Master flat boxes — compatible wheel/axle/blade assemblies" },
      { brand: "Tapepro",       confidence: "MEDIUM", note: "Tapepro flat boxes — compatible blades, pressure plates, and box tires" },
    ],
  },
  "pump": {
    label: "Compound Pump",
    sku: "4-771",
    compatibleBrands: [
      { brand: "TapeTech",      confidence: "HIGH",   note: "TapeTech pump — identical piston cup / u-seal / o-ring design, same pump head architecture" },
      { brand: "Columbia",      confidence: "HIGH",   note: "Columbia pump — compatible piston cups, seals, discharge tube, and valve disc" },
      { brand: "NorthStar",     confidence: "HIGH",   note: "NorthStar pump — full parts catalog, compatible gland and filler body" },
      { brand: "DrywallMaster", confidence: "HIGH",   note: "Drywall Master pump — compatible seals, piston rods, and latches" },
      { brand: "Tapepro",       confidence: "MEDIUM", note: "Tapepro loading pump — compatible o-rings and valve components" },
    ],
  },
  "corner-finisher": {
    label: "Corner Finishers",
    sku: "4-732 / 4-733 / 4-734 / 4-735",
    compatibleBrands: [
      { brand: "TapeTech",      confidence: "HIGH",   note: "TapeTech CF — identical wheel bushing, rubber tire, and locking clip design" },
      { brand: "Columbia",      confidence: "HIGH",   note: "Columbia CF — compatible blades, skids, wheels, and frame tabs" },
      { brand: "NorthStar",     confidence: "MEDIUM", note: "NorthStar CF — compatible wheel and spring components" },
      { brand: "DrywallMaster", confidence: "MEDIUM", note: "Drywall Master CF — compatible spring and wheel sub-assemblies" },
    ],
  },
  "corner-applicator": {
    label: "Corner Applicators",
    sku: "4-701 / 4-702",
    compatibleBrands: [
      { brand: "TapeTech",  confidence: "HIGH",   note: "TapeTech CA — identical valve assembly, valve spring, cone design" },
      { brand: "Columbia",  confidence: "HIGH",   note: "Columbia CA — compatible wiper seal, pressure plate, and valve holder" },
      { brand: "NorthStar", confidence: "MEDIUM", note: "NorthStar CA — compatible cone and pivot bearing" },
    ],
  },
  "roller": {
    label: "Corner Roller",
    sku: "4-707",
    compatibleBrands: [
      { brand: "TapeTech",      confidence: "HIGH",   note: "TapeTech CR — identical roller wheel, bearing, swivel axle design" },
      { brand: "Columbia",      confidence: "HIGH",   note: "Columbia CR — compatible roller bushing and coupling assembly" },
      { brand: "NorthStar",     confidence: "HIGH",   note: "NorthStar CR — full parts catalog available at Great Lakes" },
      { brand: "DrywallMaster", confidence: "MEDIUM", note: "Drywall Master CR — compatible wheel and bearing" },
    ],
  },
  "handles": {
    label: "Tool Handles",
    sku: "4-780 / 4-781 / 4-782 / 4-880 / 4-881",
    compatibleBrands: [
      { brand: "TapeTech",  confidence: "HIGH",   note: "TapeTech extendable handles — near-identical trigger sleeve, locking lever, brake mechanism" },
      { brand: "Columbia",  confidence: "HIGH",   note: "Columbia box handles — compatible trigger spring, shoulder screw, inner tube" },
      { brand: "NorthStar", confidence: "MEDIUM", note: "NorthStar handle parts at Great Lakes" },
    ],
  },
  "spotter": {
    label: "Nail Spotters",
    sku: "4-754 / 4-755",
    compatibleBrands: [
      { brand: "TapeTech",      confidence: "HIGH",   note: "TapeTech nail spotter — compatible gasket, blade, pressure plate assemblies" },
      { brand: "Columbia",      confidence: "HIGH",   note: "Columbia nail spotter — compatible side plates, wheels, and facings" },
      { brand: "NorthStar",     confidence: "HIGH",   note: "NorthStar nail spotter — full parts catalog at Great Lakes" },
      { brand: "Tapepro",       confidence: "MEDIUM", note: "Tapepro nail spotter parts at Great Lakes" },
    ],
  },
  "minishot": {
    label: "MiniShot Compound Tube",
    sku: "4-772",
    compatibleBrands: [
      { brand: "TapeTech",  confidence: "MEDIUM", note: "TapeTech tube — compatible o-rings, u-cups, cone springs" },
      { brand: "Columbia",  confidence: "MEDIUM", note: "Columbia compound tube — compatible plunger cup and valve components" },
    ],
  },
  "tube": {
    label: "Compound Tube",
    sku: "4-741",
    compatibleBrands: [
      { brand: "TapeTech",  confidence: "MEDIUM", note: "TapeTech compound tube — o-ring and u-cup equivalents" },
      { brand: "Columbia",  confidence: "MEDIUM", note: "Columbia tube — compatible cone assembly and plunger design" },
    ],
  },
};

// ─── STANDARD PART CLASSIFIER ───────────────────────────────────────────────────
const STANDARD_PATTERNS = [
  { re: /\b(4-40|6-32|8-32|10-32|3-48|1\/4-20|5\/16|3\/8-16|5\/16-24|5\/16-18)\s*(x|X)\s*[\d\/\.]+/i, type: "FASTENER", sub: "Screw / Bolt" },
  { re: /(fillister|bind head|flat head|hex head|pan head|socket head|round head|bhc|shc|flh|rhms|fh|bh|th)\s*(screw|bolt)/i, type: "FASTENER", sub: "Screw / Bolt" },
  { re: /(set\s*screw)/i, type: "FASTENER", sub: "Set Screw" },
  { re: /(lock\s*nut|hex\s*nut|thin.*nut|castle\s*nut|miniature.*nut|lock\s*hex)/i, type: "FASTENER", sub: "Nut" },
  { re: /(wing\s*nut)/i, type: "FASTENER", sub: "Wing Nut" },
  { re: /(nylon\s*lock|nylock|t-nut|tnut)/i, type: "FASTENER", sub: "Lock Nut / T-Nut" },
  { re: /(thumb\s*screw)/i, type: "FASTENER", sub: "Thumb Screw" },
  { re: /(brass\s*washer|#\d+\s*brass)/i, type: "WASHER", sub: "Brass Washer" },
  { re: /(lock\s*washer|lockwasher|spring\s*washer)/i, type: "WASHER", sub: "Lock Washer" },
  { re: /(flat\s*washer|ss\s*flat|metal.*washer|plastic.*washer)/i, type: "WASHER", sub: "Flat Washer" },
  { re: /\b(washer)\b/i, type: "WASHER", sub: "Washer" },
  { re: /(nyliner|nyliner\s*bearing)/i, type: "BEARING", sub: "Nyliner Bushing" },
  { re: /(bearing\s*5l7d|ball\s*bearing|pivot\s*bearing)/i, type: "BEARING", sub: "Ball Bearing" },
  { re: /(bushing|plastic\s*bearing|collar\s*bushing|bushing\s*liner)/i, type: "BEARING", sub: "Bushing" },
  { re: /(spring)/i, type: "SPRING", sub: "Spring" },
  { re: /(o.?ring|o'\s*ring)/i, type: "SEAL", sub: "O-Ring" },
  { re: /(u-seal|u-cup|plunger\s*cup|gasket|wiper\s*seal)/i, type: "SEAL", sub: "Seal / Cup / Gasket" },
  { re: /(cotter\s*pin)/i, type: "PIN", sub: "Cotter Pin" },
  { re: /(s-hook|key\s*ring)/i, type: "HARDWARE", sub: "S-Hook / Key Ring" },
  { re: /(quick\s*release\s*pin|roll\s*pin|spring\s*pin)/i, type: "PIN", sub: "Pin" },
];

function classifyPart(description) {
  for (const p of STANDARD_PATTERNS) {
    if (p.re.test(description)) return { type: p.type, sub: p.sub, standard: true };
  }
  return { type: "PROPRIETARY", sub: "Proprietary / OEM Part", standard: false };
}

// ─── BUILD SEARCH URLS ──────────────────────────────────────────────────────────
function buildSearchUrls(description, partNumber, classification, groupSlug) {
  const q = encodeURIComponent(description);
  const urls = [];

  // ── Retailer-specific: competitor brand part pages by group ──
  const grp = GROUP_BRAND_XREF[groupSlug];
  if (grp) {
    const glSubs = RETAILERS.GREAT_LAKES.subCategoryUrls[groupSlug] || {};

    // Great Lakes — sub-category level links
    Object.entries(glSubs).forEach(([brand, url]) => {
      urls.push({
        retailer: "GREAT_LAKES",
        label: `Great Lakes → ${brand}`,
        url,
        priority: "HIGH",
        note: `${brand} ${grp.label} parts — find equivalent of: ${description}`,
      });
    });

    // WallTools brand pages
    grp.compatibleBrands.forEach(({ brand, confidence }) => {
      const url = RETAILERS.WALLTOOLS.partsBrandUrls[brand];
      if (url) urls.push({
        retailer: "WALLTOOLS",
        label: `WallTools → ${brand}`,
        url: url + `?search=${q}`,
        priority: confidence,
        note: `Search ${brand} parts on WallTools for: ${description}`,
      });
    });

    // All-Wall brand pages
    grp.compatibleBrands.forEach(({ brand, confidence }) => {
      const url = RETAILERS.ALL_WALL.partsBrandUrls[brand];
      if (url) urls.push({
        retailer: "ALL_WALL",
        label: `All-Wall → ${brand}`,
        url,
        priority: confidence,
        note: `${brand} parts on All-Wall for: ${description}`,
      });
    });

    // CSR Building
    grp.compatibleBrands.forEach(({ brand, confidence }) => {
      const url = RETAILERS.CSR.partsBrandUrls[brand];
      if (url) urls.push({
        retailer: "CSR",
        label: `CSR → ${brand}`,
        url,
        priority: confidence === "HIGH" ? "MEDIUM" : "LOW",
        note: `${brand} parts at CSR Building (Canadian distributor)`,
      });
    });
  }

  // ── Sitewide search on all 4 retailers ──
  urls.push({ retailer: "WALLTOOLS",   label: "WallTools Search",   url: RETAILERS.WALLTOOLS.searchUrl(description),   priority: "MEDIUM", note: "Sitewide search on WallTools" });
  urls.push({ retailer: "ALL_WALL",    label: "All-Wall Search",    url: RETAILERS.ALL_WALL.searchUrl(description),    priority: "MEDIUM", note: "Sitewide search on All-Wall" });
  urls.push({ retailer: "GREAT_LAKES", label: "Great Lakes Search", url: RETAILERS.GREAT_LAKES.searchUrl(description), priority: "MEDIUM", note: "Sitewide search on Great Lakes" });
  urls.push({ retailer: "CSR",         label: "CSR Search",         url: RETAILERS.CSR.searchUrl(description),         priority: "LOW",    note: "Sitewide search on CSR Building" });

  // ── Standard hardware backup sources ──
  if (classification.standard) {
    urls.push({ retailer: "MCMASTER", label: "McMaster-Carr",  url: `https://www.mcmaster.com/#${q}`, priority: "HIGH", note: "Best for standard hardware — white-bg multi-angle images" });
    urls.push({ retailer: "GRAINGER", label: "Grainger",       url: `https://www.grainger.com/search?searchQuery=${q}`, priority: "HIGH", note: "Industrial supplier with clean product photos" });
    urls.push({ retailer: "FASTENAL", label: "Fastenal",       url: `https://www.fastenal.com/products/details/${partNumber}?search=${q}`, priority: "MEDIUM", note: "Fastenal already cross-referenced in Level5 catalog" });
  }

  return urls;
}

// ─── PARSE MANIFEST ─────────────────────────────────────────────────────────────
const RAW_SCHEMATICS = [
  { group_slug:"auto-taper",       group_name:"Automatic Taper",         compatible_skus:["4-760"],       parts:[{pn:"7094",d:"Spring Drive Dog"},{pn:"7269",d:"Drive Dog Body"},{pn:"7060",d:"Drive Dog Screw 8-32"},{pn:"7116",d:"1/16 x 1/2in Cotter Pin Fastenal 74268",price:"$1.79"},{pn:"7100",d:"Cable Drum Shaft"},{pn:"7089",d:"Drive dog roller"},{pn:"7047",d:"4-40 x3/16 Bind Head Screw"},{pn:"7077",d:"Taper Wheel"},{pn:"7090",d:"Drive hub"},{pn:"7078",d:"Taper Wheel Spool"},{pn:"7070",d:"8-32 x 1/4 FH Screw"},{pn:"7042",d:"6-32X3/16 Fillister Head Screw"},{pn:"7041",d:"Gooser Needle Holder"},{pn:"7023",d:"Gooser Body"},{pn:"7019",d:"Needle Spring"},{pn:"7025",d:"Magnet Assembly"},{pn:"7030",d:"4-40 x 1/4 Bind Head Screw"},{pn:"7031",d:"#4 Lock Washer"},{pn:"7010",d:"6-32 x 5/16 Round Head Screw"},{pn:"7022",d:"Needle Holder Lock"},{pn:"7040",d:"Needle Gooser"},{pn:"7332",d:"Cutter Chain without Spring"},{pn:"7136",d:"4-40 x 6.3MM FLH Screw, Phillips"},{pn:"7111",d:"Pyramid Blade"},{pn:"7112",d:"Cutter Block Clamp"},{pn:"9108",d:"Cutter Chain Spring"},{pn:"7054",d:"Key Ring"},{pn:"9917",d:"AT Key Ring Holder"},{pn:"7177",d:"#10 Brass Washer"},{pn:"9916",d:"AT Wing Nut"},{pn:"7034",d:"Disengaging Rod Bearing"},{pn:"7033",d:"O'Ring"},{pn:"7032",d:"O'Ring Housing"},{pn:"7045",d:"Cover Plate"},{pn:"7126",d:"4-40 x 5/16 BH Screw- Fastenal 70657",price:"$1.79"},{pn:"7017",d:"6-32 x 3/8 Bind Head Screw"},{pn:"7029",d:"Bracket Base"},{pn:"7014",d:"Collar Bushing"},{pn:"7016",d:"Disengaging Cam"},{pn:"7015",d:"#6-32 Thin Pattern Locknut"},{pn:"7028",d:"Disengaging Rod (shaft)"},{pn:"7248",d:"4-40 Lock Nut"},{pn:"9082",d:"New Style Taper Head"},{pn:"9665",d:"Right Side Plate- Taper"},{pn:"7092",d:"Cutter Block Tube"},{pn:"7037",d:"Chain Roller Support (Right)"},{pn:"9125",d:"Cutter Chain Bushing (metal) Taper"},{pn:"9122",d:"Cutter Chain Roller (white) Taper"},{pn:"7020",d:"Chain Keeper"},{pn:"7096",d:"Taper Filler Tube Assembly"},{pn:"7051",d:"Valve Spring"},{pn:"7053",d:"Valve Assembly"},{pn:"7039",d:"Baffle Plate Assembly"},{pn:"9061",d:"AT Taper Runner"},{pn:"7063",d:"Bearing Nyliner"},{pn:"7005",d:"Lock Roller Assembly (Brake)"},{pn:"7035",d:"Anvil"},{pn:"9007",d:"Roller Axle Spring (Brake Pin)"},{pn:"9912",d:"AT Brake Pin Holder"},{pn:"9914",d:"AT Washer"},{pn:"9915",d:"AT Brake Adjuster"},{pn:"7119",d:"Nyliner Bearing-Straight"},{pn:"7322",d:"Bearing"},{pn:"7083",d:"Tape Guide Assembly"},{pn:"7081",d:"Bushing Head"},{pn:"7071",d:"Bushing, Head"},{pn:"7344",d:"Taper Head Assembly"}] },
  { group_slug:"flat-boxes",        group_name:"Flat Boxes",               compatible_skus:["4-764","4-765","4-766","4-770","4-767","4-768","4-769"], parts:[{pn:"7207",d:"7in Flat Box Blade"},{pn:"7208",d:"7in Blade Holder Assembly"},{pn:"7217",d:"#4-40 x 1/4 Fillister Head Screw"},{pn:"9219",d:"Flat box Screw (#4)"},{pn:"9285",d:"7in Blade Holder Bracket"},{pn:"7241",d:"7in Front Plate"},{pn:"7015",d:"#6-32 Thin Pattern Locknut"},{pn:"9613",d:"FB Washer"},{pn:"7792",d:"Latch"},{pn:"7798",d:"Spring Washer"},{pn:"7793",d:"Shoulder Screw"},{pn:"7255",d:"Std Left Side Plate"},{pn:"7224",d:"Repair Clip"},{pn:"7239",d:"Skid Cover Left Side Universal"},{pn:"7012",d:"#6-32 x 1/4 Fillister Head"},{pn:"7349",d:"Hinged Flat Box Screw"},{pn:"7226",d:"7in Bottom Plate"},{pn:"8302",d:"#10-32 Lock Nut"},{pn:"7177",d:"#10 Brass Washer"},{pn:"7063",d:"Bearing Nyliner"},{pn:"8301",d:"#10-32 Hex Head Shoulder Screw"},{pn:"7119",d:"Nyliner Bearing-Straight"},{pn:"9685",d:"FB Box Tire"},{pn:"9719",d:"FB Box Wheel, Black"},{pn:"7281",d:"7in Flat Box Axle"},{pn:"7178",d:"#14 Brass Washer"},{pn:"9237",d:"FB Bolt (holds axle on)"},{pn:"7380",d:"7in Rubber Hinge Pin Shim"},{pn:"7256",d:"Stnd Right Side Plate"},{pn:"7212",d:"Skid Cover Rt Side, Universal"},{pn:"7388",d:"Pivot for Box Plate Hinge"},{pn:"7394",d:"7in Hinged Pressure Plate"},{pn:"8306",d:"Pressure Plate Nut"},{pn:"8232",d:"T-Nut"},{pn:"8303",d:"#10-32 X 1in SHC Screw"},{pn:"8273",d:"Pressure Plate Ext. Spring"},{pn:"9273",d:"Lightweight Pressure Plate Spring"},{pn:"8305",d:"Spring Anchor"},{pn:"8291",d:"8-32 X 3/8, BHC Screw"},{pn:"7390",d:"7in Hinged Flat Box Gasket"},{pn:"7251",d:"Dial Assembly"},{pn:"7216",d:"Crown Spring"},{pn:"7223",d:"Dial Adjustment Nut"},{pn:"7213",d:"Brass Pins"},{pn:"7254",d:"10in Flat Box Blade"},{pn:"7267",d:"10in Blade Holder Assembly"},{pn:"9268",d:"10in Blade Holder Bracket"},{pn:"7242",d:"10in Front Plate"},{pn:"7280",d:"10in Flat Box Axle"},{pn:"7381",d:"10in Rubber Hinge Pin Shim"},{pn:"7395",d:"10in HInged Pressure Plate"},{pn:"7391",d:"10in Hinged Flat Box Gasket"},{pn:"7270",d:"12in Flat Box Blade"},{pn:"7284",d:"12in Blade Holder Assembly"},{pn:"9270",d:"12in Blade Holder Bracket"},{pn:"7243",d:"12in Front Plate"},{pn:"7282",d:"12in Flat Box Axle"},{pn:"7382",d:"12in Rubber Hing Pin Shim"},{pn:"7396",d:"12in Hinged Pressure Plate"},{pn:"7392",d:"12in Hinged Flat Box Gasket"},{pn:"7275",d:"12/14in Crown Spring"},{pn:"7273",d:"14in Flat Box Blade"},{pn:"7274",d:"14in Blade Holder Assembly"},{pn:"7552",d:"14in Blade Holder Bracket"},{pn:"7244",d:"14in Front Plate"},{pn:"7278",d:"14in Axle"},{pn:"7383",d:"14in Rubber Hinge Pin Sham"},{pn:"7397",d:"14in Hinged Pressure Plate"},{pn:"7393",d:"14in Hinged Flat Box Gasket"},{pn:"7630",d:"Hinged Flat Box Plastic Washer"}] },
  { group_slug:"pump",              group_name:"Compound Pump",            compatible_skus:["4-771"],       parts:[{pn:"9751",d:"Pump Foot Bracket"},{pn:"7550",d:"Wrench"},{pn:"7364",d:"1/4-20 Lock Nut"},{pn:"9334",d:"Pump Link"},{pn:"7553",d:"Black Plastic Washer (Link)"},{pn:"7555",d:"Metal Link Washer"},{pn:"7363",d:"1/4-20x2 Hex Head Screw"},{pn:"7622",d:"Quick Release Pin"},{pn:"7347",d:"Handle Ball"},{pn:"7128",d:"Pumpball Screw"},{pn:"7633",d:"Pump O-Ring"},{pn:"9635",d:"Pump Head"},{pn:"7324",d:"U-Seal"},{pn:"7323",d:"Gland"},{pn:"7345",d:"Bushing Liner"},{pn:"7362",d:"Gasket"},{pn:"7355",d:"Filler Body"},{pn:"7168",d:"S-Hook"},{pn:"7329",d:"Valve Disc"},{pn:"7328",d:"Piston Cups"},{pn:"7360",d:"Lock Clip"},{pn:"9623",d:"New pump latches"},{pn:"9916",d:"AT Wing Nut"},{pn:"7556",d:"Metal Washer"},{pn:"7557",d:"Foot Valve Spacer"},{pn:"9330",d:"Pump Tube Foot"},{pn:"9348",d:"Screen for New Pump"},{pn:"7321",d:"Piston Rod"},{pn:"9624",d:"Pump Tube"},{pn:"7356",d:"Discharge Tube"}] },
  { group_slug:"corner-finisher",   group_name:"Corner Finishers",         compatible_skus:["4-732","4-733","4-734","4-735"], parts:[{pn:"9510",d:"CF Screw 6-32x15"},{pn:"9511",d:"CF SS Flat Washer"},{pn:"9512",d:"CF Rubber Tire"},{pn:"9513",d:"CF Wheel Bushing"},{pn:"9514",d:"Finisher Wheels"},{pn:"9192",d:"CF Bottom Clip 2.5in & 3in"},{pn:"9702",d:"CF 2.5in Body"},{pn:"9714",d:"CF 2.5in Left Frame"},{pn:"9189",d:"CF 2.5in and 3in Skid"},{pn:"9706",d:"CF 2.5in Blade"},{pn:"7741",d:"CF Ball Locking Clip"},{pn:"7740",d:"CF Lock Clip Spring"},{pn:"7742",d:"CF Locking Clip Tab"},{pn:"7183",d:"Insert Socket"},{pn:"9708",d:"CF 2.5in Right Frame"},{pn:"9807",d:"CF 3.5in Body"},{pn:"9803",d:"CF 3.5in Left Frame"},{pn:"9525",d:"CF 3.5in & 4in Skids"},{pn:"9815",d:"CF 3.5in Blade"},{pn:"9501",d:"Spring Tension Pin -CF"},{pn:"9522",d:"CF Spring (Small)"},{pn:"9523",d:"CF 3.5in Spring (Big)"},{pn:"9817",d:"CF 3.5in Right Frame"},{pn:"7546",d:"4in CF Body"},{pn:"7544",d:"4in CF Left Frame"},{pn:"9816",d:"4in Blade-Corner Finisher"},{pn:"9526",d:"4in Small Spring- CF"},{pn:"9527",d:"4in Large Spring - CF"},{pn:"7545",d:"4in Right Frame"},{pn:"9183",d:"CF 3in Body"},{pn:"9193",d:"CF 3in Left Frame"},{pn:"9188",d:"CF 3in Blade"},{pn:"9524",d:"CF 2.5in Spring"},{pn:"9194",d:"CF 3in Right Frame"},{pn:"7190",d:"CF Slotted Screw 8-32 x 6.35"}] },
  { group_slug:"corner-applicator", group_name:"Corner Applicators",       compatible_skus:["4-701","4-702"], parts:[{pn:"9317",d:"C.A. Cone"},{pn:"7520",d:"02 Rubber"},{pn:"9318",d:"7in Applicator Pressure Plate"},{pn:"7378",d:"5/16 - 18 3/4 Thumbscrew, SS"},{pn:"7409",d:"Bearing, 5L7D-642"},{pn:"9315",d:"Pivot Bearing"},{pn:"9314",d:"Corner Applicator Bracket"},{pn:"9312",d:"Wiper Seal 7in"},{pn:"7053",d:"Valve Assembly"},{pn:"7414",d:"Valve Sleeve"},{pn:"7051",d:"Valve Spring"},{pn:"8316",d:"Valve Holder"},{pn:"9319",d:"8in Applicator Pressure Plate"},{pn:"9313",d:"8in App. Gasket"},{pn:"8310",d:"7in Applicator Body"},{pn:"8311",d:"8in Applicator Body"}] },
  { group_slug:"roller",            group_name:"Corner Roller",            compatible_skus:["4-707"],       parts:[{pn:"7203",d:"1/4-20x1-1/4in HH Screw"},{pn:"7178",d:"#14 Brass Washer"},{pn:"7225",d:"Roller Wheel"},{pn:"7409",d:"Bearing, 5L7D-642"},{pn:"7202",d:"Roller Bushing"},{pn:"7221",d:"Washer"},{pn:"7200",d:"Trust Washer"},{pn:"7069",d:"8-32 x 5/16 Setscrew"},{pn:"7421",d:"Corner Roller Body"},{pn:"7199",d:"Swivel Coupling Pin"},{pn:"7206",d:"Swivel Axle"},{pn:"7204",d:"Swivel Assembly"},{pn:"7205",d:"Coupling"},{pn:"7116",d:"1/16 x 1/2in Cotter Pin Fastenal 74268"}] },
  { group_slug:"handles",           group_name:"Tool Handles",             compatible_skus:["4-780","4-781","4-782","4-880","4-881"], parts:[{pn:"8400",d:"Trigger Sleeve"},{pn:"8186",d:"Shoulder Screw"},{pn:"8510",d:"Trigger Spring"},{pn:"8183",d:"Locking Lever"},{pn:"8405",d:"Ext. Handle Lever"},{pn:"8302",d:"#10-32 Lock Nut"},{pn:"8210",d:"Connecting Rod Pin"},{pn:"8215",d:"Brake Handle Plastic Bushing"},{pn:"8511",d:"Brake Mechanism"},{pn:"8518",d:"Inner Casing"},{pn:"9212",d:"Ext. Box Handle Head"},{pn:"7063",d:"Bearing Nyliner"},{pn:"8700",d:"Drive Dog Set Screw - SS 8-32 x 3/16in"},{pn:"9208",d:"EH- Connector Plate"},{pn:"9903",d:"Head Connector"},{pn:"9904",d:"EH-Small Pivot Pin"},{pn:"7470",d:"Handle Connector"},{pn:"7469",d:"Handle End"},{pn:"8801",d:"Long Gray Tube"},{pn:"8800",d:"Short Gray Tube"},{pn:"8422",d:"Top Rod 62in"},{pn:"8432",d:"Inner Tube for 4-780"}] },
  { group_slug:"spotter",           group_name:"Nail Spotters",            compatible_skus:["4-754","4-755"], parts:[{pn:"7940",d:"NS Left Side Plate"},{pn:"7941",d:"2in NS Rubber Shim"},{pn:"7942",d:"3in NS Rubber Shim"},{pn:"7943",d:"NS Spring Anchor"},{pn:"7944",d:"NS Rubber Tire"},{pn:"7945",d:"NS Wheel"},{pn:"7946",d:"2in NS Kick Plate"},{pn:"7947",d:"3in NS Kick Plate"},{pn:"7948",d:"2in NS Wheel Axle"},{pn:"7949",d:"3in NS Wheel Axle"},{pn:"7950",d:"2in NS Bottom Plate"},{pn:"7951",d:"3in NS Bottom Plate"},{pn:"7952",d:"Nail Spotter Washer"},{pn:"7953",d:"2in NS Pressure Plate"},{pn:"7954",d:"3in NS Pressure Plate"},{pn:"7956",d:"Nail Spotter Pivot"},{pn:"7957",d:"NS Right Side Plate"},{pn:"7959",d:"NS Handle Attachment"},{pn:"7961",d:"NS Clamp Roll PIn"},{pn:"7962",d:"NS Thumb Screw"},{pn:"7963",d:"NS Tension Clamp"},{pn:"7965",d:"NS Spring"},{pn:"7966",d:"2in NS Gasket"},{pn:"7967",d:"3in NS Gasket"},{pn:"7969",d:"2in NS Blade Bracket"},{pn:"7970",d:"3in NS Blade Bracket"},{pn:"7971",d:"2in NS Blade"},{pn:"7972",d:"3in NS Blade"},{pn:"7973",d:"2in NS Facing"},{pn:"7974",d:"3in NS Facing"},{pn:"7975",d:"2in NS Front Plate"},{pn:"7976",d:"3in NS Front Plate"}] },
  { group_slug:"minishot",          group_name:"MiniShot Compound Tube",   compatible_skus:["4-772"],       parts:[{pn:"DXTT-1101",d:"Extension O'Ring"},{pn:"DXTT-1109",d:"U-Cup"},{pn:"DXTT-1117",d:"Top Cone O'Ring"},{pn:"DXTT-1118",d:"Filler Valve Stem"},{pn:"DXTT-1119",d:"Filler Valve Outlet"},{pn:"DXTT-1120",d:"Filler Spring"},{pn:"DXTT-1127",d:"Valve Stem"},{pn:"DXTT-1130",d:"Nozzle Assembly"},{pn:"DXTT-1132",d:"Plunger U-Cup"},{pn:"8133",d:"Plastic Plunger"},{pn:"8134",d:"Red Piston Rod"},{pn:"8137",d:"Gas Cylinder"},{pn:"DXTT-1138",d:"Cone Spring"},{pn:"8125",d:"Top Cone"},{pn:"9623",d:"New pump latches"},{pn:"8113",d:"Clear Tube"},{pn:"DXTT-1108",d:"Base"}] },
  { group_slug:"tube",              group_name:"Compound Tube",            compatible_skus:["4-741"],       parts:[{pn:"7910",d:"Cone Assembly w/Ball"},{pn:"7911",d:"Cone O'Ring"},{pn:"7913",d:"Metal Band"},{pn:"7914",d:"Latch"},{pn:"7916",d:"Band Connector"},{pn:"7917",d:"Outer Tube"},{pn:"7918",d:"Stopper O'Ring"},{pn:"7922",d:"Plunger Cup"},{pn:"7923",d:"Plastic Plunger"},{pn:"7925",d:"Red Plunger Tube"},{pn:"7928",d:"Spade Handle"}] },
];

function buildAllParts() {
  const map = new Map();
  RAW_SCHEMATICS.forEach(s => {
    s.parts.forEach(p => {
      if (!p.pn || map.has(p.pn)) return;
      const cls = classifyPart(p.d);
      map.set(p.pn, {
        part_number: p.pn,
        description: p.d,
        group_slug: s.group_slug,
        group_name: s.group_name,
        compatible_skus: s.compatible_skus,
        classification: cls,
        searchUrls: buildSearchUrls(p.d, p.pn, cls, s.group_slug),
      });
    });
  });
  return Array.from(map.values());
}

// ─── UI CONSTANTS ───────────────────────────────────────────────────────────────
const TYPE_META = {
  FASTENER:    { color: "#22d3ee", bg: "#071520", label: "Fastener",  icon: "🔩" },
  WASHER:      { color: "#a78bfa", bg: "#120a20", label: "Washer",    icon: "⬤"  },
  BEARING:     { color: "#fb923c", bg: "#1a0a00", label: "Bearing",   icon: "⚙️" },
  SPRING:      { color: "#4ade80", bg: "#051208", label: "Spring",    icon: "〰️" },
  SEAL:        { color: "#f472b6", bg: "#1a0510", label: "Seal/O-Ring", icon: "◯" },
  PIN:         { color: "#fbbf24", bg: "#1a1000", label: "Pin",       icon: "📌" },
  HARDWARE:    { color: "#94a3b8", bg: "#0a0e14", label: "Hardware",  icon: "🔧" },
  PROPRIETARY: { color: "#ef4444", bg: "#150303", label: "Proprietary", icon: "🏭" },
};

const RETAILER_META = {
  WALLTOOLS:   { color: "#3b82f6", label: "WallTools" },
  ALL_WALL:    { color: "#f97316", label: "All-Wall" },
  GREAT_LAKES: { color: "#22c55e", label: "Great Lakes" },
  CSR:         { color: "#ef4444", label: "CSR" },
  MCMASTER:    { color: "#22d3ee", label: "McMaster" },
  GRAINGER:    { color: "#a78bfa", label: "Grainger" },
  FASTENAL:    { color: "#fbbf24", label: "Fastenal" },
};

const CONF_COLOR = { HIGH: "#22c55e", MEDIUM: "#fbbf24", LOW: "#6b7280" };

// ─── COMPONENTS ─────────────────────────────────────────────────────────────────

function RetailerBadge({ retailerId }) {
  const m = RETAILER_META[retailerId] || { color: "#94a3b8", label: retailerId };
  return (
    <span style={{
      background: m.color + "18",
      color: m.color,
      border: `1px solid ${m.color}40`,
      borderRadius: 3,
      padding: "1px 5px",
      fontSize: 9,
      fontWeight: 800,
      letterSpacing: "0.08em",
      fontFamily: "monospace",
    }}>{m.label}</span>
  );
}

function LinkChip({ url }) {
  const m = RETAILER_META[url.retailer] || { color: "#94a3b8" };
  return (
    <a
      href={url.url}
      target="_blank"
      rel="noreferrer"
      title={url.note}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "4px 9px",
        borderRadius: 4,
        fontSize: 10.5,
        fontWeight: 700,
        textDecoration: "none",
        background: m.color + "12",
        color: m.color,
        border: `1px solid ${m.color}35`,
        fontFamily: "monospace",
        letterSpacing: "0.02em",
        transition: "background 0.12s",
      }}
    >
      <span style={{ fontSize: 8, color: CONF_COLOR[url.priority] }}>●</span>
      {url.label}
    </a>
  );
}

function BrandXrefPanel({ groupSlug }) {
  const xref = GROUP_BRAND_XREF[groupSlug];
  if (!xref) return null;
  return (
    <div style={{ padding: "10px 14px 14px", borderTop: "1px solid #1a2030" }}>
      <div style={{ color: "#64748b", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
        Compatible / Identical Parts From Other Brands
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {xref.compatibleBrands.map((b, i) => (
          <div key={i} style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            padding: "7px 10px",
            background: "#0a0e17",
            borderRadius: 4,
            border: `1px solid ${CONF_COLOR[b.confidence]}25`,
          }}>
            <span style={{
              minWidth: 14,
              height: 14,
              marginTop: 1,
              borderRadius: "50%",
              background: CONF_COLOR[b.confidence],
              display: "inline-block",
              flexShrink: 0,
            }}/>
            <div>
              <span style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 12, marginRight: 8 }}>{b.brand}</span>
              <span style={{ color: CONF_COLOR[b.confidence], fontSize: 9, fontWeight: 700, letterSpacing: "0.06em" }}>{b.confidence} COMPATIBILITY</span>
              <div style={{ color: "#64748b", fontSize: 11, marginTop: 2 }}>{b.note}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PartRow({ part, expanded, onToggle }) {
  const m = TYPE_META[part.classification.type] || TYPE_META.HARDWARE;

  // Group URLs by retailer
  const byRetailer = {};
  part.searchUrls.forEach(u => {
    if (!byRetailer[u.retailer]) byRetailer[u.retailer] = [];
    byRetailer[u.retailer].push(u);
  });

  // Deduplicate by label
  const seen = new Set();
  const dedupedUrls = part.searchUrls.filter(u => {
    if (seen.has(u.label)) return false;
    seen.add(u.label);
    return true;
  });

  return (
    <div style={{
      background: expanded ? "#0c1020" : "#080b14",
      border: `1px solid ${expanded ? m.color + "45" : "#111827"}`,
      borderRadius: 5,
      marginBottom: 5,
      overflow: "hidden",
    }}>
      <div
        onClick={onToggle}
        style={{
          display: "grid",
          gridTemplateColumns: "86px 1fr 90px 60px",
          gap: 10,
          alignItems: "center",
          padding: "9px 14px",
          cursor: "pointer",
        }}
      >
        <span style={{ fontFamily: "monospace", color: "#fbbf24", fontSize: 11, fontWeight: 700 }}>
          {part.part_number}
        </span>
        <span style={{ color: "#cbd5e1", fontSize: 12 }}>{part.description}</span>
        <span style={{
          background: m.bg,
          color: m.color,
          border: `1px solid ${m.color}40`,
          borderRadius: 3,
          padding: "2px 6px",
          fontSize: 9,
          fontWeight: 800,
          letterSpacing: "0.06em",
          fontFamily: "monospace",
          textAlign: "center",
        }}>{m.icon} {part.classification.sub}</span>
        <span style={{ color: "#334155", fontSize: 10, textAlign: "right" }}>
          {expanded ? "▲" : "▼"}
        </span>
      </div>

      {expanded && (
        <>
          {/* Brand cross-reference for this group */}
          <BrandXrefPanel groupSlug={part.group_slug} />

          <div style={{ padding: "0 14px 14px" }}>
            <div style={{ color: "#334155", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8, marginTop: 4 }}>
              Direct Image & Part Source Links
            </div>

            {/* Group links by retailer */}
            {Object.entries(RETAILER_META).map(([rid, rmeta]) => {
              const links = dedupedUrls.filter(u => u.retailer === rid);
              if (!links.length) return null;
              return (
                <div key={rid} style={{ marginBottom: 8 }}>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 4,
                  }}>
                    <RetailerBadge retailerId={rid} />
                    <span style={{ color: "#475569", fontSize: 10 }}>{RETAILERS[rid]?.note || ""}</span>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {links.map((u, i) => <LinkChip key={i} url={u} />)}
                  </div>
                </div>
              );
            })}

            {!part.classification.standard && (
              <div style={{
                marginTop: 8,
                padding: "7px 10px",
                background: "#140800",
                border: "1px solid #fb923c25",
                borderRadius: 4,
                color: "#fb923c",
                fontSize: 11,
              }}>
                💡 <strong>Proprietary part:</strong> Click the <span style={{color:"#22c55e"}}>Great Lakes sub-category links</span> above to browse TapeTech / Columbia / NorthStar equivalents. Look for matching dimensions and function in the "{part.group_name}" parts section.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────────
const GROUPS = RAW_SCHEMATICS.map(s => ({ slug: s.group_slug, name: s.group_name, skus: s.compatible_skus }));

export default function App() {
  const allParts = useMemo(() => buildAllParts(), []);
  const [groupFilter, setGroupFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [expandedPn, setExpandedPn] = useState(null);
  const [tab, setTab] = useState("parts");

  const filtered = useMemo(() => {
    return allParts.filter(p => {
      if (groupFilter !== "ALL" && p.group_slug !== groupFilter) return false;
      if (typeFilter !== "ALL" && p.classification.type !== typeFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        return p.description.toLowerCase().includes(s) || p.part_number.toLowerCase().includes(s);
      }
      return true;
    });
  }, [allParts, groupFilter, typeFilter, search]);

  const typeStats = useMemo(() => {
    const s = {};
    allParts.forEach(p => { s[p.classification.type] = (s[p.classification.type] || 0) + 1; });
    return s;
  }, [allParts]);

  const stdCount  = allParts.filter(p => p.classification.standard).length;
  const propCount = allParts.length - stdCount;

  return (
    <div style={{ minHeight: "100vh", background: "#05080f", fontFamily: "'IBM Plex Mono', 'Fira Code', monospace", color: "#e2e8f0" }}>

      {/* Header */}
      <div style={{ background: "#070c18", borderBottom: "1px solid #111827", padding: "18px 22px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontSize: 20 }}>🔩</span>
          <h1 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#f8fafc", letterSpacing: "-0.01em" }}>
            Level5 Parts Cross-Reference
          </h1>
          <span style={{ background: "#0f172a", color: "#22d3ee", padding: "2px 8px", borderRadius: 3, fontSize: 9, fontWeight: 800, border: "1px solid #22d3ee30", letterSpacing: "0.08em" }}>
            IMAGE SOURCE FINDER v2
          </span>
        </div>
        <p style={{ margin: "6px 0 0", color: "#334155", fontSize: 11 }}>
          Sources: WallTools · All-Wall · Great Lakes Taping Tools · CSR Building + McMaster/Grainger/Fastenal for standard hardware
        </p>

        {/* Retailer pills */}
        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          {Object.values(RETAILERS).map(r => (
            <a key={r.id} href={r.baseUrl} target="_blank" rel="noreferrer" style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "4px 10px", borderRadius: 4,
              background: r.color + "12",
              color: r.color,
              border: `1px solid ${r.color}35`,
              fontSize: 10.5, fontWeight: 700,
              textDecoration: "none", letterSpacing: "0.02em",
            }}>
              {r.icon} {r.name}
            </a>
          ))}
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ display: "flex", gap: 0, overflowX: "auto", borderBottom: "1px solid #111827", background: "#060a14" }}>
        <div style={{ padding: "10px 18px", borderRight: "1px solid #111827", textAlign: "center", minWidth: 70 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#f8fafc" }}>{allParts.length}</div>
          <div style={{ fontSize: 9, color: "#334155" }}>UNIQUE PARTS</div>
        </div>
        <div style={{ padding: "10px 18px", borderRight: "1px solid #111827", textAlign: "center", minWidth: 70 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#22c55e" }}>{stdCount}</div>
          <div style={{ fontSize: 9, color: "#334155" }}>STANDARD HW</div>
        </div>
        <div style={{ padding: "10px 18px", borderRight: "1px solid #111827", textAlign: "center", minWidth: 70 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#ef4444" }}>{propCount}</div>
          <div style={{ fontSize: 9, color: "#334155" }}>PROPRIETARY</div>
        </div>
        {Object.entries(typeStats).map(([type, count]) => {
          const m = TYPE_META[type];
          return (
            <div key={type} onClick={() => setTypeFilter(typeFilter === type ? "ALL" : type)}
              style={{ padding: "10px 14px", borderRight: "1px solid #111827", textAlign: "center", cursor: "pointer", minWidth: 58, background: typeFilter === type ? m.bg : "transparent" }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: m.color }}>{count}</div>
              <div style={{ fontSize: 8, color: "#334155", letterSpacing: "0.04em" }}>{type.slice(0,7)}</div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid #111827", background: "#060a14" }}>
        {[["parts","🔩 Parts + Sources"],["groups","📦 Tool Groups & Brands"],["retailers","🏪 Retailer Guide"]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            padding: "9px 18px", background: "none", border: "none",
            borderBottom: `2px solid ${tab === id ? "#22d3ee" : "transparent"}`,
            color: tab === id ? "#22d3ee" : "#334155",
            fontFamily: "monospace", fontSize: 11, fontWeight: 700,
            cursor: "pointer", letterSpacing: "0.04em",
          }}>{label}</button>
        ))}
      </div>

      {/* PARTS TAB */}
      {tab === "parts" && (
        <div style={{ padding: 18 }}>
          {/* Filters */}
          <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search part # or description..."
              style={{ flex: 1, minWidth: 180, background: "#070c18", border: "1px solid #111827", borderRadius: 5, padding: "7px 11px", color: "#e2e8f0", fontFamily: "monospace", fontSize: 11, outline: "none" }}
            />
            <select value={groupFilter} onChange={e => setGroupFilter(e.target.value)}
              style={{ background: "#070c18", border: "1px solid #111827", borderRadius: 5, padding: "7px 11px", color: "#e2e8f0", fontFamily: "monospace", fontSize: 11 }}>
              <option value="ALL">All Tool Groups</option>
              {GROUPS.map(g => <option key={g.slug} value={g.slug}>{g.name}</option>)}
            </select>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
              style={{ background: "#070c18", border: "1px solid #111827", borderRadius: 5, padding: "7px 11px", color: "#e2e8f0", fontFamily: "monospace", fontSize: 11 }}>
              <option value="ALL">All Part Types</option>
              {Object.entries(typeStats).map(([t, c]) => <option key={t} value={t}>{TYPE_META[t]?.label || t} ({c})</option>)}
            </select>
          </div>

          <div style={{ color: "#1e2d40", fontSize: 10, marginBottom: 10 }}>
            {filtered.length} / {allParts.length} parts — click to expand brand cross-references + direct retailer links
          </div>

          {filtered.map(part => (
            <PartRow key={part.part_number} part={part}
              expanded={expandedPn === part.part_number}
              onToggle={() => setExpandedPn(expandedPn === part.part_number ? null : part.part_number)}
            />
          ))}
        </div>
      )}

      {/* GROUPS TAB */}
      {tab === "groups" && (
        <div style={{ padding: 18 }}>
          <h2 style={{ margin: "0 0 16px", fontSize: 13, color: "#f8fafc", fontWeight: 700 }}>Level5 Tool Groups → Compatible Competitor Parts</h2>
          {GROUPS.map(g => {
            const xref = GROUP_BRAND_XREF[g.slug];
            if (!xref) return null;
            const groupParts = allParts.filter(p => p.group_slug === g.slug);
            return (
              <div key={g.slug} style={{ marginBottom: 20, background: "#070c18", border: "1px solid #111827", borderRadius: 6, overflow: "hidden" }}>
                <div style={{ padding: "12px 16px", borderBottom: "1px solid #111827", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <span style={{ color: "#f8fafc", fontWeight: 800, fontSize: 13 }}>{g.name}</span>
                    <span style={{ color: "#334155", fontSize: 11, marginLeft: 10 }}>SKU: {g.skus.join(" / ")}</span>
                  </div>
                  <span style={{ color: "#334155", fontSize: 10 }}>{groupParts.length} unique parts</span>
                </div>

                <div style={{ padding: "12px 16px" }}>
                  <div style={{ color: "#334155", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>
                    Compatible Brands — direct parts catalog links
                  </div>

                  {xref.compatibleBrands.map((b, i) => {
                    const glUrl = (RETAILERS.GREAT_LAKES.subCategoryUrls[g.slug] || {})[b.brand];
                    const wtUrl = RETAILERS.WALLTOOLS.partsBrandUrls[b.brand];
                    const awUrl = RETAILERS.ALL_WALL.partsBrandUrls[b.brand];
                    const csrUrl = RETAILERS.CSR.partsBrandUrls[b.brand];
                    return (
                      <div key={i} style={{
                        marginBottom: 10,
                        padding: "9px 12px",
                        background: "#05080f",
                        border: `1px solid ${CONF_COLOR[b.confidence]}20`,
                        borderLeft: `3px solid ${CONF_COLOR[b.confidence]}`,
                        borderRadius: 4,
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                          <span style={{ color: "#f1f5f9", fontWeight: 800, fontSize: 12 }}>{b.brand}</span>
                          <span style={{ color: CONF_COLOR[b.confidence], fontSize: 9, fontWeight: 700, letterSpacing: "0.06em" }}>
                            ● {b.confidence} COMPATIBILITY
                          </span>
                          <span style={{ color: "#334155", fontSize: 10, flexGrow: 1 }}>{b.note}</span>
                        </div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {glUrl  && <a href={glUrl}  target="_blank" rel="noreferrer" style={{ ...chipStyle, color: "#22c55e",  background: "#22c55e12",  border: "1px solid #22c55e30"  }}>🟢 Great Lakes</a>}
                          {wtUrl  && <a href={wtUrl}  target="_blank" rel="noreferrer" style={{ ...chipStyle, color: "#3b82f6",  background: "#3b82f612",  border: "1px solid #3b82f630"  }}>🔵 WallTools</a>}
                          {awUrl  && <a href={awUrl}  target="_blank" rel="noreferrer" style={{ ...chipStyle, color: "#f97316",  background: "#f9731612",  border: "1px solid #f9731630"  }}>🟠 All-Wall</a>}
                          {csrUrl && <a href={csrUrl} target="_blank" rel="noreferrer" style={{ ...chipStyle, color: "#ef4444",  background: "#ef444412",  border: "1px solid #ef444430"  }}>🔴 CSR Building</a>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* RETAILERS TAB */}
      {tab === "retailers" && (
        <div style={{ padding: 18 }}>
          <h2 style={{ margin: "0 0 16px", fontSize: 13, color: "#f8fafc", fontWeight: 700 }}>Retailer Guide — Brands Carried & Best Use</h2>
          {Object.values(RETAILERS).map(r => (
            <div key={r.id} style={{ marginBottom: 20, background: "#070c18", border: `1px solid ${r.color}30`, borderLeft: `3px solid ${r.color}`, borderRadius: 6, overflow: "hidden" }}>
              <div style={{ padding: "12px 16px", borderBottom: "1px solid #111827", display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 18 }}>{r.icon}</span>
                <div>
                  <a href={r.baseUrl} target="_blank" rel="noreferrer" style={{ color: r.color, fontWeight: 800, fontSize: 14, textDecoration: "none" }}>{r.name}</a>
                  <div style={{ color: "#475569", fontSize: 11, marginTop: 2 }}>{r.note}</div>
                </div>
              </div>
              <div style={{ padding: "12px 16px" }}>
                <div style={{ color: "#334155", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 8 }}>PARTS BRAND PAGES</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {Object.entries(r.partsBrandUrls || {}).map(([brand, url]) => (
                    <a key={brand} href={url} target="_blank" rel="noreferrer" style={{
                      ...chipStyle, color: r.color, background: r.color + "12", border: `1px solid ${r.color}30`,
                    }}>{brand} Parts →</a>
                  ))}
                </div>
                {r.subCategoryUrls && (
                  <>
                    <div style={{ color: "#334155", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", marginTop: 12, marginBottom: 8 }}>SUB-CATEGORY PARTS PAGES (by tool type)</div>
                    {Object.entries(r.subCategoryUrls).map(([cat, brands]) => (
                      <div key={cat} style={{ marginBottom: 8 }}>
                        <span style={{ color: "#475569", fontSize: 10, marginRight: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>{cat}</span>
                        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 4 }}>
                          {Object.entries(brands).map(([brand, url]) => (
                            <a key={brand} href={url} target="_blank" rel="noreferrer" style={{
                              ...chipStyle, color: r.color, background: r.color + "10", border: `1px solid ${r.color}25`, fontSize: 10,
                            }}>{brand}</a>
                          ))}
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ height: 40 }} />
    </div>
  );
}

const chipStyle = {
  display: "inline-flex",
  alignItems: "center",
  padding: "4px 9px",
  borderRadius: 4,
  fontSize: 10.5,
  fontWeight: 700,
  textDecoration: "none",
  fontFamily: "monospace",
  letterSpacing: "0.02em",
};
