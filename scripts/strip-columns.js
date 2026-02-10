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

async function main() {
  const args = globalThis.process.argv.slice(2)
  if (!args[0]) {
    console.error('Usage: node scripts/strip-columns.js <input.csv> [output.csv] [col1,col2,...]')
    globalThis.process.exitCode = 2
    return
  }

  const input = path.resolve(args[0])
  const output = args[1] ? path.resolve(args[1]) : input.replace(/(\.csv)?$/i, '_cleaned.csv')
  const dropList = args[2] ? args[2].split(',').map(s => s.trim()) : ['retailer','source_url','confidence']

  if (input === output) {
    console.error('Refusing to overwrite input file. Provide a different output filename.')
    globalThis.process.exitCode = 2
    return
  }

  const raw = await fs.readFile(input, 'utf8')
  const records = parse(raw, { columns: true, skip_empty_lines: true })
  if (!records.length) {
    console.log('No rows found in CSV')
    return
  }

  const headers = Object.keys(records[0])
  const drop = new Set(dropList)
  const outHeaders = headers.filter(h => !drop.has(h))

  const outLines = [outHeaders.map(escapeCsvField).join(',')]
  for (const row of records) {
    const line = outHeaders.map(h => escapeCsvField(row[h])).join(',')
    outLines.push(line)
  }

  await fs.writeFile(output, outLines.join('\n'), 'utf8')
  console.log(`Wrote ${records.length} rows -> ${output}`)
}

main().catch(err => {
  console.error(err)
  globalThis.process.exitCode = 1
})
