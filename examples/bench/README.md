# Engine benchmark

Runs `bench_test.js` (10 scenarios: navigation, clicks, forms, a short wait) against each engine and reports the median wall-clock time of the whole `codecept run`, engine startup included.

## Run

Start the test app from the repository root:

```sh
php -S 127.0.0.1:8000 -t test/data/app
```

Kitesurf is not started by the helper. Build and start it following the [Kitesurf README](https://github.com/cloudflare/kitesurf#run-locally) and point `KITESURF_ENDPOINT` at it.

```sh
cd examples/bench
node run-bench.mjs
```

| Variable | Default | |
|---|---|---|
| `BENCH_RUNS` | `3` | runs per engine |
| `BENCH_ENGINES` | all | comma-separated subset, e.g. `Moli,Kitesurf` |
| `SITE_URL` | `http://127.0.0.1:8000` | test app |
| `KITESURF_ENDPOINT` | `http://127.0.0.1:8787` | local Kitesurf engine |
| `OBSCURA_PATH`, `LIGHTPANDA_PATH`, `MOLI_PATH` | `PATH` lookup | engine binaries |

## Results

2026-11-15, Linux x86_64, 5–7 runs per engine. Obscura 0.2.4, Lightpanda 1.0.0, Moli 1.1.17, Kitesurf 2026.11.9 (local `wrangler dev`), Playwright Chromium.

| Engine | Median run | vs Playwright | Typical scenario | Peak engine memory |
|---|---|---|---|---|
| Lightpanda | 1.34 s | 4.2x faster | 10–50 ms | 31 MB |
| Moli | 1.45 s | 3.9x faster | 25–60 ms | 66 MB |
| Obscura | 1.55 s | 3.7x faster | 40–75 ms | 47 MB |
| Playwright | 5.65 s | 1.0x | 250 ms–1.3 s | 1.3 GB |
| Kitesurf | 5.99 s | 0.94x | 300–900 ms | 1.7 GB |

The Kitesurf time excludes its engine startup (about 25 s cold for `wrangler dev`), since the helper attaches to a running engine.

Raw CDP timings, with CodeceptJS out of the loop:

| | Kitesurf | Moli |
|---|---|---|
| `Page.navigate` until `load` | ~215 ms | ~8 ms |
| navigate to `data:text/html,<p>hi</p>` | ~200 ms | — |
| `Runtime.evaluate` reading the DOM | 15–35 ms | 2–5 ms |
| `Runtime.evaluate('1+1')` | 0.6 ms | 0.5 ms |

Kitesurf starts a fresh isolated page worker on every `Page.navigate` and runs page JavaScript in Boa compiled to WebAssembly, so each navigation has a fixed cost of about 200 ms regardless of the page. Cloudflare Browser Run was not measured.

## Feature coverage

Shared `test/helper/webapi.js` suite on CI. 49 skips are common to all CDP engines (iframes, tabs, popups); the last column counts the rest.

| Engine | Passed | Skipped | Engine-specific skips | Main gaps |
|---|---|---|---|---|
| Moli | 282 | 59 | ~10 | screenshots, coordinate clicks, upload MIME type |
| Kitesurf | 265 | 71 | ~21 | Quill/Trix/ACE editors, upload, clipboard, Base UI radio |
| Lightpanda | 262 | 79 | ~30 | screenshots, scrolling, coordinate clicks, CSS, clipboard, editors |
| Obscura | 253 | 85 | ~34 | upload, clipboard, focus/blur, nested shadow DOM, multi-select, editors |
