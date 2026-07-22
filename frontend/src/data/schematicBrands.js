export const SCHEMATIC_BRANDS = [
  { name: 'TapeTech', slug: 'tapetech' },
  { name: 'Columbia Taping Tools', slug: 'columbia-taping-tools' },
  { name: 'Asgard', slug: 'asgard' },
  { name: 'SurPro', slug: 'surpro' },
  { name: 'Platinum Drywall Tools', slug: 'platinum' },
  { name: 'Dura-Stilts', slug: 'dura-stilts' },
  { name: 'Level5', slug: 'level5' },
];

export const SCHEMATIC_BRAND_TO_SLUG = Object.fromEntries(
  SCHEMATIC_BRANDS.map(({ name, slug }) => [name, slug])
);

export const SCHEMATIC_SLUG_TO_BRAND = Object.fromEntries(
  SCHEMATIC_BRANDS.map(({ name, slug }) => [slug, name])
);
