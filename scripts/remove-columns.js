import fs from 'fs/promises'
import path from 'path'
import { parse } from 'csv-parse/sync'

// Reuse escaping helper
function escapeCsvField(value) {
  if (value == null) return ''
  const s = String(value)
  if (/[",\n\r,]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"'
  }
  return s
}

async function main() {
  const args = globalThis.process.argv.slice(2)
  // default to the already-created minimal CSV and produce a no-description output
  const input = args[0] || path.resolve(globalThis.process.cwd(), 'public', 'products_catalog_zero_or_missing_price_minimal.csv')
  const output = args[1] || path.resolve(globalThis.process.cwd(), 'public', 'products_catalog_zero_or_missing_price_minimal_no_description.csv')

  const resolvedInput = path.resolve(input)
  const resolvedOutput = path.resolve(output)
  if (resolvedInput === resolvedOutput) {
    console.error('Refusing to run: input and output paths are identical. This would overwrite the input file.')
    globalThis.process.exitCode = 2
    return
  }

  const raw = await fs.readFile(resolvedInput, 'utf8')
  const records = parse(raw, { columns: true, skip_empty_lines: true })
  if (!records.length) {
    console.log('No rows found in CSV')
    return
  }

  // Fields to drop
  const drop = new Set([
    'description_short',
    'description_full',
    'image_1','image_2','image_3','image_4','image_5','image_6','image_7','image_8','image_9',
    'all_images'
  ])

  const headers = Object.keys(records[0])
  const outHeaders = headers.filter(h => !drop.has(h))

  const outLines = []
  outLines.push(outHeaders.map(escapeCsvField).join(','))

  for (const row of records) {
    const line = outHeaders.map(h => escapeCsvField(row[h])).join(',')
    outLines.push(line)
  }

  await fs.writeFile(resolvedOutput, outLines.join('\n'), 'utf8')
  console.log(`Wrote ${records.length} rows -> ${resolvedOutput}`)
}

main().catch(err => {
  console.error(err)
  globalThis.process.exitCode = 1
})
