import fs from 'fs/promises'
import path from 'path'
import { parse } from 'csv-parse/sync'

// Simple CSV field escaper
function escapeCsvField(value) {
  if (value == null) return ''
  const s = String(value)
  if (/[",\n\r,]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"'
  }
  return s
}

function parsePrice(raw) {
  if (raw == null) return NaN
  const s = String(raw).trim()
  if (s === '') return NaN
  // remove currency symbols and commas
  const cleaned = s.replace(/[^0-9.-]/g, '')
  if (cleaned === '' || cleaned === '.' || cleaned === '-') return NaN
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : NaN
}

async function main() {
  const args = globalThis.process.argv.slice(2)
  const input = args[0] || path.resolve(globalThis.process.cwd(), 'public', 'products_catalog.csv')
  const output = args[1] || path.resolve(globalThis.process.cwd(), 'public', 'products_catalog_zero_or_missing_price.csv')

  const resolvedInput = path.resolve(input)
  const resolvedOutput = path.resolve(output)

  if (resolvedInput === resolvedOutput) {
    console.error('Refusing to run: input and output paths are identical. This would overwrite the original file. Provide a different output path.')
  globalThis.process.exitCode = 2
    return
  }

  const raw = await fs.readFile(resolvedInput, 'utf8')

  // parse CSV with columns=true so we get objects; robust to quoted newlines
  const records = parse(raw, { columns: true, skip_empty_lines: true })

  if (!records.length) {
    console.log('No rows found in CSV')
    return
  }

  const headers = Object.keys(records[0])

  // Determine preferred price fields
  const priceField = headers.find(h => /^price$/i.test(h)) || null
  const numericField = headers.find(h => /price.*numeric/i.test(h)) || null

  const filtered = []

  for (const r of records) {
    let priceNum = NaN
    const numericRaw = numericField ? r[numericField] : undefined
    const priceRaw = priceField ? r[priceField] : undefined

    if (numericRaw != null && String(numericRaw).trim() !== '') {
      const p = parsePrice(numericRaw)
      if (!Number.isNaN(p)) priceNum = p
    }

    if (Number.isNaN(priceNum) && priceRaw != null && String(priceRaw).trim() !== '') {
      priceNum = parsePrice(priceRaw)
    }

    const isMissingOrZero = (
      (priceRaw == null || String(priceRaw).trim() === '') && (numericRaw == null || String(numericRaw).trim() === '')
    ) || priceNum === 0

    if (isMissingOrZero) filtered.push(r)
  }

  // Build CSV output
  const outLines = []
  outLines.push(headers.map(escapeCsvField).join(','))
  for (const row of filtered) {
    const line = headers.map(h => escapeCsvField(row[h])).join(',')
    outLines.push(line)
  }

  // Ensure we write to a NEW file and do not overwrite input
  await fs.writeFile(resolvedOutput, outLines.join('\n'), 'utf8')
  console.log(`Filtered ${filtered.length} rows -> ${resolvedOutput}`)
}

main().catch(err => {
  console.error(err)
  globalThis.process.exitCode = 1
})
