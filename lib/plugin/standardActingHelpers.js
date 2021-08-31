const Appium = require('../helper/Appium');
const Playwright = require('../helper/Playwright');
const WebDriver = require('../helper/WebDriver');
const Puppeteer = require('../helper/Puppeteer');
const TestCafe = require('../helper/TestCafe');
const Nightmare = require('../helper/Nightmare');
const Protractor = require('../helper/Protractor');

const standardActingHelpers = [
  Playwright,
  WebDriver,
  Puppeteer,
  Appium,
  TestCafe,
  Protractor,
  Nightmare,
];

module.exports = standardActingHelpers;
