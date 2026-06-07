const COLUMBIA_BRAND = 'Columbia Taping Tools';

const normalizeKey = (value) => String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

const normalizeSizeId = (variantId) => {
  const raw = String(variantId || '').trim().toLowerCase();
  if (!raw) return '';
  if (raw === '5-5' || raw === '5_5' || raw === '5.5' || raw === '55') return '5.5';
  if (raw === '2-5' || raw === '2_5' || raw === '2.5' || raw === '25') return '2.5';
  if (raw === '3-5' || raw === '3_5' || raw === '3.5' || raw === '35') return '3.5';
  return raw.replace(/[^0-9.]/g, '');
};

const sizeLabel = (size) => `${size} in.`;
const quoteLabel = (size) => `${size}"`;

function getUrlContext() {
  if (typeof window === 'undefined') return {};

  const params = new URLSearchParams(window.location.search);
  return {
    schematicId: params.get('schematic') || '',
    variantId: params.get('variant') || '',
  };
}

function getPartCandidates(part) {
  return [
    part?.id,
    part?.sku,
    part?.source_sku,
    part?.name,
  ].map(normalizeKey).filter(Boolean);
}

function firstCandidateOverride(part, map) {
  const candidates = getPartCandidates(part);
  for (const key of candidates) {
    if (map[key]) return map[key];
  }
  return null;
}

function partOverride(id, name, sku = '') {
  return { id, name, sku, brand: COLUMBIA_BRAND };
}

function sizedSku(prefix, size) {
  return `${prefix}-${size}`;
}

function buildFlatBoxMap(size) {
  const label = quoteLabel(size);
  const partSize = sizeLabel(size);

  return {
    FFB910: partOverride(sizedSku('FFB9', size), `Flat Box Blade ${label} (${sizedSku('FFB9', size)})`, sizedSku('FFB9', size)),
    FFB11: partOverride(sizedSku('FFB11', size), `Adjuster Spring ${label} (${sizedSku('FFB11', size)})`, sizedSku('FFB11', size)),
    FFB1110: partOverride(sizedSku('FFB11', size), `Adjuster Spring ${label} (${sizedSku('FFB11', size)})`, sizedSku('FFB11', size)),
    HFFB1410: partOverride(sizedSku('HFFB14', size), `Flat Box Hinged Door Gasket ${label} (${sizedSku('HFFB14', size)})`, sizedSku('HFFB14', size)),
    HFBB1410: partOverride(sizedSku('HFFB14', size), `Flat Box Hinged Door Gasket ${label} (${sizedSku('HFFB14', size)})`, sizedSku('HFFB14', size)),
    FFB4010: partOverride(sizedSku('FFB40', size), `Flat Box Door Gasket ${partSize}`, sizedSku('FFB40', size)),
    FFB2510: partOverride(sizedSku('FFB25', size), `Rubber Gasket Retainer ${label} (${sizedSku('FFB25', size)})`, sizedSku('FFB25', size)),
    FFB210: partOverride(sizedSku('FFB2', size), `Roll Face ${partSize}`, sizedSku('FFB2', size)),
    FFB1010: partOverride(sizedSku('FFB10', size), `Flat Box Side Cover ${partSize}`, sizedSku('FFB10', size)),
    FFB2410: partOverride(sizedSku('FFB24', size), `Flat Box Wheel Axle ${partSize}`, sizedSku('FFB24', size)),
    HFFB110: partOverride(sizedSku('HFFB1', size), `Heavy Flat Box Body ${partSize}`, sizedSku('HFFB1', size)),
    HFFB410: partOverride(sizedSku('HFFB4', size), `Heavy Flat Box Door ${partSize}`, sizedSku('HFFB4', size)),
    HFFB1A10: partOverride(sizedSku('HFFB1A', size), `Mud Seal Strip ${label} (${sizedSku('HFFB1A', size)})`, sizedSku('HFFB1A', size)),
  };
}

function buildFatBoyBoxMap(size) {
  const label = quoteLabel(size);
  const partSize = sizeLabel(size);

  return {
    FFB11: partOverride(sizedSku('FFB11', size), `Adjuster Spring - ${label} (${sizedSku('FFB11', size)})`, sizedSku('FFB11', size)),
    FFB2S10: partOverride(`FFB 2S-${size}`, `Flat Box Side Plate ${partSize} Short`, ''),
    FFB910: partOverride(`FFB 9-${size}`, `Flat Box Blade ${label} (${sizedSku('FFB9', size)})`, sizedSku('FFB9', size)),
    FF8A1010: partOverride(`FF8A ${size}-${size}`, `Blade Bar Assembly ${partSize}`, ''),
    FFB4010: partOverride(`FFB 40-${size}`, `Flat Box Door Gasket ${partSize}`, ''),
    HFBB1410: partOverride(`HFBB 14-${size}`, `Hinged Door Gasket ${partSize} Fat Boy (${sizedSku('HFFB14', size)})`, sizedSku('HFFB14', size)),
  };
}

