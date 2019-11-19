 const React = require('react');

 const Doc = require('../../core/Doc.js');

const WebDriver = `

If you start an empty project, initialize npm first:

\`\`\`
npm init -y
\`\`\`


1) Install CodeceptJS with webdriverio library

\`\`\`
npm install codeceptjs webdriverio --save-dev
\`\`\`

2) Initialize CodeceptJS in current directory by running:

\`\`\`sh
npx codeceptjs init
\`\`\`

(use \`node node_modules/.bin/codeceptjs init\` if you have issues with npx)

3) Answer questions. Agree on defaults, when asked to select helpers choose **WebDriver**.

\`\`\`sh
? What helpers do you want to use?
❯◉ WebDriver
 ◯ Protractor
 ◯ Puppeteer
 ◯ Appium
 ◯ Nightmare
 ◯ FileSystem
\`\`\`

4) Create First Test.

\`\`\`bash
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

7) Prepare Selenium Server

Install \`@wdio/selenium-standalone-service\` package to automatically start and stop selenium service.

\`\`\`
npm i @wdio/selenium-standalone-service --save
\`\`\`

Enable it in config inside plugins section:

\`\`\`js
exports.config = {
  // ...
  // inside condecept.conf.js
  plugins: {
    wdio: {
      enabled: true,
      services: ['selenium-standalone']
    }
  }
}
\`\`\`

> Alternatively, use [selenium-standalone](https://www.npmjs.com/package/selenium-standalone) to install, start and stop Selenium Server manually.


8) Run a test:

\`\`\`
npx codeceptjs run --steps
\`\`\`

If everything is done right, you will see in console:

\`\`\`bash
My First Test --
  test something
   • I am on page "https://github.com"
   • I see "GitHub"
 ✓ OK
\`\`\`


> [▶ Next: CodeceptJS Basics](https://codecept.io/basics/)

> [▶ Next: WebDriver Testing](https://codecept.io/webdriver/)

`;



 function Reference(props) {
   const {config: siteConfig, language = ''} = props;
   return (
     <div>
    <div className="container page">


      <div className="row">
        <div className="col-lg-12 col">

        <Doc title='Start with WebDriver' content={WebDriver} config={{ editUrl: '' }} metadata={{ editUrl: '' }} ></Doc>
      </div>


    </div>
     </div>
     </div>
   );
 }

 module.exports = Reference;
