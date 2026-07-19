const EXPORT_ENDPOINT = '/wp-json/dtb/v1/calculators/export-pdf'

// Same label maps used in SummaryView's on-screen display / text export —
// kept in sync so the PDF reads identically to the in-app summary.
const SHEET_SIZE_LABELS = { 32: '4×8 ft', 48: '4×12 ft', 54: '4×13.5 ft' }
const HANG_DIR_LABELS = { horizontal: 'Horizontal', vertical: 'Vertical' }
const TAPE_TYPE_LABELS = { paper: 'Paper tape', mesh: 'Fiberglass mesh', flex: 'Flexible corner' }
const BEAD_TYPE_LABELS = { standard: 'Standard metal', bullnose: 'Bullnose', vinyl: 'Vinyl', flex: 'Flexible/arch' }
const APP_LABELS = { wall: 'Walls', ceiling: 'Ceiling', both: 'Walls + Ceiling' }

/**
 * Posts the report payload and triggers a browser download of the returned PDF.
 * @param {object} payload - shape defined in wp-content/mu-plugins/dtb-calculator-pdf/includes/report-template.php
 */
export async function exportCalculatorReportPdf(payload) {
  const response = await fetch(EXPORT_ENDPOINT, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    let message = 'PDF export failed.'
    try {
      const err = await response.json()
      message = err?.message || message
    } catch {
      /* non-JSON error body, keep default message */
    }
    throw new Error(message)
  }

  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const fileSafeName = (payload.project?.jobName || 'estimate').replace(/\s+/g, '_')
  const link = document.createElement('a')
  link.href = url
  link.download = `${fileSafeName}_${new Date().toISOString().slice(0, 10)}.pdf`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

/**
 * Maps CalculatorHub's summaryData object -> report contract.
 * @param {object} data - { sheets, mud, tape, bead, screws, project }
 */
export function buildReportPayload(data) {
  const { sheets = {}, mud = {}, tape = {}, bead = {}, screws = {}, project = {} } = data

  return {
    project: {
      jobName: project.jobName || '',
      jobAddress: project.jobAddress || '',
      contractorName: project.contractorName || '',
      estimatorName: project.estimatorName || '',
      date: new Date().toISOString().slice(0, 10),
      notes: project.notes || '',
    },
    sections: [
      buildSheetsSection(sheets),
      buildMudSection(mud),
      buildTapeSection(tape),
      buildBeadSection(bead),
      buildScrewsSection(screws),
      buildSummarySection({ sheets, mud, tape, bead, screws }),
    ],
  }
}

function buildSheetsSection(sheets) {
  return {
    key: 'sheets',
    title: 'Drywall Sheets',
    inputs: [
      { label: 'Sheet Size', value: SHEET_SIZE_LABELS[sheets.sheetSize] || '—' },
      { label: 'Hang Direction', value: HANG_DIR_LABELS[sheets.hangDir] || '—' },
      {
        label: 'Applied Waste Factor',
        value: sheets.wastePct != null ? `${(sheets.wastePct * 100).toFixed(0)}%` : '—',
      },
    ],
    items: [],
    results: [
      { label: 'Total Wall Area', value: `${sheets.gross ?? '—'} sq ft` },
      { label: 'Net Area (after openings)', value: `${sheets.net ?? '—'} sq ft` },
      { label: 'Base Sheets (no waste)', value: sheets.baseSheets ?? '—' },
      {
        label: 'Dynamic Waste',
        value:
          sheets.dynamicWaste != null
            ? `${Math.round(sheets.dynamicWaste * 100)}% (${sheets.totalVerticalSeams ?? 0} v-seams)`
            : '—',
      },
      { label: 'Total Joint Footage', value: `${sheets.totalJointLinearFeet ?? '—'} lf` },
      { label: 'Sheets Needed', value: sheets.sheets ?? 0, highlight: true },
    ],
  }
}

function buildMudSection(mud) {
  return {
    key: 'mud',
    title: 'Joint Compound',
    inputs: [
      { label: 'Compound Type', value: mud.compoundType || '—' },
      { label: 'Finish Level', value: mud.finishLevel !== undefined ? `Level ${mud.finishLevel}` : '—' },
    ],
    items: [],
    results: [
      { label: 'Total Gallons', value: `${mud.totalGallons ?? '—'} gal` },
      { label: '5-Gal Buckets Needed', value: mud.buckets5gal ?? 0, highlight: true },
    ],
  }
}

function buildTapeSection(tape) {
  return {
    key: 'tape',
    title: 'Joint Tape',
    inputs: [
      { label: 'Tape Type', value: TAPE_TYPE_LABELS[tape.tapeType] || '—' },
      { label: 'Roll Size', value: `${tape.rollSize ?? '—'} ft` },
    ],
    items: [],
    results: [
      {
        label: tape.syncedFromSheets ? 'Joint Footage (layout)' : 'Joint Footage (est.)',
        value: `${tape.seamFeet ?? '—'} ft`,
      },
      { label: 'Corner Footage', value: `${tape.cornerFeet ?? '—'} ft` },
      { label: 'Total Linear Feet', value: `${tape.totalFeet ?? '—'} ft` },
      { label: 'Rolls Needed', value: tape.rolls ?? 0, highlight: true },
    ],
  }
}

function buildBeadSection(bead) {
  return {
    key: 'bead',
    title: 'Corner Bead',
    inputs: [
      { label: 'Bead Type', value: BEAD_TYPE_LABELS[bead.beadType] || '—' },
      { label: 'Stock Length', value: `${bead.stockLength ?? '—'} ft` },
    ],
    items: [],
    results: [
      { label: 'Standard Corners', value: `${bead.standardFeet ?? '—'} ft` },
      { label: 'Arch Bead', value: `${bead.archFeet ?? '—'} ft` },
      { label: 'Total Linear Feet', value: `${bead.totalFeet ?? '—'} ft` },
      { label: 'Sections Needed', value: bead.sections ?? 0, highlight: true },
    ],
  }
}

function buildScrewsSection(screws) {
  return {
    key: 'screws',
    title: 'Drywall Screws',
    inputs: [
      { label: 'Screw Length', value: screws.screwLength || '—' },
      { label: 'Box Size', value: `${screws.boxSize ?? '—'} screws` },
      { label: 'Application', value: APP_LABELS[screws.application] || '—' },
    ],
    items: [],
    results: [
      { label: 'Screws per Sheet', value: screws.perSheet ?? '—' },
      { label: 'Total Screws Needed', value: screws.totalScrews ?? 0 },
      { label: 'Boxes Needed', value: screws.boxes ?? 0, highlight: true },
    ],
  }
}

/**
 * Bill-of-materials rollup for the Summary tab.
 * No cost data exists anywhere in the app (quantities only per README), so this
 * intentionally omits unitCost/lineTotal — the renderer degrades to qty/unit
 * columns automatically when pricing keys are absent.
 */
function buildSummarySection({ sheets, mud, tape, bead, screws }) {
  return {
    key: 'summary',
    title: 'Project Summary',
    inputs: [],
    items: [
      { label: 'Drywall Sheets', qty: sheets.sheets ?? 0, unit: 'sheets' },
      { label: 'Joint Compound', qty: mud.buckets5gal ?? 0, unit: '5-gal buckets' },
      { label: 'Joint Tape', qty: tape.rolls ?? 0, unit: 'rolls' },
      { label: 'Corner Bead', qty: bead.sections ?? 0, unit: 'sections' },
      { label: 'Drywall Screws', qty: screws.boxes ?? 0, unit: 'boxes' },
    ],
    results: [],
  }
}
