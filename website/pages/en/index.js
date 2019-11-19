/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react');
const Doc = require('../../core/Doc.js');

const pause = `
Pause a test after opening a first page.
Use a terminal to control browser from the console.<br/> Successful commands will be saved into a file.

\`\`\`js
Scenario('Checkout test', () => {
  I.amOnPage('/checkout');
  pause();
})
\`\`\`
Copy commands from a file into a test. A test is ready!
`;

const test = `
Each executed step will be printed on screen when running with \`--steps\`
\`\`\`js
Scenario('Checkout test', () => {
  I.amOnPage('/checkout');
  I.fillField('First name', 'davert');
  I.fillField('#lastName', 'mik');
  I.fillField('Promo code', '123345')
  I.click('Redeem')
  I.click(locate('h6').withText('Third item'))
  I.checkOption('#same-address')
  I.see('Payment')
  I.click('Paypal')
  I.click('Checkout');
  I.see('Thank you!');
})
\`\`\`
`;

const code = `\`\`\`js
const faker = require('faker');                               // Use 3rd-party JS code

Feature('Store');

Scenario('Create a new store', (I, login, SettingsPage) => {
  const storeName = faker.lorem.slug();
  login('customer');                                          // Login customer from saved cookies
  SettingsPage.open();                                        // Use Page objects
  I.dontSee(storeName, '.settings');                          // Assert text not present inside an element (located by CSS)
  I.click('Add', '.settings');                                // Click link by text inside element (located by CSS)
  pause();                                                    // Launch interactive shell for debug
  I.fillField('Store Name', storeName);                       // Fill fields by labels or placeholders
  I.fillField('Email', faker.internet.email());
  I.fillField('Telephone', faker.phone.phoneNumberFormat());
  I.selectInDropdown('Status', 'Active');                     // Use custom methods
  I.retry(2).click('Create');                                 // Auto-retry flaky step
  I.waitInUrl('/settings/setup/stores');                      // Explicit waiter
  I.see(storeName, '.settings');                              // Assert text present inside an element (located by CSS)
}).tag('stores');`;

const quickstart = `
<div className="action-wrapper">
  <a href="/quickstart" className="btn btn-danger btn-lg install-label">Quickstart &raquo;</a>
</div>
`;

const bugira =   <div className="bugira d-none d-lg-block">
<a href="https://www.bugira.com">
<div className="container w-50">
  <div className="row">
  <div className="col-md-5">
    <h3 className="">Not sure what to test?
    </h3>
    <p>
    Let your users tell you!
    </p>
  </div>
  <div className="col-md-2 text-center">
    <img src="/img/bugira.svg"></img>
  </div>
  <div className="col-md-5 text-center">
    <h3 className="">Turn user feedback into tests</h3>
    <p>with <b>Bugira</b> Bugtracker</p>
  </div>
  </div>
</div>
</a>
</div>


{/* <div style={{backgroundColor: '#fff573', textAlign: 'center', padding: '10px'}}>
Training: Web test automation with CodeceptJS - 11.09.2019-12.09.2019 <a href="https://sdclabs.com/trainings/schedule">Buy now!</a>
</div> */}


