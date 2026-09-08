#!/usr/bin/env node
// Runs the bench_test.js scenario suite N times against each engine's config, timing the whole
// `codecept run` process wall-clock (helper/browser startup included, since that is part of
// real-world speed) and reporting the median per engine plus the ratio between them.
import { spawnSync } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(__dirname, '..', '..')
const codeceptBin = join(repoRoot, 'bin', 'codecept.js')

const RUNS = Number(process.env.BENCH_RUNS || 3)
const SITE_URL = process.env.SITE_URL || 'http://127.0.0.1:8000'

const engines = [
  { name: 'Obscura', config: 'codecept.obscura.bench.js' },
  { name: 'Playwright', config: 'codecept.playwright.bench.js' },
]

function median(nums) {
  const sorted = [...nums].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

async function siteIsUp() {
  try {
    const res = await fetch(SITE_URL + '/')
    return res.status < 500
  } catch (e) {
    return false
  }
}

function runOnce(config) {
  const start = Date.now()
  const result = spawnSync(codeceptBin, ['run', '-c', config], {
    cwd: __dirname,
    env: { ...process.env, SITE_URL },
    encoding: 'utf8',
  })
  const elapsed = Date.now() - start
  return { elapsed, exitCode: result.status, stdout: result.stdout, stderr: result.stderr }
}

async function main() {
  if (!(await siteIsUp())) {
    console.error(`Test app is not reachable at ${SITE_URL}. Start it first:\n  php -S 127.0.0.1:8000 -t test/data/app`)
    process.exit(1)
  }

  const results = {}
  for (const engine of engines) {
    console.log(`\n=== ${engine.name} (${RUNS} runs) ===`)
    const times = []
    for (let i = 1; i <= RUNS; i++) {
      const { elapsed, exitCode, stdout, stderr } = runOnce(engine.config)
      if (exitCode !== 0) {
        console.error(`  run ${i}: FAILED (exit ${exitCode}) in ${elapsed}ms — excluded from median`)
        console.error(stdout?.slice(-2000))
        console.error(stderr?.slice(-2000))
        continue
      }
      console.log(`  run ${i}: ${elapsed}ms`)
      times.push(elapsed)
    }
    if (!times.length) {
      console.error(`  no successful runs for ${engine.name}`)
      process.exit(1)
    }
    results[engine.name] = { times, median: median(times) }
  }

  console.log('\n=== Summary ===')
  for (const engine of engines) {
    const r = results[engine.name]
    console.log(`${engine.name}: median ${r.median}ms  (runs: ${r.times.join(', ')}ms)`)
  }

  const playwrightMedian = results.Playwright.median
  const obscuraMedian = results.Obscura.median
  const ratio = playwrightMedian / obscuraMedian
  console.log(`\nRatio (Playwright median / Obscura median): ${ratio.toFixed(2)}x`)
  console.log(ratio >= 2 ? 'GATE MET: Obscura is at least 2x faster than Playwright.' : 'GATE NOT MET: Obscura is less than 2x faster than Playwright.')
}

main()
