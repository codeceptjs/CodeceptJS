import fs from 'fs'
import path from 'path'
import { expect } from 'chai'
import { fileURLToPath } from 'url'
import * as cheerio from 'cheerio'
import { scanForErrorMessages, removeNonInteractiveElements, minifyHtml, splitByChunks, cleanHtml, formatHtml, isTrashClass, simplifyHtmlElement } from '../../lib/html.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const opts = {
  interactiveElements: ['a', 'input', 'button', 'select', 'textarea', 'label', 'option'],
  allowedAttrs: ['id', 'for', 'class', 'name', 'type', 'value', 'aria-labelledby', 'aria-label', 'label', 'placeholder', 'title', 'alt', 'src', 'role'],
  allowedRoles: ['button', 'checkbox', 'search', 'textbox', 'tab'],
  textElements: ['label'],
}

describe('HTML module', () => {
  let html

  before(() => {
    // Load HTML from a file
  })

  describe('scanForErrorMessages', () => {
    xit('should scan HTML for error messages', () => {
      // Call the function with the loaded HTML
      const errorMessages = scanForErrorMessages(html)

      // Add your assertions here
      // For example:
      // expect(errorMessages).to.have.lengthOf(3);
      // expect(errorMessages).to.include('Error 1');
      // expect(errorMessages).to.include('Error 2');
    })
  })

  describe('#removeNonInteractiveElements', () => {
    it('should cut out all non-interactive elements from GitHub HTML', async () => {
      html = fs.readFileSync(path.join(__dirname, '../data/github.html'), 'utf8')
      const result = removeNonInteractiveElements(html, opts)

      let $ = cheerio.load(result)

      const nodes = $('input[name="q"]')
      expect(nodes).to.have.length(1)
      expect(result).not.to.include('Let’s build from here')

      const minified = await minifyHtml(result)
      $ = cheerio.load(minified)

      const nodes2 = $('input[name="q"]')
      expect(nodes2).to.have.length(1)
    })

    it('should keep interactive HTML elements', () => {
      html = `
        <div id="onetrust-pc-sdk" class="otPcTab ot-hide ot-fade-in" lang="en" aria-label="Preference center" role="region">
        <div role="alertdialog" aria-modal="true" aria-describedby="ot-pc-desc" style="height: 100%;" aria-label="Privacy Preference Center">
        <!-- pc header --><div class="ot-pc-header" role="presentation">
        <div class="ot-title-cntr">
        <h2 id="ot-pc-title">Privacy Preference Center</h2>
        <div class="ot-close-cntr">
        <button id="close-pc-btn-handler" class="ot-close-icon" aria-label="Close"></button>
        </div>
        </div>
        </div>`
      const result = removeNonInteractiveElements(html, opts)
      expect(result).to.include('<button')
    })

    it('should keep menu bar', async () => {
      html = `<div class="mainnav-menu-body">
      <ul>
        <li>
          <div class="flex">
            <button class="hamburger hamburger--arrowalt outline-none focus:outline-none" style="line-height: 0; margin-top: 3px; margin-bottom: 3px;" type="button">
              <span class="hamburger-box">
                <span class="hamburger-inner"></span>
              </span>
            </button>
          </div>
        </li>
        <li>
        <a id="ember6" class="ember-view flex items-center" href="/projects/codeceptjs-cucumber/runs" aria-describedby="ember7-popper">
          <svg class="md-icon md-icon-play-circle-outline" width="30" height="30" viewBox="0 0 24 24" role="img">
            <path d="aaaa">aaa</path>
          </svg>
        </a>
        </li>
      </ul>
    </div>`
      const result = await minifyHtml(removeNonInteractiveElements(html, opts))
      expect(result).to.include('<button')
      expect(result).to.include('<a')
      expect(result).to.include('<svg')
      expect(result).not.to.include('<path')
    })

    it('should cut out all non-interactive elements from HTML', () => {
      html = fs.readFileSync(path.join(__dirname, '../data/checkout.html'), 'utf8')
      const result = removeNonInteractiveElements(html, opts)
      expect(result).to.include('Name on card')
      expect(result).to.not.include('<script')
    })

    it('should allow adding new elements', () => {
      const html = '<div><h6>Hey</h6></div>'
      const result = removeNonInteractiveElements(html, { textElements: ['h6'] })
      expect(result).to.include('<h6>Hey</h6>')
    })

    it('should cut out all non-interactive elements from GitLab HTML', () => {
      html = fs.readFileSync(path.join(__dirname, '../data/gitlab.html'), 'utf8')
      const result = removeNonInteractiveElements(html, opts)
      expect(result).to.include('Get free trial')
      expect(result).to.include('Sign in')
      expect(result).to.include('<button')

      const $ = cheerio.load(result)
      const nodes = $('input[placeholder="Search"]')
      expect(nodes).to.have.length(1)
    })

    it('should cut out and minify Testomatio HTML', () => {
      html = fs.readFileSync(path.join(__dirname, '../data/testomat.html'), 'utf8')
      const result = removeNonInteractiveElements(html, opts)
      expect(result).to.include('<svg class="md-icon md-icon-check-bold')
    })
  })

  describe('#splitByChunks', () => {
    it('should cut long HTMLs into chunks and add paths into them', () => {
      html = fs.readFileSync(path.join(__dirname, '../data/github.html'), 'utf8')
      const result = splitByChunks(html, 10000)
      expect(result).to.have.length(21)
      for (const chunk of result) {
        expect(chunk.startsWith('<')).to.be.true
      }
    })
  })

  describe('#isTrashClass', () => {
    it('flags Tailwind/utility/framework/scoped/digit-bearing classes', () => {
      expect(isTrashClass('text-sm')).to.be.true
      expect(isTrashClass('flex-row')).to.be.true
      expect(isTrashClass('color-red')).to.be.true
      expect(isTrashClass('float-left')).to.be.true
      expect(isTrashClass('border-2')).to.be.true
      expect(isTrashClass('d-flex')).to.be.true
      expect(isTrashClass('v-btn')).to.be.true
      expect(isTrashClass('ember-view')).to.be.true
      expect(isTrashClass('bg-gray-200')).to.be.true
      expect(isTrashClass('xl:hidden')).to.be.true
      expect(isTrashClass('Header__title')).to.be.true
      expect(isTrashClass('component-3xZ9')).to.be.true
    })

    it('keeps real semantic class names', () => {
      expect(isTrashClass('login-form')).to.be.false
      expect(isTrashClass('primary')).to.be.false
      expect(isTrashClass('my-real-class')).to.be.false
      expect(isTrashClass('error')).to.be.false
    })
  })

  describe('#cleanHtml', () => {
    const fixture = '<html><head><style>body{color:red}</style></head>'
      + '<body>'
      + '<div class="text-sm flex-row Header__title bg-gray-200 my-real-class" style="color: red">'
      + '<script>alert(1)</script>'
      + '<span data-keep="x" id="ok" aria-label="hi">hi</span>'
      + '</div>'
      + '<script src="/app.js"></script>'
      + '<noscript>fallback</noscript>'
      + '</body></html>'

    it('drops <style>, <noscript>, and inline <script> (no src)', () => {
      const out = cleanHtml(fixture)
      expect(out).not.to.include('<style')
      expect(out).not.to.include('<noscript')
      expect(out).not.to.include('alert(1)')
    })

    it('keeps <script src="...">', () => {
      const out = cleanHtml(fixture)
      expect(out).to.include('<script src="/app.js"></script>')
    })

    it('strips trash classes but keeps real ones', () => {
      const out = cleanHtml(fixture)
      expect(out).to.include('class="my-real-class"')
      expect(out).not.to.include('text-sm')
      expect(out).not.to.include('Header__title')
      expect(out).not.to.include('bg-gray-200')
    })

    it('drops inline style="" and preserves data-* / id / aria-*', () => {
      const out = cleanHtml(fixture)
      expect(out).not.to.include('style=')
      expect(out).to.include('data-keep="x"')
      expect(out).to.include('id="ok"')
      expect(out).to.include('aria-label="hi"')
    })
  })

  describe('#formatHtml', () => {
    it('minifies, cleans, and beautifies', async () => {
      const fixture = '<html><head><!-- a comment --><style>body{color:red}</style></head>'
        + '<body><div class="text-sm my-real-class" style="color: red">'
        + '<span>hi</span></div></body></html>'
      const out = await formatHtml(fixture)
      // beautify: multiline output
      expect(out.split('\n').length).to.be.greaterThan(3)
      // comment removed by minifier
      expect(out).not.to.include('<!--')
      // cleanHtml: trash class and inline style gone, semantic class kept
      expect(out).not.to.include('text-sm')
      expect(out).not.to.include('style=')
      expect(out).to.include('class="my-real-class"')
      // <style> block removed entirely
      expect(out).not.to.include('<style')
      // structure preserved
      expect(out).to.include('<span>hi</span>')
    })
  })

  describe('#simplifyHtmlElement', () => {
    const button = label =>
      '<button type="button"><span class="content inline-flex items-center gap-3 w-full">' +
      '<span class="badge badge-type manual"><svg class="md-icon md-icon-file-document-outline"></svg></span>' +
      `<span>${label}</span></span></button>`

    it('keeps the visible label when it is nested in non-interactive elements', () => {
      const out = simplifyHtmlElement(button('New test'))
      expect(out).to.include('New test')
      expect(out).to.include('<button type="button">')
    })

    it('keeps elements with different labels distinguishable', () => {
      expect(simplifyHtmlElement(button('New test'))).not.to.equal(simplifyHtmlElement(button('New tests from requirement')))
    })

    it('drops nested elements without text', () => {
      expect(simplifyHtmlElement(button('New test'))).not.to.include('<svg')
    })

    it('truncates to maxLength', () => {
      const out = simplifyHtmlElement(button('New test'), 50)
      expect(out).to.have.length(53)
      expect(out.endsWith('...')).to.be.true
    })

    it('does not change removeNonInteractiveElements by default', () => {
      expect(removeNonInteractiveElements(button('New test'))).not.to.include('New test')
    })
  })
})
