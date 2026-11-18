#!/usr/bin/env node
// Runs the bench_test.js scenario suite N times against each engine's config (BENCH_ENGINES=Moli,Kitesurf to pick), timing the whole
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

const allEngines = [
  { name: 'Playwright', config: 'codecept.playwright.bench.js' },
  { name: 'Obscura', config: 'codecept.obscura.bench.js' },
  { name: 'Lightpanda', config: 'codecept.lightpanda.bench.js' },
  { name: 'Moli', config: 'codecept.moli.bench.js' },
  { name: 'Kitesurf', config: 'codecept.kitesurf.bench.js' },
]
const selected = (process.env.BENCH_ENGINES || '').split(',').filter(Boolean)
const engines = allEngines.filter(e => !selected.length || selected.includes(e.name))

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
    if (times.length) results[engine.name] = { times, median: median(times) }
  }

  console.log('\n=== Summary ===')
  const baseline = results.Playwright && results.Playwright.median
  for (const engine of engines) {
    const r = results[engine.name]
    if (!r) {
      console.log(`${engine.name}: no successful runs`)
      continue
    }
    let line = `${engine.name}: median ${r.median}ms  (runs: ${r.times.join(', ')}ms)`
    if (baseline) line += `  ${(baseline / r.median).toFixed(2)}x vs Playwright`
    console.log(line)
  }
}

main()