class Index extends React.Component {
  render() {
    return (<div>
    <div className="jumbotron">
  <div className="container">
    <h1 className="motto">Supercharged <br/><span className="name">End 2 End</span> Testing </h1>
    <img src="/img/code.png" style={{width: '600px'}} alt="" />

      <h3><div>With a focus on readable and stable tests</div></h3>


    <div className="motto">

      & easy switch between WebDriver or Puppeteer.
    </div>

  </div>



</div>


<div className="action-wrapper">
  <a href="/quickstart" className="btn btn-danger btn-lg install-label">Quickstart &raquo;</a>
</div>



<div className="container page">

  <div className="row features">

    <div className="col-md-4">
      <img src="/img/Checklist.svg" alt="" />
      <h5>Scenario Driven</h5>
        Write acceptance tests from user's perspective.
        Make tests readable and easy to follow.
    </div>
    <div className="col-md-4">
      <img src="/img/Mind-Map-Paper.svg" alt="" />
      <h5>Driver Agnostic</h5>
        Run your tests via <b>WebDriver, Puppeteer, TestCafe, Protractor, Appium</b>. The code is the same.
        <a href="/basics#architecture" className="btn btn-light btn-sm">Learn More</a>
    </div>
    <div className="col-md-4">
      <img src="/img/Coding-Html.svg" alt="" />
      <h5>Interactive Debug</h5>
        Control tests as they run. Pause tests at any point and execute commands to try locators.
        <a href="/basics#debug" className="btn btn-light btn-sm">Learn More</a>
    </div>
  </div>
  <div className="row features">
    <div className="col-md-4">
      <img src="/img/Prism-3.svg" alt="" />
      <h5>Rich Locators</h5>
      Use semantic locators, CSS, XPath to find elements on page
      <a href="/locators" className="btn btn-light btn-sm">Learn More</a>
    </div>

    <div className="col-md-4">
      <img src="/img/Prism-3.svg" style={{filter: 'hue-rotate(45deg)', transform: 'rotate(225deg)'}} alt="" />
      <h5>PageObjects</h5>
      PageObjects are essential to write stable and reusable code!
      <a href="/pageobjects" className="btn btn-light btn-sm">Learn More</a>
    </div>

    <div className="col-md-4">
      <img src="/img/Prism-3.svg" style={{filter: 'hue-rotate(90deg)', transform: 'rotate(180deg)'}} alt="" />
      <h5>Web & Mobile Testing</h5>
      Test native mobile apps using <b>Appium</b> or <b>Detox</b>.
      <a href="/mobile" className="btn btn-light btn-sm">Learn More</a>
    </div>
  </div>

  <div className="row features">



    <div className="col-md-4">
      <img src="/img/Prism-3.svg" style={{filter: 'hue-rotate(135deg)', transform: 'rotate(45deg)'}} alt="" />
      <h5>Cucumber-like BDD</h5>
      Automate business scenarios as you do in CucumberJS
      <a href="/bdd" className="btn btn-light btn-sm">Learn More</a>
    </div>

    <div className="col-md-4">
      <img src="/img/Prism-3.svg" style={{filter: 'hue-rotate(180deg)', transform: 'rotate(90deg)'}} alt="" />
      <h5>Beautiful Reports</h5>
      Integrated with Allure reporter
      <a href="/plugins#allure" className="btn btn-light btn-sm">Learn More</a>
    </div>

    <div className="col-md-4">
      <img src="/img/Prism-3.svg" style={{filter: 'hue-rotate(225deg)', transform: 'rotate(135deg)'}} alt="" />
      <h5>Data Management</h5>
      Create fake data and clean it up via REST API
      <a href="/data" className="btn btn-light btn-sm">Learn More</a>
    </div>
  </div>

  <div className="row features">
    <div className="col-md-4">
      <img src="/img/Prism-3.svg" style={{transform: 'rotate(90deg)', filter: 'hue-rotate(60deg) saturate(20%)'}} alt="" />
      <h5>Parallel Testing</h5>
      Tests are split into chunks and executed in multiple processes.
      <a href="/advanced#parallel-execution" className="btn btn-light btn-sm">Learn More</a>

    </div>

    <div className="col-md-4">
      <img src="/img/Prism-3.svg" style={{filter: 'hue-rotate(105deg) saturate(20%)', transform: 'rotate(45deg)'}} alt="" />
      <h5>Reduced Flackiness</h5>
      Automatically retry failed steps
      <a href="/basics#retries" className="btn btn-light btn-sm">Learn More</a>
    </div>

    <div className="col-md-4">
      <img src="/img/Prism-3.svg" style={{filter: 'hue-rotate(135deg) saturate(20%)', transform: 'rotate(0deg)'}} alt="" />
      <h5>Multi-Session Testing</h5>
      Run a test using several browser windows

      <a href="/acceptance#multiple-sessions" className="btn btn-light btn-sm">Learn More</a>

    </div>
  </div>

</div>


<div className="page demo">
<div className="d-flex" style={{alignItems: 'center', margin: '100px 0 50px 0'}} >
<div className="col-md-6">
  <img src="/img/pause.gif"></img>
</div>
<div className="col-md-6"><Doc title='Write a test without closing a browser' content={pause} config={{ editUrl: '' }} metadata={{ editUrl: '' }} ></Doc>

</div>
</div>
<div className="d-flex" style={{alignItems: 'center', margin: '50px 0 100px 0', paddingTop: '50px', borderTop: '10px solid #633d82'}}>
<div className="col-md-6">
  <img src="/img/test.gif"></img>
</div>
<div className="col-md-6"><Doc title='Follow a test step-by-step' content={test} config={{ editUrl: '' }} metadata={{ editUrl: '' }} ></Doc></div>

</div>
</div>

<div className="container page">
  <div className="row">
  <div className="col-md-12">
  <h2 className="text-center">Check a Real World Example</h2>
  <Doc content={code} config={{ editUrl: '' }} metadata={{ editUrl: '' }} ></Doc>
  <div className="text-center mb-4">
    <a href="https://codecept.io/examples" className="btn btn-light">See more examples &raquo;</a>
  </div>
  </div>
  </div>


  <div className="row" style={{background: '#eef'}}>

    <div className="col-lg-8">
      <video onClick="this.paused ? this.play() : this.pause();" controls src="/img/codeceptjs_demo.mp4" style={{ width: '100%', padding: '20px'}}></video>
    </div>
    <div className="col-lg-4">
      <h2 className="d-none d-lg-block">&laquo; Watch it in action!</h2>
      <p>
        See how simple is to start writing tests with CodeceptJS.
        Just type in basic commands to control browser.
        Use <b>interactive pause</b> to write your test as it goes.
      </p>
      <ol>
        <li>Creating test for GitHub.com</li>
        <li>Writing commands and assertions</li>
        <li>Running tests</li>
        <li>Using interactive pause</li>
        <li>Updating tests from interactive test</li>
      </ol>
      <p>
        <small className="text-muted">Don't turn off your music. The video is muted :)</small>
      </p>
      <p>

  </p>

    </div>
  </div>


  </div>

  <div className="container page">

    <h2 className="text-center">Powerful Ecosystem</h2>

      <div className="row ecosystem">
        <div className="col-lg-6 col">
          <a href="https://mailslurp.com" target="blank">
          <img src="/img/mailslurp.svg" ></img>
          <h3>MailSlurp</h3>
          </a>
        <p>
          How would you test email interactions? Like resetting passwords, activating user account. We got you covered!

          <br/><br/>
            With MailSlurp you can easily receive and send emails inside your end 2 end tests.

            <a href="/email" className="btn btn-light btn-small">Learn More</a>
        </p>
      </div>


      <div className="col-lg-6 col">
      <a href="https://browsers.aerokube.com" target="blank">
          <img src="/img/aerokube.png" ></img>
          <h3>Aerokube Browsers</h3>
          </a>
        <p>
        Run your tests in a cloud without pain of maintaining your own browsers infrastructure.
        Use WebDriver or Puppeteer to control a browser.
        <br/>
        <br/>

        <a href="/webdriver#aerokube-cloud-browsers" className="btn btn-light btn-sml">Use with WebDriver</a>
        <a href="/puppeteer#cloud-browsers" className="btn btn-light btn-sml">Use with Puppeteer</a>
        </p>
      </div>


    </div>


    <div className="row">
      <h2 className="col-12 text-center">Trusted By Enterprises</h2>
  </div>
  <div className="row testimonials">
    <div className="col-lg-6">
      <p>
        We have been using CodeceptJS as our UI testing framework, and it has made writing tests so simp  le for us, the amount of options and features available in CodeceptJS just out of the box are perfect for us to <b>test an application like Percona Monitoring and Management</b> (PMM), with so many dashboards & Metric plots.
        We would recommend CodeceptJS to anyone who is looking for a Javascript based testing framework.
      </p>
      <div className="signature">
        <img src="/img/kala.jpg"></img>
        <b>Puneet Kala</b>,
        <div className="position">Frontend QA Automation Engineer at <b>Percona</b></div>
      </div>
    </div>
    <div className="col-lg-6">
      <p >
      We were searching for a solution to write tests which are good to read and easy to write. It must be able to run on several browsers and understandable across different teams with different knowledge and different frameworks in usage. <b>CodeceptJS helps us with all this and much more at Porsche</b> and we are happy that we made that decision.
      </p>
      <div className="signature">
        <img src="/img/mitko.jpg"></img>
        <b>Mitko Tschimev</b>,
        <div className="position">Frontend Tech Lead at <b>My Porsche Core</b></div>
      </div>
    </div>
  </div>

  <div className="row d-none">
      <h3 className="col-12 text-center m-2 text-muted">Follow for updates &nbsp;
        <a href="https://twitter.com/CodeceptJS"><i className="fab fa-twitter"></i></a> &nbsp;
        <a href="https://github.com/Codeception/CodeceptJS"><i className="fab fa-github"></i></a>
        </h3>
  </div>

  </div>

  <div className="action-wrapper">
  <a href="/quickstart" className="btn btn-danger btn-lg install-label">Quickstart &raquo;</a>
</div>


</div>);
}
}

module.exports = Index;
