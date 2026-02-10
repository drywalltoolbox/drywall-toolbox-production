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

async function findLatestBackup(publicDir) {
  const files = await fs.readdir(publicDir)
  const bak = files.filter(f => /\.bak\.csv$/i.test(f))
  if (!bak.length) return null
  let latest = null
  let latestMtime = 0
  for (const f of bak) {
    const stat = await fs.stat(path.join(publicDir, f))
    const m = stat.mtimeMs
    if (m > latestMtime) {
      latestMtime = m
      latest = f
    }
  }
  return latest ? path.join(publicDir, latest) : null
}

async function main() {
  const publicDir = path.resolve(globalThis.process.cwd(), 'public')
  const prodPath = path.join(publicDir, 'products_catalog.csv')
  const backupPath = await findLatestBackup(publicDir)
  if (!backupPath) {
    console.error('No backup .bak.csv found in public/; cannot compare')
  globalThis.process.exitCode = 2
    return
  }

  const prodRaw = await fs.readFile(prodPath, 'utf8')
  const backupRaw = await fs.readFile(backupPath, 'utf8')
  const prodRows = parse(prodRaw, { columns: true, skip_empty_lines: false })
  const backupRows = parse(backupRaw, { columns: true, skip_empty_lines: false })

  const backupMap = new Map()
  for (const r of backupRows) {
    const sku = r.sku ? String(r.sku).trim().toLowerCase() : ''
    if (!sku) continue
    backupMap.set(sku, r)
  }

  const changes = []
  for (const r of prodRows) {
    const sku = r.sku ? String(r.sku).trim().toLowerCase() : ''
    if (!sku) continue
    const before = backupMap.get(sku)
    if (!before) continue
    const oldP = before.price ?? ''
    const oldN = before.price_numeric ?? ''
    const newP = r.price ?? ''
    const newN = r.price_numeric ?? ''
    if (oldP !== newP || oldN !== newN) {
      changes.push({ sku, brand: r.brand || before.brand || '', name: r.name || before.name || '', old_price: oldP, old_price_numeric: oldN, new_price: newP, new_price_numeric: newN })
    }
  }

  const now = new Date().toISOString().replace(/[:.]/g, '-')
  const outPath = path.join(publicDir, `migration_report_updates_${now}.csv`)
  const lines = [ ['sku','brand','name','old_price','old_price_numeric','new_price','new_price_numeric'].map(escapeCsvField).join(',') ]
  for (const c of changes) {
    lines.push([c.sku, c.brand, c.name, c.old_price, c.old_price_numeric, c.new_price, c.new_price_numeric].map(escapeCsvField).join(','))
  }
  await fs.writeFile(outPath, lines.join('\n'), 'utf8')
  console.log(`Found ${changes.length} changed rows. Report written to: ${outPath}`)
}

main().catch(err => {
  console.error(err)
  globalThis.process.exitCode = 1
})
