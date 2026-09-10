import axios from 'axios'
import CDPBrowser from './CDPBrowser.js'

/**
 * ## Configuration
 *
 * This helper should be configured in codecept.conf.js. It accepts everything `CDPBrowser`
 * accepts (see its config table), plus:
 *
 * @typedef KitesurfConfig
 * @type {object}
 * @prop {string} [url=http://localhost] - base URL for tests
 * @prop {string} [accountId] - Cloudflare account ID; defaults to CF_ACCOUNT_ID env var
 * @prop {string} [apiToken] - Cloudflare API token; defaults to CF_API_TOKEN env var
 * @prop {number} [keepAlive=240000] - session keep-alive time in milliseconds
 * @prop {string} [apiBase=https://api.cloudflare.com/client/v4] - Cloudflare API base URL
 * @prop {string} [input=cdp] - input method for user actions; defaults to 'cdp' for Kitesurf's real layout engine, but can be overridden
 * @prop {object} [capabilities] - pre-configured capabilities; Kitesurf uses { layout: 'real', screenshot: true }
 */
const config = {}

/**
 * Kitesurf is a cloud browser helper that extends CDPBrowser to run tests against
 * Cloudflare's Browser Run service (Kitesurf browser). It automates real browser
 * sessions in Cloudflare's cloud infrastructure, eliminating the need to manage
 * local browser instances.
 *
 * **Status:** Beta
 *
 * ## Requirements
 *
 * - Cloudflare account with Browser Run enabled
 * - API token with **Browser Rendering Edit** permission
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
 * ## Example
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
    this.cloudSessionId = null
  }

  /**
   * Acquires a Kitesurf browser session from the Cloudflare Browser Run API and resolves it to
   * the `wss://` debugger URL `CDPConnection` connects to. Overrides `CDPBrowser._resolveEndpoint`,
   * which resolves a fixed local endpoint instead of provisioning a cloud session per test.
   *
   * @returns {Promise<string>} a `wss://` debugger URL ready to be passed to `CDPConnection`.
   * @protected
   */
  async _resolveEndpoint() {
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

  /**
   * Closes the target as `CDPBrowser._finishTest` does, then releases the cloud session acquired
   * in `_resolveEndpoint` via the Cloudflare API so it does not linger for the full `keepAlive`
   * window. The release runs in a `finally` so a rejection while closing the CDP connection still
   * frees the cloud session instead of leaving the browser alive until `keepAlive` expires; the
   * session id is cleared before the request, so a repeated call never releases it twice.
   *
   * @protected
   */
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
