import * as chai from 'chai'
chai.should()
import path from 'path'
import { expect } from 'expect'
import { exec, execSync } from 'child_process'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const runner = path.join(__dirname, '/../../bin/codeceptq.js')
const checkoutHtml = path.join(__dirname, '/../data/checkout.html')
const githubHtml = path.join(__dirname, '/../data/github.html')
const gitlabHtml = path.join(__dirname, '/../data/gitlab.html')
const dragHtml = path.join(__dirname, '/../data/app/drag_drop.html')

const run = args =>
  new Promise(resolve => {
    exec(`node ${runner} ${args}`, (err, stdout, stderr) => {
      resolve({ err, stdout, stderr, code: err ? err.code || 1 : 0 })
    })
  })

const runJson = async args => {
  const r = await run(`${args} --json`)
  let parsed = null
  try {
    parsed = JSON.parse(r.stdout)
  } catch {
    /* leave parsed null */
  }
  return { ...r, parsed }
}

const runWithStdin = (args, html) => {
  try {
    const stdout = execSync(`node ${runner} ${args}`, { input: html, encoding: 'utf8' })
    return { stdout, code: 0, stderr: '' }
  } catch (err) {
    return { stdout: err.stdout?.toString() || '', stderr: err.stderr?.toString() || '', code: err.status }
  }
}

// For long snippets, assert first 50 chars only.
const head = matches => matches.map(m => ({ line: m.line, snippet: m.snippet.slice(0, 50) }))

