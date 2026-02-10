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

function parsePrice(raw) {
  if (raw == null) return NaN
  const s = String(raw).trim()
  if (s === '') return NaN
  const cleaned = s.replace(/[^0-9.-]/g, '')
  if (cleaned === '' || cleaned === '.' || cleaned === '-') return NaN
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : NaN
}

function formatCurrency(n) {
  if (n == null || Number.isNaN(Number(n))) return ''
  return `$${Number(n).toFixed(2)}`
}

async function main() {
  const args = globalThis.process.argv.slice(2)
  const source = args[0] || path.resolve(globalThis.process.cwd(), 'public', 'products_catalog_zero_or_missing_price_minimal_production.csv')
  const target = args[1] || path.resolve(globalThis.process.cwd(), 'public', 'products_catalog.csv')

  const resolvedSource = path.resolve(source)
  const resolvedTarget = path.resolve(target)

  // Read source and filter rows that now have a numeric price
  const sourceRaw = await fs.readFile(resolvedSource, 'utf8')
  const sourceRows = parse(sourceRaw, { columns: true, skip_empty_lines: true })
  const rowsWithPrice = []
  for (const r of sourceRows) {
    const n = parsePrice(r.price_numeric != null && String(r.price_numeric).trim() !== '' ? r.price_numeric : r.price)
    if (!Number.isNaN(n)) {
      rowsWithPrice.push({ ...r, _parsed_price_numeric: String(n), _parsed_price: formatCurrency(n) })
    }
  }

  if (!rowsWithPrice.length) {
    console.log('No rows with valid prices found in', resolvedSource)
    return
  }

  const now = new Date().toISOString().replace(/[:.]/g, '-')
  const filteredPath = path.join(path.dirname(resolvedSource), `products_with_prices_to_migrate_${now}.csv`)
  const headers = Object.keys(rowsWithPrice[0]).filter(h => !h.startsWith('_'))
  // Ensure we include price fields
  if (!headers.includes('price')) headers.push('price')
  if (!headers.includes('price_numeric')) headers.push('price_numeric')

  const outLines = [headers.map(escapeCsvField).join(',')]
  for (const r of rowsWithPrice) {
    // prefer the parsed normalized values for output
    const o = { ...r }
    o.price = r._parsed_price
    o.price_numeric = r._parsed_price_numeric
    outLines.push(headers.map(h => escapeCsvField(o[h])).join(','))
  }
  await fs.writeFile(filteredPath, outLines.join('\n'), 'utf8')
  console.log('Wrote filtered source with prices:', filteredPath, `(${rowsWithPrice.length} rows)`)

  // Backup production
  const backupPath = resolvedTarget.replace(/\.csv$/i, `.${now}.bak.csv`)
  await fs.copyFile(resolvedTarget, backupPath)
  console.log('Backup created:', backupPath)

  // Read production and merge
  const prodRaw = await fs.readFile(resolvedTarget, 'utf8')
  const prodRows = parse(prodRaw, { columns: true, skip_empty_lines: false })
  const prodHeaders = Object.keys(prodRows[0] || {})

  const srcMap = new Map()
  for (const r of rowsWithPrice) {
    const sku = r.sku ? String(r.sku).trim().toLowerCase() : ''
    if (!sku) continue
    srcMap.set(sku, { price: r._parsed_price, price_numeric: r._parsed_price_numeric })
  }

  const changes = []
  let updated = 0
  for (const row of prodRows) {
    const sku = row.sku ? String(row.sku).trim().toLowerCase() : ''
    if (!sku) continue
    if (srcMap.has(sku)) {
      const src = srcMap.get(sku)
      const prevNumeric = parsePrice(row.price_numeric != null && String(row.price_numeric).trim() !== '' ? row.price_numeric : row.price)
      const newNumeric = parsePrice(src.price_numeric)
      if (Number.isNaN(newNumeric)) continue
      if (!Number.isNaN(prevNumeric) && Number(prevNumeric) === Number(newNumeric)) continue
      const before = { price: row.price ?? '', price_numeric: row.price_numeric ?? '' }
      row.price = src.price
      row.price_numeric = src.price_numeric
      changes.push({ sku, brand: row.brand || '', name: row.name || '', old_price: before.price, old_price_numeric: before.price_numeric, new_price: row.price, new_price_numeric: row.price_numeric })
      updated++
    }
  }

  // Write production back
  const prodOut = []
  if (prodHeaders.length === 0 && prodRows.length > 0) {
    const h = Object.keys(prodRows[0])
    prodOut.push(h.map(escapeCsvField).join(','))
    for (const r of prodRows) {
      prodOut.push(h.map(k => escapeCsvField(r[k])).join(','))
    }
  } else {
    prodOut.push(prodHeaders.map(escapeCsvField).join(','))
    for (const r of prodRows) {
      prodOut.push(prodHeaders.map(k => escapeCsvField(r[k])).join(','))
    }
  }
  await fs.writeFile(resolvedTarget, prodOut.join('\n'), 'utf8')
  console.log(`Updated ${updated} rows in ${resolvedTarget}`)

  // Write report
  const reportPath = path.join(path.dirname(resolvedTarget), `migration_report_${now}.csv`)
  const reportLines = [ ['sku','brand','name','old_price','old_price_numeric','new_price','new_price_numeric'].map(escapeCsvField).join(',') ]
  for (const c of changes) reportLines.push([c.sku,c.brand,c.name,c.old_price,c.old_price_numeric,c.new_price,c.new_price_numeric].map(escapeCsvField).join(','))
  await fs.writeFile(reportPath, reportLines.join('\n'), 'utf8')
  console.log(`Wrote migration report: ${reportPath} (${changes.length} rows changed)`)
}

main().catch(err => {
  console.error(err)
  globalThis.process.exitCode = 1
})
