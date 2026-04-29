import { expect } from 'chai'
import sinon from 'sinon'
import fs from 'fs'
import path from 'path'
import os from 'os'
import {
  pickActingHelper,
  traceDirFor,
  snapshotDirFor,
  artifactLinks,
  fileToUrl,
  artifactsToFileUrls,
  writeTraceMarkdown,
  captureSnapshot,
} from '../../../lib/utils/trace.js'

function makeTmpDir(prefix = 'trace-test') {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `${prefix}-`))
  return dir
}

function rmDir(dir) {
  try { fs.rmSync(dir, { recursive: true, force: true }) } catch {}
}

describe('lib/utils/trace.js', () => {
  describe('pickActingHelper', () => {
    it('returns the first STANDARD_ACTING_HELPER present', () => {
      const helpers = { Playwright: { id: 'pw' }, Custom: { id: 'c' } }
      expect(pickActingHelper(helpers)).to.deep.equal({ id: 'pw' })
    })

    it('falls through to next standard helper when first is missing', () => {
      const helpers = { WebDriver: { id: 'wd' } }
      expect(pickActingHelper(helpers)).to.deep.equal({ id: 'wd' })
    })

    it('returns null when no standard helper is configured', () => {
      expect(pickActingHelper({})).to.be.null
      expect(pickActingHelper({ Custom: {} })).to.be.null
    })
  })

  describe('traceDirFor', () => {
    it('produces an absolute path under the base dir', () => {
      const dir = traceDirFor('/path/to/test.js', 'My Test', '/base')
      expect(dir.startsWith('/base/trace_')).to.be.true
    })

    it('is deterministic for the same (file, title)', () => {
      const a = traceDirFor('/test.js', 'Same', '/base')
      const b = traceDirFor('/test.js', 'Same', '/base')
      expect(a).to.equal(b)
    })

    it('differs when the file or title differs', () => {
      const a = traceDirFor('/a.js', 'T', '/base')
      const b = traceDirFor('/b.js', 'T', '/base')
      const c = traceDirFor('/a.js', 'U', '/base')
      expect(a).to.not.equal(b)
      expect(a).to.not.equal(c)
    })

    it('sanitizes characters that clearString rewrites (space, slash, angle brackets, quote)', () => {
      const dir = traceDirFor('/t.js', 'My <Awesome> "test" / step', '/base')
      expect(dir).to.not.include(' ')
      expect(dir).to.not.include('"')
      expect(dir).to.not.include('<')
      expect(dir).to.not.include('>')
      // forward slash inside the title gets replaced; the leading "/base/trace_" path separator remains
      const title = dir.slice('/base/trace_'.length)
      expect(title).to.not.include('/')
    })

    it('handles missing file/title gracefully', () => {
      const dir = traceDirFor(undefined, undefined, '/base')
      expect(dir.startsWith('/base/trace__')).to.be.true
    })
  })

  describe('snapshotDirFor', () => {
    it('produces a unique path per call', () => {
      const a = snapshotDirFor('/base')
      const b = snapshotDirFor('/base')
      expect(a).to.not.equal(b)
      expect(a.startsWith('/base/snapshot_')).to.be.true
    })

    it('embeds a timestamp', () => {
      const dir = snapshotDirFor('/base')
      const stamp = parseInt(dir.match(/snapshot_(\d+)_/)[1], 10)
      expect(stamp).to.be.closeTo(Date.now(), 5_000)
    })
  })

  describe('artifactLinks', () => {
    it('renders only present artifacts in fixed order', () => {
      const out = artifactLinks({
        screenshot: 's.png',
        html: 'p.html',
      })
      const lines = out.split('\n')
      expect(lines).to.have.length(2)
      expect(lines[0]).to.equal('  > [HTML](./p.html)')
      expect(lines[1]).to.equal('  > [Screenshot](./s.png)')
    })

    it('appends entry count for console artifact', () => {
      const out = artifactLinks({ console: 'c.json', consoleCount: 7 })
      expect(out).to.equal('  > [Browser Logs](./c.json) (7 entries)')
    })

    it('uses explicit consoleCount override over artifacts.consoleCount', () => {
      const out = artifactLinks({ console: 'c.json', consoleCount: 1 }, { consoleCount: 99 })
      expect(out).to.include('(99 entries)')
    })

    it('appends cookie + localStorage counts for storage artifact', () => {
      const out = artifactLinks({
        storage: 'st.json',
        cookieCount: 3,
        localStorageCount: 5,
      })
      expect(out).to.equal('  > [Storage](./st.json) (3 cookies, 5 localStorage)')
    })

    it('renders zero counts when storage exists but counts are missing', () => {
      const out = artifactLinks({ storage: 's.json' })
      expect(out).to.include('(0 cookies, 0 localStorage)')
    })

    it('respects custom indent', () => {
      const out = artifactLinks({ html: 'p.html' }, { indent: '' })
      expect(out).to.equal('> [HTML](./p.html)')
    })

    it('returns empty string when nothing renderable is present', () => {
      expect(artifactLinks({})).to.equal('')
      expect(artifactLinks({ url: 'http://x' })).to.equal('')
    })

    it('renders all five artifact types in the correct order', () => {
      const out = artifactLinks({
        screenshot: 's.png',
        console: 'c.json',
        consoleCount: 2,
        html: 'p.html',
        aria: 'a.txt',
        storage: 'st.json',
        cookieCount: 1,
        localStorageCount: 4,
      })
      const lines = out.split('\n')
      expect(lines.map(l => l.match(/\[([^\]]+)\]/)[1])).to.deep.equal([
        'HTML', 'ARIA', 'Screenshot', 'Browser Logs', 'Storage',
      ])
    })
  })

  describe('fileToUrl', () => {
    it('joins dir + basename and prefixes with file://', () => {
      expect(fileToUrl('/output/run', 'p.html')).to.equal('file:///output/run/p.html')
    })

    it('encodes spaces and special characters via pathToFileURL', () => {
      const url = fileToUrl('/output/run dir', 'p age.html')
      expect(url).to.equal('file:///output/run%20dir/p%20age.html')
    })
  })

  describe('artifactsToFileUrls', () => {
    it('rewrites every basename to a file:// URL under the dir', () => {
      const out = artifactsToFileUrls({
        url: 'http://example.com',
        screenshot: 's.png',
        html: 'p.html',
        aria: 'a.txt',
        console: 'c.json',
        storage: 'st.json',
        consoleCount: 3,
        cookieCount: 1,
        localStorageCount: 2,
      }, '/dir')

      expect(out.url).to.equal('http://example.com')
      expect(out.screenshot).to.equal('file:///dir/s.png')
      expect(out.html).to.equal('file:///dir/p.html')
      expect(out.aria).to.equal('file:///dir/a.txt')
      expect(out.console).to.equal('file:///dir/c.json')
      expect(out.storage).to.equal('file:///dir/st.json')
      expect(out.consoleCount).to.equal(3)
      expect(out.cookieCount).to.equal(1)
      expect(out.localStorageCount).to.equal(2)
    })

    it('omits absent artifacts', () => {
      const out = artifactsToFileUrls({ url: 'http://x', html: 'p.html' }, '/d')
      expect(out).to.have.keys(['url', 'html'])
    })
  })

  describe('writeTraceMarkdown', () => {
    let dir

    beforeEach(() => { dir = makeTmpDir('trace-md') })
    afterEach(() => rmDir(dir))

    it('writes trace.md with header, commands, and final state links', () => {
      const file = writeTraceMarkdown({
        dir,
        title: 'run_code',
        file: 'mcp',
        durationMs: 2500,
        commands: ['I.amOnPage("/")', 'I.click("a")'],
        captured: {
          url: 'https://example.com/',
          html: 'p.html',
          aria: 'a.txt',
          screenshot: 's.png',
          console: 'c.json',
          consoleCount: 1,
        },
      })
      expect(file).to.equal(path.join(dir, 'trace.md'))
      const md = fs.readFileSync(file, 'utf8')
      expect(md).to.include('file: mcp\n')
      expect(md).to.include('name: run_code\n')
      expect(md).to.include('time: 2.50s\n')
      expect(md).to.include('### Commands\n- I.amOnPage("/")\n- I.click("a")')
      expect(md).to.include('### Final State')
      expect(md).to.include('  > URL: https://example.com/')
      expect(md).to.include('  > [HTML](./p.html)')
      expect(md).to.include('  > [Browser Logs](./c.json) (1 entries)')
    })

    it('emits an Error block when error is provided', () => {
      writeTraceMarkdown({
        dir, title: 't', file: 'f', durationMs: 0, commands: [], captured: {},
        error: 'boom',
      })
      const md = fs.readFileSync(path.join(dir, 'trace.md'), 'utf8')
      expect(md).to.include('Error: boom')
    })

    it('omits Commands section when commands is empty', () => {
      writeTraceMarkdown({
        dir, title: 't', file: 'f', durationMs: 0, commands: [], captured: { url: 'http://x' },
      })
      const md = fs.readFileSync(path.join(dir, 'trace.md'), 'utf8')
      expect(md).to.not.include('### Commands')
    })

    it('defaults file to "mcp" when not provided', () => {
      writeTraceMarkdown({ dir, title: 't', durationMs: 0, commands: [], captured: {} })
      const md = fs.readFileSync(path.join(dir, 'trace.md'), 'utf8')
      expect(md).to.include('file: mcp\n')
    })
  })

  describe('captureSnapshot', () => {
    let dir

    beforeEach(() => { dir = makeTmpDir('cap') })
    afterEach(() => rmDir(dir))

    function fullHelper(overrides = {}) {
      return {
        grabCurrentUrl: sinon.stub().resolves('https://example.com/'),
        saveScreenshot: sinon.stub().callsFake(async file => fs.writeFileSync(file, 'fake-png')),
        grabSource: sinon.stub().resolves('<html><body><div>hi</div></body></html>'),
        grabAriaSnapshot: sinon.stub().resolves('main\n  - text "hi"'),
        grabBrowserLogs: sinon.stub().resolves(['log line']),
        grabStorageState: sinon.stub().resolves({
          cookies: [{ name: 'sid', value: 'abc' }],
          origins: [{ origin: 'https://example.com', localStorage: [{ name: 'k', value: 'v' }] }],
        }),
        ...overrides,
      }
    }

    it('returns empty object when helper is null/undefined', async () => {
      expect(await captureSnapshot(null, { dir })).to.deep.equal({})
      expect(await captureSnapshot(undefined, { dir })).to.deep.equal({})
    })

    it('captures all artifact types with default options', async () => {
      const helper = fullHelper()
      const out = await captureSnapshot(helper, { dir, prefix: 'p' })

      expect(out.url).to.equal('https://example.com/')
      expect(out.screenshot).to.equal('p_screenshot.png')
      expect(out.html).to.equal('p_page.html')
      expect(out.aria).to.equal('p_aria.txt')
      expect(out.console).to.equal('p_console.json')
      expect(out.consoleCount).to.equal(1)
      expect(out.storage).to.equal('p_storage.json')
      expect(out.cookieCount).to.equal(1)
      expect(out.localStorageCount).to.equal(1)

      expect(fs.existsSync(path.join(dir, 'p_screenshot.png'))).to.be.true
      expect(fs.existsSync(path.join(dir, 'p_page.html'))).to.be.true
      expect(fs.existsSync(path.join(dir, 'p_aria.txt'))).to.be.true
      expect(fs.existsSync(path.join(dir, 'p_console.json'))).to.be.true
      expect(fs.existsSync(path.join(dir, 'p_storage.json'))).to.be.true
    })

    it('respects each capture* option independently', async () => {
      const helper = fullHelper()
      const out = await captureSnapshot(helper, {
        dir,
        prefix: 'q',
        captureURL: false,
        captureScreenshot: false,
        captureHTML: false,
        captureARIA: false,
        captureBrowserLogs: false,
        captureStorage: false,
      })
      expect(out).to.deep.equal({})
      expect(helper.grabCurrentUrl.called).to.be.false
      expect(helper.saveScreenshot.called).to.be.false
      expect(helper.grabSource.called).to.be.false
      expect(helper.grabAriaSnapshot.called).to.be.false
      expect(helper.grabBrowserLogs.called).to.be.false
      expect(helper.grabStorageState.called).to.be.false
    })

    it('passes fullPage flag to saveScreenshot', async () => {
      const helper = fullHelper()
      await captureSnapshot(helper, { dir, prefix: 'p', fullPage: true })
      expect(helper.saveScreenshot.firstCall.args[1]).to.be.true
    })

    it('runs HTML through formatHtml (multi-line, trash classes stripped)', async () => {
      const helper = fullHelper({
        grabSource: sinon.stub().resolves('<html><head><style>x{}</style></head><body><div class="text-sm my-real-class" style="color:red">hi</div></body></html>'),
      })
      await captureSnapshot(helper, { dir, prefix: 'p' })
      const html = fs.readFileSync(path.join(dir, 'p_page.html'), 'utf8')
      expect(html).to.not.include('<style')
      expect(html).to.not.include('text-sm')
      expect(html).to.not.include('style=')
      expect(html).to.include('my-real-class')
      expect(html.split('\n').length).to.be.greaterThan(2)
    })

    it('exposes pre-cleanup HTML in out.htmlRaw for class-scanning consumers', async () => {
      const raw = '<html><body><div class="text-error alert-1">boom</div></body></html>'
      const helper = fullHelper({ grabSource: sinon.stub().resolves(raw) })
      const out = await captureSnapshot(helper, { dir, prefix: 'p' })
      expect(out.htmlRaw).to.equal(raw)
      const formatted = fs.readFileSync(path.join(dir, 'p_page.html'), 'utf8')
      expect(formatted).to.not.include('text-error')
      expect(formatted).to.not.include('alert-1')
    })

    it('normalizes Playwright ConsoleMessage objects to {type, text}', async () => {
      const playwrightLog = {
        type: () => 'error',
        text: () => 'oops',
      }
      const helper = fullHelper({
        grabBrowserLogs: sinon.stub().resolves([playwrightLog, 'plain string']),
      })
      await captureSnapshot(helper, { dir, prefix: 'p' })
      const logs = JSON.parse(fs.readFileSync(path.join(dir, 'p_console.json'), 'utf8'))
      expect(logs[0]).to.deep.equal({ type: 'error', text: 'oops' })
      expect(logs[1]).to.equal('plain string')
    })

    it('uses Playwright grabStorageState when available', async () => {
      const helper = fullHelper()
      await captureSnapshot(helper, { dir, prefix: 'p' })
      expect(helper.grabStorageState.calledOnce).to.be.true
      const state = JSON.parse(fs.readFileSync(path.join(dir, 'p_storage.json'), 'utf8'))
      expect(state.cookies).to.have.length(1)
      expect(state.origins[0].localStorage).to.have.length(1)
    })

    it('falls back to grabCookie + executeScript when grabStorageState is absent', async () => {
      const helper = {
        grabCurrentUrl: sinon.stub().resolves('https://example.com/'),
        grabCookie: sinon.stub().resolves([{ name: 'a', value: 'b' }]),
        executeScript: sinon.stub().resolves({
          origin: 'https://example.com',
          items: [{ name: 'k', value: 'v' }],
        }),
      }
      const out = await captureSnapshot(helper, { dir, prefix: 'p' })
      expect(out.cookieCount).to.equal(1)
      expect(out.localStorageCount).to.equal(1)
      const state = JSON.parse(fs.readFileSync(path.join(dir, 'p_storage.json'), 'utf8'))
      expect(state.cookies).to.deep.equal([{ name: 'a', value: 'b' }])
      expect(state.origins[0].localStorage).to.deep.equal([{ name: 'k', value: 'v' }])
    })

    it('omits storage artifact when both cookies and localStorage are empty', async () => {
      const helper = {
        grabCurrentUrl: sinon.stub().resolves('about:blank'),
        grabCookie: sinon.stub().resolves([]),
        executeScript: sinon.stub().resolves({ origin: 'about:blank', items: [] }),
      }
      const out = await captureSnapshot(helper, { dir, prefix: 'p' })
      expect(out).to.not.have.property('storage')
      expect(fs.existsSync(path.join(dir, 'p_storage.json'))).to.be.false
    })

    it('skips capture branches when helper method is missing', async () => {
      const helper = { grabCurrentUrl: sinon.stub().resolves('http://x') }
      const out = await captureSnapshot(helper, { dir, prefix: 'p' })
      expect(out).to.deep.equal({ url: 'http://x' })
    })

    it('swallows errors from individual grabs', async () => {
      const helper = fullHelper({
        grabCurrentUrl: sinon.stub().rejects(new Error('nope')),
        grabSource: sinon.stub().rejects(new Error('boom')),
      })
      const out = await captureSnapshot(helper, { dir, prefix: 'p' })
      expect(out).to.not.have.property('url')
      expect(out).to.not.have.property('html')
      // Other captures still succeed
      expect(out.aria).to.equal('p_aria.txt')
      expect(out.screenshot).to.equal('p_screenshot.png')
    })

    it('uses default prefix "snapshot" when not specified', async () => {
      const helper = fullHelper()
      const out = await captureSnapshot(helper, { dir })
      expect(out.html).to.equal('snapshot_page.html')
    })
  })
})