describe('codeceptq', () => {
  describe('XPath locators', () => {
    it('.//input — finds every input on checkout.html', async () => {
      const { parsed, code } = await runJson(`'.//input' --file ${checkoutHtml}`)
      expect(code).toBe(0)
      expect(parsed.total).toBe(17)
      expect(parsed.matches).toEqual([
        { line: 74, snippet: '<input type="text" class="form-control" placeholder="Promo code">' },
        { line: 87, snippet: '<input type="text" class="form-control" id="firstName" placeholder="" value="" required>' },
        { line: 94, snippet: '<input type="text" class="form-control" id="lastName" placeholder="" value="" required>' },
        { line: 107, snippet: '<input type="text" class="form-control" id="username" placeholder="Username" required>' },
        { line: 116, snippet: '<input type="email" class="form-control" id="email" placeholder="you@example.com">' },
        { line: 124, snippet: '<input type="text" class="form-control" id="address" placeholder="1234 Main St" required>' },
        { line: 132, snippet: '<input type="text" class="form-control" id="address2" placeholder="Apartment or suite">' },
        { line: 158, snippet: '<input type="text" class="form-control" id="zip" placeholder="" required>' },
        { line: 166, snippet: '<input type="checkbox" class="custom-control-input" id="same-address">' },
        { line: 170, snippet: '<input type="checkbox" class="custom-control-input" id="save-info">' },
        { line: 179, snippet: '<input id="credit" name="paymentMethod" type="radio" class="custom-control-input" checked required>' },
        { line: 183, snippet: '<input id="debit" name="paymentMethod" type="radio" class="custom-control-input" required>' },
        { line: 187, snippet: '<input id="paypal" name="paymentMethod" type="radio" class="custom-control-input" required>' },
        { line: 194, snippet: '<input type="text" class="form-control" id="cc-name" placeholder="" required>' },
        { line: 202, snippet: '<input type="text" class="form-control" id="cc-number" placeholder="" required>' },
        { line: 211, snippet: '<input type="text" class="form-control" id="cc-expiration" placeholder="" required>' },
        { line: 218, snippet: '<input type="text" class="form-control" id="cc-cvv" placeholder="" required>' },
      ])
    })

    it('.//input[@type="radio"] — exact 3 radios', async () => {
      const { parsed } = await runJson(`'.//input[@type="radio"]' --file ${checkoutHtml}`)
      expect(parsed.matches).toEqual([
        { line: 179, snippet: '<input id="credit" name="paymentMethod" type="radio" class="custom-control-input" checked required>' },
        { line: 183, snippet: '<input id="debit" name="paymentMethod" type="radio" class="custom-control-input" required>' },
        { line: 187, snippet: '<input id="paypal" name="paymentMethod" type="radio" class="custom-control-input" required>' },
      ])
    })

    it('absolute //input matches every input', async () => {
      const { parsed } = await runJson(`'//input' --file ${checkoutHtml}`)
      expect(parsed.total).toBe(17)
    })

    it('no-match XPath returns exit 1 with empty matches', async () => {
      const { parsed, code } = await runJson(`'.//nonexistent' --file ${checkoutHtml}`)
      expect(code).toBe(1)
      expect(parsed.total).toBe(0)
      expect(parsed.matches).toEqual([])
    })

    it('invalid XPath returns exit 2', async () => {
      const { code, stderr } = await run(`'.//[' --xpath --file ${checkoutHtml}`)
      expect(code).toBe(2)
      expect(stderr).toMatch(/codeceptq:.*XPath/)
    })
  })

  describe('CSS locators', () => {
    it('#firstName resolves to firstName input', async () => {
      const { parsed } = await runJson(`'#firstName' --file ${checkoutHtml}`)
      expect(parsed.xpath).toBe("//*[@id = 'firstName']")
      expect(parsed.matches).toEqual([
        { line: 87, snippet: '<input type="text" class="form-control" id="firstName" placeholder="" value="" required>' },
      ])
    })

    it('.btn-primary resolves to Continue button', async () => {
      const { parsed } = await runJson(`'.btn-primary' --file ${checkoutHtml}`)
      expect(parsed.matches).toEqual([
        { line: 225, snippet: '<button class="btn btn-primary btn-lg btn-block" type="submit">Continue to checkout</button>' },
      ])
    })

    it('[type="email"] resolves to email input', async () => {
      const { parsed } = await runJson(`'[type="email"]' --file ${checkoutHtml}`)
      expect(parsed.matches).toEqual([
        { line: 116, snippet: '<input type="email" class="form-control" id="email" placeholder="you@example.com">' },
      ])
    })

    it('select.custom-select with --css resolves to country + state selects (snippet head)', async () => {
      const { parsed } = await runJson(`'select.custom-select' --css --file ${checkoutHtml}`)
      expect(head(parsed.matches)).toEqual([
        { line: 138, snippet: '<select class="custom-select d-block w-100" id="co' },
        { line: 148, snippet: '<select class="custom-select d-block w-100" id="st' },
      ])
    })

    it('--css forces CSS interpretation', async () => {
      const { parsed } = await runJson(`'#firstName' --css --file ${checkoutHtml}`)
      expect(parsed.matches).toEqual([
        { line: 87, snippet: '<input type="text" class="form-control" id="firstName" placeholder="" value="" required>' },
      ])
    })

    it('--xpath forces XPath interpretation', async () => {
      const { parsed } = await runJson(`'.//*[@id="firstName"]' --xpath --file ${checkoutHtml}`)
      expect(parsed.matches).toEqual([
        { line: 87, snippet: '<input type="text" class="form-control" id="firstName" placeholder="" value="" required>' },
      ])
    })
  })

  describe('--field semantic locator', () => {
    it("'First name' resolves to firstName input via label[for]", async () => {
      const { parsed } = await runJson(`'First name' --field --file ${checkoutHtml}`)
      expect(parsed.matches).toEqual([
        { line: 87, snippet: '<input type="text" class="form-control" id="firstName" placeholder="" value="" required>' },
      ])
    })

    it("'Last name' resolves to lastName input", async () => {
      const { parsed } = await runJson(`'Last name' --field --file ${checkoutHtml}`)
      expect(parsed.matches).toEqual([
        { line: 94, snippet: '<input type="text" class="form-control" id="lastName" placeholder="" value="" required>' },
      ])
    })

    it("'paymentMethod' (name attribute) resolves to all 3 radio inputs", async () => {
      const { parsed } = await runJson(`'paymentMethod' --field --file ${checkoutHtml}`)
      expect(parsed.matches).toEqual([
        { line: 179, snippet: '<input id="credit" name="paymentMethod" type="radio" class="custom-control-input" checked required>' },
        { line: 183, snippet: '<input id="debit" name="paymentMethod" type="radio" class="custom-control-input" required>' },
        { line: 187, snippet: '<input id="paypal" name="paymentMethod" type="radio" class="custom-control-input" required>' },
      ])
    })

    it("'Promo code' (placeholder) resolves to promo input", async () => {
      const { parsed } = await runJson(`'Promo code' --field --file ${checkoutHtml}`)
      expect(parsed.matches).toEqual([
        { line: 74, snippet: '<input type="text" class="form-control" placeholder="Promo code">' },
      ])
    })

    it("'Country' (label) resolves to <select> (snippet head)", async () => {
      const { parsed } = await runJson(`'Country' --field --file ${checkoutHtml}`)
      expect(head(parsed.matches)).toEqual([
        { line: 138, snippet: '<select class="custom-select d-block w-100" id="co' },
      ])
    })
  })

  describe('--click semantic locator', () => {
    it("'Continue to checkout' resolves to primary button", async () => {
      const { parsed } = await runJson(`'Continue to checkout' --click --file ${checkoutHtml}`)
      expect(parsed.matches).toEqual([
        { line: 225, snippet: '<button class="btn btn-primary btn-lg btn-block" type="submit">Continue to checkout</button>' },
      ])
    })

    it("'Redeem' resolves to secondary button", async () => {
      const { parsed } = await runJson(`'Redeem' --click --file ${checkoutHtml}`)
      expect(parsed.matches).toEqual([
        { line: 76, snippet: '<button type="submit" class="btn btn-secondary">Redeem</button>' },
      ])
    })

    it('--clickable is alias for --click', async () => {
      const { parsed } = await runJson(`'Redeem' --clickable --file ${checkoutHtml}`)
      expect(parsed.matches).toEqual([
        { line: 76, snippet: '<button type="submit" class="btn btn-secondary">Redeem</button>' },
      ])
    })

    it("'Sign up' on github fixture matches 4 anchor/button elements (snippet head)", async () => {
      const { parsed } = await runJson(`'Sign up' --click --file ${githubHtml}`)
      expect(parsed.total).toBe(4)
      expect(head(parsed.matches)).toEqual([
        { line: 580, snippet: '<a href="/signup?ref_cta=Sign+up&amp;ref_loc=heade' },
        { line: 710, snippet: '<button class="btn-mktg width-full width-md-auto m' },
        { line: 774, snippet: '<a class="btn-mktg ml-lg-2 mt-2 mt-lg-0 d-block d-' },
        { line: 1780, snippet: '<a class="btn-mktg btn-large-mktg" data-analytics-' },
      ])
    })
  })

  describe('--checkable semantic locator', () => {
    it("'Save this information for next time' resolves to single checkbox input", async () => {
      const { parsed } = await runJson(`'Save this information for next time' --checkable --file ${checkoutHtml}`)
      expect(parsed.matches).toEqual([
        { line: 170, snippet: '<input type="checkbox" class="custom-control-input" id="save-info">' },
      ])
    })

    it("'Credit card' resolves to credit radio input (not the label)", async () => {
      const { parsed } = await runJson(`'Credit card' --checkable --file ${checkoutHtml}`)
      expect(parsed.matches).toEqual([
        { line: 179, snippet: '<input id="credit" name="paymentMethod" type="radio" class="custom-control-input" checked required>' },
      ])
    })
  })

  describe('--select semantic locator', () => {
    it("'United States' resolves to option element", async () => {
      const { parsed } = await runJson(`'United States' --select --file ${checkoutHtml}`)
      expect(parsed.matches).toEqual([{ line: 140, snippet: '<option>United States</option>' }])
    })
  })

  describe('fuzzy auto-detection (no flag)', () => {
    it("'Continue to checkout' (text) auto-detects clickable element", async () => {
      const { parsed } = await runJson(`'Continue to checkout' --file ${checkoutHtml}`)
      expect(parsed.matches).toEqual([
        { line: 225, snippet: '<button class="btn btn-primary btn-lg btn-block" type="submit">Continue to checkout</button>' },
      ])
    })

    it("'First name' fuzzy returns BOTH the label and its input", async () => {
      const { parsed } = await runJson(`'First name' --file ${checkoutHtml}`)
      expect(parsed.matches).toEqual([
        { line: 86, snippet: '<label for="firstName">First name</label>' },
        { line: 87, snippet: '<input type="text" class="form-control" id="firstName" placeholder="" value="" required>' },
      ])
    })

    it("'Save this information for next time' fuzzy returns BOTH input and label", async () => {
      const { parsed } = await runJson(`'Save this information for next time' --file ${checkoutHtml}`)
      expect(parsed.matches).toEqual([
        { line: 170, snippet: '<input type="checkbox" class="custom-control-input" id="save-info">' },
        { line: 171, snippet: '<label class="custom-control-label" for="save-info">Save this information for next time</label>' },
      ])
    })
  })

  describe('context (scope)', () => {
    it('input scoped to #country yields no match', async () => {
      const { parsed, code } = await runJson(`'.//input' '#country' --file ${checkoutHtml}`)
      expect(code).toBe(1)
      expect(parsed.matches).toEqual([])
    })

    it("'Username' --field within '.needs-validation' resolves to username input", async () => {
      const { parsed } = await runJson(`'Username' '.needs-validation' --field --file ${checkoutHtml}`)
      expect(parsed.matches).toEqual([
        { line: 107, snippet: '<input type="text" class="form-control" id="username" placeholder="Username" required>' },
      ])
    })

    it("XPath './/option' scoped to '#country' returns only country options", async () => {
      const { parsed } = await runJson(`'.//option' '#country' --file ${checkoutHtml}`)
      expect(parsed.matches).toEqual([
        { line: 139, snippet: '<option value="">Choose...</option>' },
        { line: 140, snippet: '<option>United States</option>' },
      ])
    })
  })

  describe('--file vs stdin', () => {
    it('reads from --file', async () => {
      const { parsed } = await runJson(`'.//button' --file ${checkoutHtml}`)
      expect(parsed.matches).toEqual([
        { line: 76, snippet: '<button type="submit" class="btn btn-secondary">Redeem</button>' },
        { line: 225, snippet: '<button class="btn btn-primary btn-lg btn-block" type="submit">Continue to checkout</button>' },
      ])
    })

    it('reads from stdin', () => {
      const html = fs.readFileSync(checkoutHtml, 'utf8')
      const { stdout, code } = runWithStdin(`'.//button' --json`, html)
      expect(code).toBe(0)
      const parsed = JSON.parse(stdout)
      expect(parsed.source).toBe('stdin')
      expect(parsed.matches).toEqual([
        { line: 76, snippet: '<button type="submit" class="btn btn-secondary">Redeem</button>' },
        { line: 225, snippet: '<button class="btn btn-primary btn-lg btn-block" type="submit">Continue to checkout</button>' },
      ])
    })

    it('errors with exit 2 when stdin is empty', () => {
      const { code, stderr } = runWithStdin(`'.//input'`, '')
      expect(code).toBe(2)
      expect(stderr).toContain('no HTML input. Pipe HTML via stdin or use --file <path>.')
    })
  })

  describe('output formatting (default text mode)', () => {
    it('default text output for #firstName matches exact block', async () => {
      const { stdout, code } = await run(`'#firstName' --file ${checkoutHtml}`)
      expect(code).toBe(0)
      expect(stdout).toBe(
        `1 match for '#firstName' in ${checkoutHtml}\n` +
          `\n` +
          `1. Line 87\n` +
          `   <input type="text" class="form-control" id="firstName" placeholder="" value="" required>\n` +
          `\n`,
      )
    })

    it('no-match text output includes the resolved xpath', async () => {
      const { stdout, code } = await run(`'#nope' --file ${checkoutHtml}`)
      expect(code).toBe(1)
      expect(stdout).toBe(`No matches for '#nope' in ${checkoutHtml}\n` + `(xpath: //*[@id = 'nope'])\n`)
    })

    it('--limit caps matches and reports "showing first N"', async () => {
      const { parsed, code } = await runJson(`'.//input' --limit 3 --file ${checkoutHtml}`)
      expect(code).toBe(0)
      expect(parsed.total).toBe(17)
      expect(parsed.shown).toBe(3)
      expect(parsed.matches).toEqual([
        { line: 74, snippet: '<input type="text" class="form-control" placeholder="Promo code">' },
        { line: 87, snippet: '<input type="text" class="form-control" id="firstName" placeholder="" value="" required>' },
        { line: 94, snippet: '<input type="text" class="form-control" id="lastName" placeholder="" value="" required>' },
      ])
      const txt = await run(`'.//input' --limit 3 --file ${checkoutHtml}`)
      expect(txt.stdout).toContain('17 matches')
      expect(txt.stdout).toContain('showing first 3')
    })

    it('default snippet truncates long outerHTML with …', async () => {
      const { stdout } = await run(`'.//form' --snippet 80 --file ${checkoutHtml}`)
      expect(stdout).toContain(' …')
      expect(stdout.split('\n').filter(l => l.includes('…')).length).toBe(2)
    })

    it('--full prints complete outerHTML with closing tag', async () => {
      const { stdout, code } = await run(`'.//form[1]' --full --file ${checkoutHtml}`)
      expect(code).toBe(0)
      expect(stdout).not.toContain('…')
      expect(stdout).toContain('<form class="card p-2">')
      expect(stdout).toContain('<input type="text" class="form-control" placeholder="Promo code">')
      expect(stdout).toContain('<button type="submit" class="btn btn-secondary">Redeem</button>')
      expect(stdout).toContain('</form>')
    })
  })

  describe('--json shape', () => {
    it('full document has every documented field', async () => {
      const { parsed } = await runJson(`'#firstName' --file ${checkoutHtml}`)
      expect(parsed).toEqual({
        locator: '#firstName',
        context: null,
        xpath: "//*[@id = 'firstName']",
        contextXPath: null,
        source: checkoutHtml,
        total: 1,
        shown: 1,
        matches: [
          { line: 87, snippet: '<input type="text" class="form-control" id="firstName" placeholder="" value="" required>' },
        ],
      })
    })

    it('zero matches → empty array', async () => {
      const { parsed, code } = await runJson(`'.//does-not-exist' --file ${checkoutHtml}`)
      expect(code).toBe(1)
      expect(parsed.total).toBe(0)
      expect(parsed.matches).toEqual([])
    })

    it('JSON includes contextXPath when context provided', async () => {
      const { parsed } = await runJson(`'.//option' '#country' --file ${checkoutHtml}`)
      expect(parsed.context).toBe('#country')
      expect(parsed.contextXPath).toBe("//*[@id = 'country']")
      expect(parsed.matches).toEqual([
        { line: 139, snippet: '<option value="">Choose...</option>' },
        { line: 140, snippet: '<option>United States</option>' },
      ])
    })
  })

  describe('larger fixtures (smoke)', () => {
    it('drag_drop.html resolves #draggable to multi-line block (snippet head)', async () => {
      const { parsed } = await runJson(`'#draggable' --file ${dragHtml}`)
      expect(head(parsed.matches)).toEqual([{ line: 44, snippet: '<div id="draggable" draggable="true">\n      <p>Dra' }])
    })

    it('gitlab.html .//a returns at least 10 anchors with line numbers', async () => {
      const { parsed, code } = await runJson(`'.//a' --file ${gitlabHtml} --limit 50`)
      expect(code).toBe(0)
      expect(parsed.total).toBeGreaterThan(10)
      parsed.matches.forEach(m => {
        expect(m.line).toBeGreaterThan(0)
        expect(m.snippet).toMatch(/^<a /)
      })
    })

    it('github.html //form yields at least one form with snippet starting with <form', async () => {
      const { parsed, code } = await runJson(`'.//form' --file ${githubHtml} --limit 5`)
      expect(code).toBe(0)
      expect(parsed.total).toBeGreaterThan(0)
      parsed.matches.forEach(m => expect(m.snippet).toMatch(/^<form/))
    })
  })

  describe('CLI errors', () => {
    it('exits non-zero when locator missing', async () => {
      const { code, stderr } = await run('')
      expect(code).not.toBe(0)
      expect(stderr).toContain("missing required argument 'locator'")
    })

    it('--help prints usage with documented flags', async () => {
      const { stdout, code } = await run('--help')
      expect(code).toBe(0)
      expect(stdout).toContain('Usage: codeceptq [options] <locator> [context]')
      expect(stdout).toContain('--field')
      expect(stdout).toContain('--click')
      expect(stdout).toContain('--checkable')
      expect(stdout).toContain('--select')
      expect(stdout).toContain('--xpath')
      expect(stdout).toContain('--css')
      expect(stdout).toContain('--file <path>')
      expect(stdout).toContain('--json')
    })
  })
})
