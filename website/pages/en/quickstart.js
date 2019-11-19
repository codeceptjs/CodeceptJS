let sidebar = { id: 'reference',
  title: 'Reference',
  language: 'en',
  sidebar: 'reference',
  category: 'Reference',
  subcategory: null,
  order: 2
 }

 const React = require('react');

 const Doc = require('../../core/Doc.js');

const Puppeteer = `

> Puppeteer is a great way to start if you need fast end 2 end tests in Chrome browser. No Selenium required!
<br />If you need cross-browser support check alternative installations with WebDriver or TestCafe &rarr;

<video onclick="this.paused ? this.play() : this.pause();" src="/img/install.mp4" style="width: 100%" controls></video>

If you start with empty project initialize npm first:

\`\`\`
npm init -y
\`\`\`

1) Install CodeceptJS with Puppeteer

\`\`\`
npm install codeceptjs puppeteer --save-dev
\`\`\`


2) Initialize CodeceptJS in current directory by running:

\`\`\`
npx codeceptjs init
\`\`\`

(use \`node node_modules/.bin/codeceptjs\` if you have issues with npx)

3) Answer questions. Agree on defaults, when asked to select helpers choose **Puppeteer**.

\`\`\`
? What helpers do you want to use?
 ◯ WebDriver
 ◯ Protractor
❯◉ Puppeteer
 ◯ Appium
 ◯ Nightmare
 ◯ FileSystem
 \`\`\`

4) Create First Test.

\`\`\`
npx codeceptjs gt
\`\`\`

5) Enter a test name. Open a generated file in your favorite JavaScript editor.

\`\`\`js
Feature('My First Test');

Scenario('test something', (I) => {

});
\`\`\`

6) Write a simple scenario

\`\`\`js
Feature('My First Test');

Scenario('test something', (I) => {
  I.amOnPage('https://github.com');
  I.see('GitHub');
});
\`\`\`

7) Run a test:

\`\`\`
npx codeceptjs run --steps
\`\`\`

The output should be similar to this:

\`\`\`bash
My First Test --
  test something
     I am on page "https://github.com"
     I see "GitHub"
 ✓ OK
 \`\`\`

> [▶ Next: CodeceptJS Basics](https://codecept.io/basics/)

> [▶ Next: CodeceptJS with Puppeteer](https://codecept.io/puppeteer/)

`;



 function Reference(props) {
   const {config: siteConfig, language = ''} = props;
   return (
     <div>
     <div className="jumbotron">
       <h1 className="text-center motto"><span className="name">Quickstart</span></h1>
     </div>
    <div className="container-fluid page">


      <div className="row">
        <div className="col-lg-8 col">

        <Doc title='Start with Puppeteer' content={Puppeteer} config={{ editUrl: '' }} metadata={{ editUrl: '' }} ></Doc>
      </div>


      <div className="col-lg-4 col pt-4">
        <h3>Alternative Setup</h3>

        <div class="card">
        <div class="card-body">
        <p><b>Use WebDriver for classical Selenium setup.</b> This gives you access to rich Selenium ecosystem and cross-browser support for majority of browsers and devices.</p>

        <p>WebDriver support is implemented via <a href="https://webdriver.io">webdriverio</a> library</p>
        <a href="/quickstart-webdriver" class="btn btn-warning btn-block card-link btn-lg">Start with WebDriver &raquo;</a>
        </div>
        </div>


        <div class="card mt-4">
        <div class="card-body">
        <p><b>TestCafe provides cross-browser support without Selenium</b>. TestCafe tests are faster, require no extra tooling and faster than regular Selenium.
        However, can be less stable.</p>

        <a href="https://codecept.io/testcafe/" class="btn btn-light btn-block  btn-lg">Use TestCafe &raquo;</a>
        </div></div>

        <div class="card mt-4">
        <div class="card-body">
        <p><b>Test native mobile apps with Appium</b>.
          Android and iOS are tested via standard Appium tool.
        </p>

        <p>Appium support is implemented via <a href="https://webdriver.io">webdriverio</a> library</p>

        <a href="https://codecept.io/mobile/" class="btn btn-light btn-block  btn-lg">Use Appium &raquo;</a>
        </div></div>

        <a href="https://codecept.io/angular/" class="btn mt-4 btn-light btn-block">Use Protractor &raquo;</a>
        <a href="https://codecept.io/nightmare/" class="btn btn-light btn-block">Use NightmareJS &raquo;</a>

      </div>


    </div>
     </div>
     </div>
   );
 }

 module.exports = Reference;