function buildAngleHeadMap(size) {
  const label = quoteLabel(size);

  return {
    AH725: partOverride(`AH 7-${label}`, `Frame Tension Spring ${label} (${sizedSku('AH7', size)})`, sizedSku('AH7', size)),
    AH73: partOverride(`AH 7-${label}`, `Frame Tension Spring ${label} (${sizedSku('AH7', size)})`, sizedSku('AH7', size)),
    AH33: partOverride(`AH 3-${label}`, `Top Blade ${label} (${sizedSku('AH3', size)})`, sizedSku('AH3', size)),
    AH12: partOverride(`AH 1-${label}`, `Head Casting ${label} (${sizedSku('AH1', size)})`, sizedSku('AH1', size)),
    AH135: partOverride(`AH 1-${label}`, `Head Casting ${label} (${sizedSku('AH1', size)})`, sizedSku('AH1', size)),
    AH23L: partOverride(`AH 2-${label} L`, `${label} Left Frame Sub-Assembly`, ''),
    AH23R: partOverride(`AH 2-${label} R`, `${label} Right Frame Sub-Assembly`, ''),
  };
}

function buildNailSpotterMap(size) {
  const label = quoteLabel(size);

  return {
    HNS193: partOverride(`HNS19-${size}`, `Triangle Shoe ${label}`, ''),
    HNS43: partOverride(`HNS4-${size}`, `Door ${label} (${sizedSku('HNS4', size)})`, sizedSku('HNS4', size)),
    HNS153: partOverride(`HNS15-${size}`, `Door Gasket ${label} (${sizedSku('HNS15', size)})`, sizedSku('HNS15', size)),
    HNS73: partOverride(`HNS7-${size}`, `Blade ${label} (${sizedSku('HNS7', size)})`, sizedSku('HNS7', size)),
    HNS83: partOverride(`HNS8-${size}`, `Blade Holder ${label} (${sizedSku('HNS8', size)})`, sizedSku('HNS8', size)),
    HNS23: partOverride(`HNS2-${size}`, `Nail Spotter Front Plate ${label}`, ''),
    HNS93: partOverride(`HNS9-${size}`, `Face Plate ${label}`, ''),
  };
}

function buildThrottleBoxMap(size) {
  const compactSize = String(size).replace(/\.0$/, '');

  return {
    CFB18: partOverride(`CFB1-${compactSize}`, `Rear Plate ${compactSize} in (CFB1-${compactSize})`, `CFB1-${compactSize}in`),
    CFB18IN: partOverride(`CFB1-${compactSize}`, `Rear Plate ${compactSize} in (CFB1-${compactSize})`, `CFB1-${compactSize}in`),
    CFB28: partOverride(`CFB2-${compactSize}`, `${compactSize}" Roll Face (CFB2${compactSize})`, `CFB2-${compactSize}in`),
    CFB28IN: partOverride(`CFB2-${compactSize}`, `${compactSize}" Roll Face (CFB2${compactSize})`, `CFB2-${compactSize}in`),
    CFB38: partOverride(`CFB3-${compactSize}`, `Side Plate ${compactSize}" (CFB3-${compactSize})`, `CFB3-${compactSize}`),
    CFB48: partOverride(`CFB4-${compactSize}`, `${compactSize}" Pressure Door (CFB4${compactSize})`, `CFB4-${compactSize}`),
    CFB78: partOverride(`CFB7-${compactSize}`, `${compactSize}" Door Gasket for Angle Box (CFB7${compactSize})`, `CFB7-${compactSize}`),
  };
}

function buildTomahawkMap(size) {
  return {
    SB112IN: partOverride(`SB1-${size}IN`, `Tomahawk ${size} in Smoothing Blade (TSB-${size})`, `TSB-${size}`),
    SB212IN: partOverride(`SB2-${size}IN`, `Replacement ${size}" Blade for Tomahawk`, ''),
  };
}

function getColumbiaVariantMap(schematicId, variantId) {
  const size = normalizeSizeId(variantId);
  if (!schematicId || !size) return null;

  switch (schematicId) {
    case 'columbia-flat-box':
    case 'columbia-automatic-flat-box':
      return buildFlatBoxMap(size);
    case 'columbia-fat-boy-box':
      return buildFatBoyBoxMap(size);
    case 'columbia-angle-head':
      return buildAngleHeadMap(size);
    case 'columbia-nailspotter':
      return buildNailSpotterMap(size);
    case 'columbia-throttle-box':
      return buildThrottleBoxMap(size);
    case 'columbia-tomahawk-smoothing-blades':
      return buildTomahawkMap(size);
    default:
      return null;
  }
}

export function resolveSchematicVariantPart(part, context = {}) {
  if (!part) return part;

  const urlContext = getUrlContext();
  const schematicId = context.schematicId || urlContext.schematicId || '';
  const variantId = context.variantId || part.schematicVariantId || urlContext.variantId || '';
  const map = getColumbiaVariantMap(schematicId, variantId);
  const override = map ? firstCandidateOverride(part, map) : null;

  if (!override) return part;

  return {
    ...part,
    ...override,
    quantity: part.quantity || 1,
    source_id: part.id,
    source_sku: part.sku || part.source_sku || '',
    schematicVariantId: variantId,
    schematicVariantLabel: sizeLabel(normalizeSizeId(variantId)),
  };
}

export function schematicPartKeysDiffer(left, right) {
  return normalizeKey(left?.sku || left?.id || left?.name) !== normalizeKey(right?.sku || right?.id || right?.name);
}

export function productMatchesSchematicPart(product, part) {
  if (!product || !part?.sku) return false;
  return normalizeKey(product.sku) === normalizeKey(part.sku);
}
