# What is a Helper?

Helpers is a core concept of CodeceptJS. A Helper is a wrapper around a driver for talking to browsers, providing unified interface around them.

So we have a **Puppeteer helper** which talks to the *Puppeteer driver*, which talks to a Chrome browser.

The **Nightmare helper** talks to the *Nightmare driver*, which talks to an Electron 'browser'.

The **Webdriver helper** which talks the webdriver protocol to the *Webdriverio driver*, which talks to a Selenium server, which talks to a Firefox, Edge, or Chrome browser.

All these helpers implement (nearly) the same API. 

* The **Puppeteer helper** implements `amOnPage(url)` to navigate to a URL.
* The **Nightmare helper** and the **Webdriver helper** also implement the `amOnPage(url)` function.

Methods of Helper class will be available in tests in `I` object. This abstracts test scenarios from the implementation and allows easy switching between backends.

## Configuration

Helpers are defined and configured in the `codecept.json` file.

```js
{ "helpers": {
    "Nightmare": {
      "url": "http://localhost",
      "show": false
} } }
```

You should only have one primary helper active at one time. Trying to configure both Puppeteer and Nightmare helpers at the same time won't work. There is a special [multi](multi.md) mode for running the same tests in multiple browsers.

## Custom Helpers

You can make your own helpers. These helpers are for adding your own custom functions, or for exposing a bit more of the underlying driver functionality without modifying CodeceptJS directly.

These helpers get added into the config file alongside the primary helper.

```js
{ // ..
  "helpers": {
    "Nightmare": {
      "url": "http://localhost",
      "restart": false
    },
    "MyHelper": { }
  }
  // ..
}
```

## Non-browser Helpers

The REST and Filesystem helpers are assistants. They do not pretend to be browsers, but add their own special APIs to the `I` object to make tests easier to write.

For example, the REST helper lets you write a test that can call a WebAPI to create a record.

These would also be used alongside the main helper:

```js
{ // ..
  "helpers": {
    "Nightmare": {
      "url": "http://localhost",
      "restart": false
    },
    "MyHelper": { },
    "REST": {
        "endpoint": "http://localhost/api/"
    }
  }
  // ..
}
```
