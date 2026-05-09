/**
 * includesOverrides.js
 *
 * Curated Set Includes overrides for kit / bundle SKUs whose descriptions are
 * too ambiguous or poorly delimited for reliable heuristic parsing.
 *
 * These overrides do not change the catalog schema. They provide a precise,
 * SKU-keyed source of truth for the includes extractor when catalog prose is
 * not machine-friendly enough to split accurately.
 */

function buildRawValue(items) {
  return items
    .map(({ name, sku }) => (sku ? `${name} (${sku})` : name))
    .join(', ');
}

const SKU_INCLUDES_OVERRIDES = {
  'TT-BASIC-FULL-SET-WITH-AND-BOXES': {
    items: [
      { name: 'EZ Clean Automatic Taper', sku: '07TT' },
      { name: 'Loading Pump' },
      { name: 'Gooseneck' },
      { name: 'Filler' },
      { name: 'Corner Roller with Fiberglass Handle', sku: '15TTE/FHTT' },
      { name: '42" Flat Box Handle', sku: '8042TT' },
      { name: '10" EZ Clean Flat Box with EZ Roll Wheels', sku: 'EZ10TT' },
      { name: '12" EZ Clean Flat Box with EZ Roll Wheels', sku: 'EZ12TT' },
      { name: '3" EZ Roll Adjustable Corner Finisher', sku: '48TT' },
      { name: '8" Corner Applicator with Fiberglass Handle', sku: 'CA08TT/FHTT' },
      { name: 'Corner Finisher Fiberglass Handle', sku: 'CFATT/FHTT' },
    ],
  },
  'TT-FULL-10-12': {
    items: [
      { name: 'EZ Clean Automatic Taper', sku: '07TT' },
      { name: 'Loading Pump' },
      { name: 'Gooseneck' },
      { name: 'Filler' },
      { name: 'Corner Roller with Fiberglass Handle', sku: '15TTE/FHTT' },
      { name: '42" Flat Box Handle', sku: '8042TT' },
      { name: '10" EZ Clean Flat Box with EZ Roll Wheels', sku: 'EZ10TT' },
      { name: '12" EZ Clean Flat Box with EZ Roll Wheels', sku: 'EZ12TT' },
      { name: '3" EZ Roll Adjustable Corner Finisher', sku: '48TT' },
      { name: '8" Corner Applicator with Fiberglass Handle', sku: 'CA08TT/FHTT' },
      { name: 'Corner Finisher Fiberglass Handle', sku: 'CFATT/FHTT' },
    ],
  },
  'TT-FULL-7-10': {
    items: [
      { name: 'EZ Clean Automatic Taper', sku: '07TT' },
      { name: 'Loading Pump' },
      { name: 'Gooseneck' },
      { name: 'Filler' },
      { name: 'Corner Roller with Fiberglass Handle', sku: '15TTE/FHTT' },
      { name: '42" Flat Box Handle', sku: '8042TT' },
      { name: '7" EZ Clean Flat Box with EZ Roll Wheels', sku: 'EZ07TT' },
      { name: '10" EZ Clean Flat Box with EZ Roll Wheels', sku: 'EZ10TT' },
      { name: '3" EZ Roll Adjustable Corner Finisher', sku: '48TT' },
      { name: '8" Corner Applicator with Fiberglass Handle', sku: 'CA08TT/FHTT' },
      { name: 'Corner Finisher Fiberglass Handle', sku: 'CFATT/FHTT' },
    ],
  },
  'TT-TTSFS': {
    items: [
      { name: 'EZ Clean Automatic Taper', sku: '07TT' },
      { name: '10" EZ Clean Flat Box', sku: 'EZ10TT' },
      { name: '12" EZ Clean Flat Box', sku: 'EZ12TT' },
      { name: 'Corner Roller', sku: '15TTE' },
      { name: '2.5" Corner Finisher', sku: '42TT' },
      { name: '3" EZ Roll Adjustable Corner Finisher', sku: '48TT' },
      { name: '8" Corner Applicator', sku: 'CA08TT' },
      { name: 'Loading Pump', sku: '76TT' },
      { name: 'Gooseneck', sku: '85TT' },
      { name: 'Flat Box Filler', sku: '90TT' },
      { name: 'Corner Finisher Adaptor', sku: 'CFATT' },
      { name: '2 Extendable Handles', sku: 'XHTT' },
    ],
  },
  TTSFS: {
    items: [
      { name: 'EZ Clean Automatic Taper', sku: '07TT' },
      { name: '10" EZ Clean Flat Box', sku: 'EZ10TT' },
      { name: '12" EZ Clean Flat Box', sku: 'EZ12TT' },
      { name: 'Corner Roller', sku: '15TTE' },
      { name: '2.5" Corner Finisher', sku: '42TT' },
      { name: '3" EZ Roll Adjustable Corner Finisher', sku: '48TT' },
      { name: '8" Corner Applicator', sku: 'CA08TT' },
      { name: 'Loading Pump', sku: '76TT' },
      { name: 'Gooseneck', sku: '85TT' },
      { name: 'Flat Box Filler', sku: '90TT' },
      { name: 'Corner Finisher Adaptor', sku: 'CFATT' },
      { name: '2 Extendable Handles', sku: 'XHTT' },
    ],
  },
  'TTSFS-2': {
    items: [
      { name: 'EZ Clean Automatic Taper', sku: '07TT' },
      { name: '10" EZ Clean Flat Box', sku: 'EZ10TT' },
      { name: '12" EZ Clean Flat Box', sku: 'EZ12TT' },
      { name: 'Corner Roller', sku: '15TTE' },
      { name: '2.5" Corner Finisher', sku: '42TT' },
      { name: '3" EZ Roll Adjustable Corner Finisher', sku: '48TT' },
      { name: '8" Corner Applicator', sku: 'CA08TT' },
      { name: 'Loading Pump', sku: '76TT' },
      { name: 'Gooseneck', sku: '85TT' },
      { name: 'Flat Box Filler', sku: '90TT' },
      { name: 'Corner Finisher Adaptor', sku: 'CFATT' },
      { name: '2 Extendable Handles', sku: 'XHTT' },
    ],
  },
  TTBBS: {
    items: [
      { name: '10" EZ Clean Flat Box', sku: 'EZ10TT' },
      { name: '12" EZ Clean Flat Box', sku: 'EZ12TT' },
      { name: 'Loading Pump', sku: '76TT' },
      { name: 'Flat Box Filler', sku: '90TT' },
      { name: 'Flat Box Xtender Handle', sku: '88TTE' },
    ],
  },
  TTBTS: {
    items: [
      { name: 'EZ Clean Automatic Taper', sku: '07TT' },
      { name: 'Corner Roller', sku: '15TTE' },
      { name: '3" EZ Roll Adjustable Corner Finisher', sku: '48TT' },
      { name: 'Loading Pump', sku: '76TT' },
      { name: 'Gooseneck', sku: '85TT' },
      { name: 'Corner Finisher Adaptor', sku: 'CFATT' },
      { name: 'Fiberglass Support Handle', sku: 'FHTT' },
    ],
  },
  TTCFS: {
    items: [
      { name: '3" EZ Roll Adjustable Corner Finisher', sku: '48TT' },
      { name: '8" Corner Applicator', sku: 'CA08TT' },
      { name: 'Loading Pump', sku: '76TT' },
      { name: 'Flat Box Filler', sku: '90TT' },
      { name: 'Extendable Handle', sku: 'XHTT' },
    ],
  },
  '10356': {
    items: [
      { name: 'Flat Boxes (Selected Style and Sizes)' },
      { name: 'Box Handle (Selected Length)' },
      { name: 'Drywall Loading Pump' },
    ],
  },
  TTFULL2SET: {
    items: [
      { name: '2 EZ Clean Automatic Tapers', sku: '07TT' },
      { name: '2 Loading Pumps', sku: '76TT' },
      { name: '2 Goosenecks', sku: '85TT' },
      { name: '2 Fillers', sku: '90TT' },
      { name: '2 Corner Finisher Adapters', sku: 'CFA-TT' },
      { name: '2 Corner Rollers', sku: '15TTE' },
      { name: '2 10" EZ Clean Flat Boxes with EZ Roll Wheels', sku: 'EZ10TT' },
      { name: '2 12" EZ Clean Flat Boxes with EZ Roll Wheels', sku: 'EZ12TT' },
      { name: '2 3" EZ Roll Adjustable Corner Finishers', sku: '48TT' },
      { name: '2 8" Corner Applicators', sku: 'CA08TT' },
      { name: '2 42" Flat Box Handles', sku: '8042TT' },
      { name: '6 Interchangeable Fiberglass Support Handles', sku: 'FHTT' },
    ],
  },
  '10354': {
    items: [
      { name: 'Automatic Taper' },
      { name: 'Flat Boxes (Selected Style and Sizes)' },
      { name: 'Multiple Box Handles' },
      { name: '2 Loading Pumps' },
      { name: '2 Corner Finishers' },
      { name: 'Corner Roller' },
      { name: 'Corner Applicator' },
      { name: 'Nail Spotters' },
      { name: 'Support Handles' },
      { name: 'Gooseneck' },
      { name: 'Flat Box Filler' },
    ],
  },
  '13669': {
    items: [
      { name: 'Automatic Taper' },
      { name: 'Corner Roller', sku: '15TTE' },
      { name: 'Corner Finisher' },
      { name: 'Loading Pump', sku: '76TT' },
      { name: 'Gooseneck', sku: '85TT' },
      { name: 'Corner Finisher Adaptor', sku: 'CFATT' },
      { name: '2 Universal Support Handles' },
    ],
  },
  '10128': {
    items: [
      { name: 'Automatic Taper' },
      { name: 'Flat Boxes (Selected Style and Sizes)' },
      { name: 'Box Handle (Selected Length)' },
      { name: 'Corner Finisher' },
      { name: 'Corner Roller' },
      { name: 'Corner Applicator' },
      { name: 'Loading Pump' },
      { name: 'Gooseneck' },
      { name: 'Flat Box Filler' },
      { name: 'Support Handles' },
    ],
  },
  '10355': {
    items: [
      { name: 'Flat Boxes (Selected Style and Sizes)' },
      { name: 'Box Handle (Selected Length)' },
      { name: 'Corner Finisher' },
      { name: 'Corner Roller' },
      { name: 'Corner Applicator' },
      { name: 'Loading Pump' },
      { name: 'Flat Box Filler' },
      { name: 'Support Handles' },
    ],
  },
  TTFFS: {
    items: [
      { name: '10" EZ Clean Flat Box', sku: 'EZ10TT' },
      { name: '12" EZ Clean Flat Box', sku: 'EZ12TT' },
      { name: 'Corner Roller', sku: '15TTE' },
      { name: '3" EZ Roll Adjustable Corner Finisher', sku: '48TT' },
      { name: '8" Corner Applicator', sku: 'CA08TT' },
      { name: 'Loading Pump', sku: '76TT' },
      { name: 'Flat Box Filler', sku: '90TT' },
      { name: 'Corner Finisher Adapter for FHTT Handle', sku: 'CFA-TT' },
      { name: 'TapeTech Interchangeable Fiberglass Support Handle', sku: 'FHTT' },
      { name: '42" Flat Box Handle', sku: '8042TT' },
    ],
  },
  TTFTFS: {
    items: [
      { name: 'EZ Clean Automatic Taper', sku: '07TT' },
      { name: 'Loading Pump', sku: '76TT' },
      { name: 'Gooseneck', sku: '85TT' },
      { name: 'Filler', sku: '90TT' },
      { name: 'Corner Roller', sku: '15TTE' },
      { name: '42" Flat Box Handle', sku: '8042TT' },
      { name: '10" EZ Clean Flat Box with EZ Roll Wheels', sku: 'EZ07TT' },
      { name: '12" EZ Clean Flat Box with EZ Roll Wheels', sku: 'EZ10TT' },
      { name: '3" EZ Roll Adjustable Corner Finisher', sku: '48TT' },
      { name: '8" Corner Applicator', sku: 'CA08TT' },
      { name: 'TapeTech Interchangeable Fiberglass Support Handle', sku: 'FHTT' },
      { name: 'Corner Finisher Adapter for FHTT Handle', sku: 'CFA-TT' },
    ],
  },
  'TTPPS-EF': {
    items: [
      { name: 'EZ Clean Automatic Taper', sku: '07TT' },
      { name: '10" PowerAssist MaxxBox', sku: 'PAHC10' },
      { name: '12" PowerAssist MaxxBox', sku: 'PAHC12' },
      { name: 'Corner Roller', sku: '15TTE' },
      { name: '2.5" Corner Finisher', sku: '42TT' },
      { name: '3" EZ Roll Adjustable Corner Finisher', sku: '48TT' },
      { name: '2" EZ Clean Nailspotter', sku: 'NS02TT' },
      { name: '3" EZ Clean Nailspotter', sku: 'NS02TT' },
      { name: 'MudRunner Applicator', sku: '14TT' },
      { name: '2 Loading Pumps', sku: '76TT' },
      { name: 'Gooseneck', sku: '85TT' },
      { name: 'Flat Box Filler', sku: '90TT' },
      { name: 'Corner Finisher Adaptor', sku: 'CFA-TT' },
      { name: '3 Extendable Handles', sku: 'XHTT' },
      { name: '2 Flat Box Xtender Handles', sku: '88TTE' },
    ],
  },
  TTPPS: {
    items: [
      { name: 'EZ Clean Automatic Taper', sku: '07TT' },
      { name: '10" EZ Clean Flat Box', sku: 'EZ10TT' },
      { name: '12" EZ Clean Flat Box', sku: 'EZ12TT' },
      { name: 'Corner Roller', sku: '15TTE' },
      { name: '2.5" Corner Finisher', sku: '42TT' },
      { name: '3" EZ Roll Adjustable Corner Finisher', sku: '48TT' },
      { name: '8" Corner Applicator', sku: 'CA08TT' },
      { name: '2" EZ Clean Nailspotter', sku: 'NS02TT' },
      { name: '3" EZ Clean Nailspotter', sku: 'NS02TT' },
      { name: '2 Loading Pumps', sku: '76TT' },
      { name: 'Gooseneck', sku: '85TT' },
      { name: 'Flat Box Filler', sku: '90TT' },
      { name: 'Corner Finisher Adaptor', sku: 'CFA-TT' },
      { name: '3 Extendable Handles', sku: 'XHTT' },
      { name: '2 Flat Box Xtender Handles', sku: '88TTE' },
    ],
  },
  TTPSS: {
    items: [
      { name: 'EZ Clean Automatic Taper', sku: '07TT' },
      { name: '10" EZ Clean Flat Box', sku: 'EZ10TT' },
      { name: '12" EZ Clean Flat Box', sku: 'EZ12TT' },
      { name: 'Corner Roller', sku: '15TTE' },
      { name: '3" EZ Roll Adjustable Corner Finisher', sku: '48TT' },
      { name: '8" Corner Applicator', sku: 'CA08TT' },
      { name: 'Loading Pump', sku: '76TT' },
      { name: 'Gooseneck', sku: '85TT' },
      { name: 'Flat Box Filler', sku: '90TT' },
      { name: 'Corner Finisher Adaptor', sku: 'CFA-TT' },
      { name: '2 Extendable Handles', sku: 'XHTT' },
      { name: '42" Flat Box Handle', sku: '8042TT' },
    ],
  },
};

export function getIncludesOverride(sku) {
  const normalizedSku = String(sku || '').trim().toUpperCase();
  if (!normalizedSku) return null;

  const override = SKU_INCLUDES_OVERRIDES[normalizedSku];
  if (!override || !Array.isArray(override.items) || override.items.length === 0) {
    return null;
  }

  return {
    label: override.label || 'Set Includes',
    items: override.items,
    rawValue: override.rawValue || buildRawValue(override.items),
  };
}

