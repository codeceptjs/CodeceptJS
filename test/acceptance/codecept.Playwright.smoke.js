import { config as base } from './codecept.Playwright.js'

// Allowlist of acceptance tests known to pass reliably on the 4.x promise core.
// As promise-core fixes land and a file in plans/002-failing-acceptance.md
// starts passing, move it into this glob. The long-term goal is to delete this
// config and gate on the full codecept.Playwright.js.
export const config = {
  ...base,
  tests: './{els,session,within}_test.js',
  name: 'acceptance-smoke',
}
