/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react');

class Index extends React.Component {
  render() {
    return (<div>
    <div className="jumbotron">
  <div className="container">
    <img src="/img/cjs-base.png" style={{width: '150px'}} alt="" />
    <h1>CodeceptJS <a className="badge badge-primary version" href="/changelog#2000">2.0</a> </h1>
    <div className="motto">Modern End 2 End Testing for NodeJS</div>



  </div>

</div>



<div className="action-wrapper">

  <a href="/quickstart" className="btn btn-danger btn-lg install-label">Quickstart &raquo;</a>

  <div className="mt-3 text-muted">No coding skills? That's fine! Get your tests automated with <a href="https://easytesting.io"><b>EasyTesting.io</b></a></div>

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
        Run your tests via <b>WebDriver, Puppeteer, Protractor, Appium</b>. The code is the same.
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
      Use semantic locators, CSS, or XPath to find elements on page.
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
      Write your tests for web and and mobile applications using same API.
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
      <a href="/reports#allure" className="btn btn-light btn-sm">Learn More</a>
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


  <div className="row" style={{background: '#eef'}}>

    <div className="col-8">
      <video onClick="this.paused ? this.play() : this.pause();" controls src="/img/codeceptjs_demo.mp4" style={{ width: '100%', padding: '20px'}}></video>
    </div>
    <div className="col-4">
      <h2>&laquo; Watch it in action!</h2>
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
    </div>
  </div>
  </div>
</div>);
}
}

module.exports = Index;
