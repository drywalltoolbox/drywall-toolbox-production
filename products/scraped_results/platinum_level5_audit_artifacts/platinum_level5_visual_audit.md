# Platinum ↔ Level5 Schematic Visual Audit

## Result

This audit intentionally blocks unsafe automatic part-label inheritance.

The current Platinum schematic data is not complete enough to truthfully write final part names for every hotspot:

- `platinum-flat-finishing-box-sch`: current JSON has no `parts` entries.
- `platinum-drywall-pump-w-filler-sch`: current JSON has no `parts` entries.
- `platinum-50-corner-roller-handle-sch`: current JSON has only labels `1–4` with empty names/SKUs.
- `platinum-outside-90-degree-corner-roller-sch`: current JSON has numeric labels with duplicates and empty SKUs.

## Visual Findings

### Platinum Flat Finishing Box

Level5 flat-box schematics are valid same-family candidates, especially standard flat boxes `4-764`, `4-765`, `4-766`, and `4-770`.

Do not assign size-specific Level5 names or part numbers until the Platinum flat-box size is known. Use generic component names such as `Flat Box Blade`, `Blade Holder Assembly`, `Front Plate`, `Bottom Plate`, `Axle`, `Pressure Plate`, `Gasket`, and `Dial Assembly` only after visible Platinum callout targets are extracted.

### Platinum Drywall Pump w/Filler

Level5 `4-771` compound pump is a valid same-family candidate. Candidate component classes include pump foot bracket, wrench bracket, pump link, quick-release pin, pump handle, pump head, U-seal, gland, filler body, discharge tube, piston rod, piston cups, pump tube, screen, and foot valve assembly.

Do not apply labels until Platinum pump callouts exist.

### Platinum 50" Corner Roller Handle

Level5 `4-880` Extendable Handle Only, 31in–50in is the closest same-family candidate. Its parts include handle connector, support bracket, corner roller adapter, locking lever, trigger spring, trigger sleeve, tube, and handle end.

Do not map the four Platinum labels by number. A side-by-side exploded-diagram review is required.

### Platinum Outside 90 Degree Corner Roller

Do not map this from Level5 `4-707`.

The Platinum outside 90-degree roller is a four-nylon-roller outside-corner-bead tool. Level5 `4-707` is an inside-corner tape roller with a rectangular head and stainless roller assembly. It is not a defensible source for part-level inheritance.

## Apply Policy

Safe to apply now: none.

Safe to create now:

1. Visual crosswalk CSV with all current candidates and blocked rows.
2. Candidate JSON with acceptable source families and rejected sources.
3. Updated frontend schematic definitions may safely point to the four real Platinum schematic IDs, but part-label JSONs should not be rewritten until visual callout review is complete.

## Next Required Input

To complete final Platinum hotspot names, provide either:

- direct uploaded images/PDFs of the Platinum schematic pages and the Level5 candidate schematic pages, or
- run a local visual-audit script against the repository files and provide the generated side-by-side sheets.

