const fs = require('fs');
const path = require('path');
const { expect } = require('chai');
const xpath = require('xpath');
const Dom = require('@xmldom/xmldom').DOMParser;
const {
  scanForErrorMessages, removeNonInteractiveElements, minifyHtml, splitByChunks,
} = require('../../lib/html');

const opts = {
  interactiveElements: ['a', 'input', 'button', 'select', 'textarea', 'label', 'option'],
  allowedAttrs: ['id', 'for', 'class', 'name', 'type', 'value', 'aria-labelledby', 'aria-label', 'label', 'placeholder', 'title', 'alt', 'src', 'role'],
  allowedRoles: ['button', 'checkbox', 'search', 'textbox', 'tab'],
  textElements: ['label'],
};

describe('HTML module', () => {
  let html;

  before(() => {
    // Load HTML from a file
  });

  describe('scanForErrorMessages', () => {
    xit('should scan HTML for error messages', () => {
      // Call the function with the loaded HTML
      const errorMessages = scanForErrorMessages(html);

      // Add your assertions here
      // For example:
      // expect(errorMessages).to.have.lengthOf(3);
      // expect(errorMessages).to.include('Error 1');
      // expect(errorMessages).to.include('Error 2');
    });
  });

  describe('#removeNonInteractiveElements', () => {
    it('should cut out all non-interactive elements from GitHub HTML', async () => {
      // Call the function with the loaded HTML
      html = fs.readFileSync(path.join(__dirname, '../data/github.html'), 'utf8');
      const result = removeNonInteractiveElements(html, opts);
      let doc = new Dom().parseFromString(result);
      const nodes = xpath.select('//input[@name="q"]', doc);
      expect(nodes).to.have.length(1);
      expect(result).not.to.include('Let’s build from here');
      const minified = await minifyHtml(result);
      doc = new Dom().parseFromString(minified);
      const nodes2 = xpath.select('//input[@name="q"]', doc);
      expect(nodes2).to.have.length(1);
    });

    it('should keep interactive html elements', () => {
      html = `
        <div id="onetrust-pc-sdk" class="otPcTab ot-hide ot-fade-in" lang="en" aria-label="Preference center" role="region">
        <div role="alertdialog" aria-modal="true" aria-describedby="ot-pc-desc" style="height: 100%;" aria-label="Privacy Preference Center">
        <!-- pc header --><div class="ot-pc-header" role="presentation">
        <div class="ot-title-cntr">
        <h2 id="ot-pc-title">Privacy Preference Center</h2>
        <div class="ot-close-cntr">
        <button id="close-pc-btn-handler" class="ot-close-icon" aria-label="Close">
        </button>
        </div>
        </div>
        </div>`;
      const result = removeNonInteractiveElements(html, opts);
      expect(result).to.include('<button');
    });

    it('should keep menu bar', async () => {
      html = `<div class="mainnav-menu-body">
      <ul>
        <li>
          <div class="flex">
            <button class="hamburger hamburger--arrowalt outline-none focus:outline-none
                " style="line-height: 0; margin-top: 3px; margin-bottom: 3px;" type="button">
              <span class="hamburger-box">
                <span class="hamburger-inner"></span>
              </span>
            </button>
          </div>
        </li>
        <li>
        <a id="ember6" class="ember-view flex items-center" href="/projects/codeceptjs-cucumber/runs" aria-describedby="ember7-popper">
          <svg class="md-icon md-icon-play-circle-outline " width="30" height="30" viewBox="0 0 24 24" role="img">
      <path d="aaaa">aaa</path>
</svg>
</a>
      </li>
      </ul>
    </div>`;
      const result = await minifyHtml(removeNonInteractiveElements(html, opts));
      expect(result).to.include('<button');
      expect(result).to.include('<a');
      expect(result).to.include('<svg');
      expect(result).not.to.include('<path');
    });

    it('should cut out all non-interactive elements from HTML', () => {
      // Call the function with the loaded HTML
      html = fs.readFileSync(path.join(__dirname, '../data/checkout.html'), 'utf8');
      const result = removeNonInteractiveElements(html, opts);
      expect(result).to.include('Name on card');
      expect(result).to.not.include('<script');
    });

    it('should allow adding new elements', () => {
      const html = '<div><h6>Hey</h6></div>';

      const result = removeNonInteractiveElements(html, {
        textElements: ['h6'],
      });

      expect(result).to.include('<h6>Hey</h6>');
    });

    it('should cut out all non-interactive elements from GitLab HTML', () => {
      // Call the function with the loaded HTML
      html = fs.readFileSync(path.join(__dirname, '../data/gitlab.html'), 'utf8');
      // console.log(html);
      const result = removeNonInteractiveElements(html, opts);

      result.should.include('Get free trial');
      result.should.include('Sign in');
      result.should.include('<button');
      const doc = new Dom().parseFromString(result);
      const nodes = xpath.select('//input[@placeholder="Search"]', doc);
      expect(nodes).to.have.length(1);
    });

    it('should cut out and minify Testomatio HTML', () => {
      // Call the function with the loaded HTML
      html = fs.readFileSync(path.join(__dirname, '../data/testomat.html'), 'utf8');
      // console.log(html);
      const result = removeNonInteractiveElements(html, opts);
      result.should.include('<svg class="md-icon md-icon-check-bold');
      // console.log(await minifyHtml(result));
    });
  });

  describe('#splitByChunks', () => {
    it('should cut long htmls into chunks and add paths into them', () => {
      // Call the function with the loaded HTML
      html = fs.readFileSync(path.join(__dirname, '../data/github.html'), 'utf8');
      const result = splitByChunks(html, 10000);
      expect(result).to.have.length(21);
      // console.log(result[10])
      // expect(result[10].startsWith('<div data-turbo-body=""')).to.be.true;
      for (const chunk of result) {
        expect(chunk.startsWith('<')).to.be.true;
      }
    });
  });
});
