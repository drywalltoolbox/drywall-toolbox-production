import fs from 'fs/promises'
import path from 'path'
import { parse } from 'csv-parse/sync'

function escapeCsvField(value) {
  if (value == null) return ''
  const s = String(value)
  if (/[",\n\r]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"'
  }
  return s
}

function formatCurrency(n) {
  if (n == null || Number.isNaN(Number(n))) return ''
  return `$${Number(n).toFixed(2)}`
}

function parsePrice(raw) {
  if (raw == null) return NaN
  const s = String(raw).trim()
  if (s === '') return NaN
  const cleaned = s.replace(/[^0-9.-]/g, '')
  if (cleaned === '' || cleaned === '.' || cleaned === '-') return NaN
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : NaN
}

async function main() {
  const args = globalThis.process.argv.slice(2)
  const priceFile = args[0] || path.resolve(globalThis.process.cwd(), 'price_scout.csv')
  const catalogFile = args[1] || path.resolve(globalThis.process.cwd(), 'public', 'products_catalog.csv')

  const resolvedPrice = path.resolve(priceFile)
  const resolvedCatalog = path.resolve(catalogFile)

  // Read price scout
  const priceRaw = await fs.readFile(resolvedPrice, 'utf8')
  const priceRows = parse(priceRaw, { columns: true, skip_empty_lines: true })

  // Build map by normalized SKU
  const priceMap = new Map()
  for (const r of priceRows) {
    const sku = r.sku ? String(r.sku).trim() : ''
    if (!sku) continue
    const num = parsePrice(r.price_numeric != null && String(r.price_numeric).trim() !== '' ? r.price_numeric : r.price)
    if (Number.isNaN(num)) continue
    priceMap.set(sku.toLowerCase(), { price: formatCurrency(num), price_numeric: String(num) })
  }

  if (!priceMap.size) {
    console.log('No valid price entries found in', resolvedPrice)
    return
  }

  // Backup catalog
  const now = new Date().toISOString().replace(/[:.]/g, '-')
  const backupPath = resolvedCatalog.replace(/\.csv$/i, `.${now}.bak.csv`)
  await fs.copyFile(resolvedCatalog, backupPath)
  console.log('Backup created:', backupPath)

  // Read catalog and update
  const catalogRaw = await fs.readFile(resolvedCatalog, 'utf8')
  const catalogRows = parse(catalogRaw, { columns: true, skip_empty_lines: false })
  const headers = Object.keys(catalogRows[0] || {})

  let updated = 0
  for (const row of catalogRows) {
    const sku = row.sku ? String(row.sku).trim() : ''
    if (!sku) continue
    const key = sku.toLowerCase()
    if (priceMap.has(key)) {
      const p = priceMap.get(key)
      // Only update when we have a valid numeric price
      const prevNumeric = parsePrice(row.price_numeric != null && String(row.price_numeric).trim() !== '' ? row.price_numeric : row.price)
      const newNumeric = parsePrice(p.price_numeric)
      if (Number.isNaN(newNumeric)) continue
      // If previous is same as new, skip
      if (!Number.isNaN(prevNumeric) && Number(prevNumeric) === Number(newNumeric)) continue
      row.price = p.price
      row.price_numeric = p.price_numeric
      updated++
    }
  }

  // Serialize back to CSV, preserving header order
  const outLines = []
  if (headers.length === 0 && catalogRows.length > 0) {
    // Fallback: use keys of first row
    const h = Object.keys(catalogRows[0])
    outLines.push(h.map(escapeCsvField).join(','))
    for (const r of catalogRows) {
      outLines.push(h.map(k => escapeCsvField(r[k])).join(','))
    }
  } else {
    outLines.push(headers.map(escapeCsvField).join(','))
    for (const r of catalogRows) {
      outLines.push(headers.map(k => escapeCsvField(r[k])).join(','))
    }
  }

  await fs.writeFile(resolvedCatalog, outLines.join('\n'), 'utf8')
  console.log(`Updated ${updated} rows in ${resolvedCatalog}`)
}

main().catch(err => {
  console.error(err)
  globalThis.process.exitCode = 1
})
