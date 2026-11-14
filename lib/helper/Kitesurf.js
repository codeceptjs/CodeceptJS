import axios from 'axios'
import CDPBrowser from './CDPBrowser.js'

/**
 * ## Configuration
 *
 * This helper should be configured in codecept.conf.js
 *
 * @typedef KitesurfConfig
 * @type {object}
 * @prop {string} [url=http://localhost] - base URL for tests
 * @prop {string} [endpoint] - CDP endpoint of a Kitesurf engine you run yourself, e.g. `http://127.0.0.1:8787` for a local `pnpm run dev`. When set, the helper connects to it directly and does not use Cloudflare Browser Run.
 * @prop {object} [headers] - headers sent when connecting to `endpoint`, e.g. `CF-Access-Client-Id` and `CF-Access-Client-Secret` for an engine behind Cloudflare Access.
 * @prop {string} [accountId] - Cloudflare account ID; defaults to CF_ACCOUNT_ID env var
 * @prop {string} [apiToken] - Cloudflare API token; defaults to CF_API_TOKEN env var
 * @prop {number} [keepAlive=240000] - session keep-alive time in milliseconds
 * @prop {string} [apiBase=https://api.cloudflare.com/client/v4] - Cloudflare API base URL
 * @prop {string} [input=cdp] - how actions are dispatched: `cdp` (real mouse and keyboard events) or `synthetic` (DOM events).
 * @prop {object} [capabilities] - browser capabilities; Kitesurf sets `{ layout: 'real', screenshot: true }`.
 */
const config = {}

/**
 * Kitesurf drives [Kitesurf](https://github.com/cloudflare/kitesurf), Cloudflare's open-source
 * browser engine that runs on Cloudflare Workers, over the Chrome DevTools Protocol.
 *
 * **Status:** Experimental
 *
 * The helper connects in one of two ways:
 *
 * - **Engine you run** — set `endpoint` to a Kitesurf engine started locally with `pnpm run dev`
 *   (`http://127.0.0.1:8787`) or deployed to your own account. The helper only connects; it never
 *   starts or stops the engine.
 * - **Cloudflare Browser Run** — leave `endpoint` unset and provide `accountId` and `apiToken`.
 *   Every test run opens a cloud session and closes it after the last test.
 *
 * ## Local engine
 *
 * Build and start the engine following the [Kitesurf README](https://github.com/cloudflare/kitesurf#run-locally),
 * then point the helper at it:
 *
 * ```js
 * // codecept.conf.js
 * {
 *   helpers: {
 *     Kitesurf: {
 *       url: 'http://localhost:3000',
 *       endpoint: 'http://127.0.0.1:8787',
 *     }
 *   }
 * }
 * ```
 *
 * ## Cloudflare Browser Run
 *
 * Requires a Cloudflare account with Browser Run enabled and an API token with
 * **Browser Rendering Edit** permission.
 *
 * ## Setup
 *
 * To create an API token with Browser Rendering Edit permission:
 * 1. Log in to your Cloudflare dashboard
 * 2. Go to My Profile > API Tokens
 * 3. Click "Create Token"
 * 4. Use the "Custom token" template
 * 5. Under "Permissions", select "Browser Rendering" > "Edit"
 * 6. Set the account scope to your target account
 * 7. Copy the token and set it as `CF_API_TOKEN` environment variable
 *
 * For more details, see:
 * - [Cloudflare Browser Run Developers Docs](https://developers.cloudflare.com/browser-run/)
 * - [Cloudflare Blog - Kitesurf Announcement](https://blog.cloudflare.com/kitesurf/)
 *
 * ```js
 * // codecept.conf.js
 * {
 *   helpers: {
 *     Kitesurf: {
 *       url: 'https://example.com',
 *       accountId: process.env.CF_ACCOUNT_ID,
 *       apiToken: process.env.CF_API_TOKEN,
 *     }
 *   }
 * }
 * ```
 *
 * Or set environment variables and rely on defaults:
 *
 * ```bash
 * export CF_ACCOUNT_ID="your-account-id"
 * export CF_API_TOKEN="your-api-token"
 * ```
 *
 * <!-- configuration -->
 *
 * ## Methods
 */
class Kitesurf extends CDPBrowser {
  /**
   * @param {KitesurfConfig} config
   */
  constructor(config) {
    super({
      input: 'cdp',
      keepAlive: 240000,
      apiBase: 'https://api.cloudflare.com/client/v4',
      ...config,
      capabilities: { layout: 'real', screenshot: true, ...(config.capabilities || {}) },
    })
    this.options.accountId = this.options.accountId || process.env.CF_ACCOUNT_ID
    this.options.apiToken = this.options.apiToken || process.env.CF_API_TOKEN
    this.selfHosted = Boolean(config && config.endpoint)
    this.cloudSessionId = null
  }

  async _resolveEndpoint() {
    if (this.selfHosted) return super._resolveEndpoint()
    if (!this.options.accountId || !this.options.apiToken) {
      throw new Error('Kitesurf requires accountId and apiToken (or CF_ACCOUNT_ID / CF_API_TOKEN env vars)')
    }
    const url = `${this.options.apiBase}/accounts/${this.options.accountId}/browser-run/devtools/browser?browser=kitesurf&keep_alive=${this.options.keepAlive}`
    const res = await axios.post(url, null, { headers: { Authorization: `Bearer ${this.options.apiToken}` }, validateStatus: () => true })
    const data = res.data
    if (!data || !data.webSocketDebuggerUrl) {
      throw new Error(`Could not acquire Kitesurf session: ${JSON.stringify(data).slice(0, 300)}`)
    }
    this.cloudSessionId = data.sessionId
    this.options.headers = { Authorization: `Bearer ${this.options.apiToken}` }
    return data.webSocketDebuggerUrl
  }

  async _finishTest() {
    try {
      await super._finishTest()
    } finally {
      if (this.cloudSessionId) {
        const sessionId = this.cloudSessionId
        this.cloudSessionId = null
        const url = `${this.options.apiBase}/accounts/${this.options.accountId}/browser-run/devtools/browser/${sessionId}`
        await axios.delete(url, { headers: { Authorization: `Bearer ${this.options.apiToken}` } }).catch(() => null)
      }
    }
  }
}

export default Kitesurf
