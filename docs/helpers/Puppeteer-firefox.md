# Puppeteer-firefox

Now you can use Puppeteer for Firefox (min version: Firefox/63.0.4)

[Repository](https://github.com/GoogleChrome/puppeteer/tree/master/experimental/puppeteer-firefox)

Some of Puppeteer API methods has not supported in firefox yet. You could check status of them at [Puppeteer API coverage status](https://aslushnikov.github.io/ispuppeteerfirefoxready/)

## Installation

```sh
npm install puppeteer-firefox
```

## Configuration

If you want to use puppeteer-firefox, you should add it in Puppeteer section in codecept.conf.js.

- browser: 'chrome' OR 'firefox', 'chrome' is default value

```js
helpers: {
        Puppeteer: {
            browser: process.env.BROWSER || 'firefox',
            url: process.env.BASE_URL || 'https://example.com',
            chrome: {
                args: [
                    '--ignore-certificate-errors',
                ],
            },
            firefox: {
                args: [
                    '--ignore-certificate-errors'
                ],
            },
        },
```

## Run-multiple

Example multiple section in codecept.conf.js:

```js
 multiple: {
        parallel: {
            chunks: process.env.THREADS || 30,
            browsers: [{
                browser: 'chrome',
                windowSize: '1920x1080',
            }, {
                browser: 'firefox',
                windowSize: '1920x1080',
            }],
        },
    },
```

## Puppeteer v2.1.0 onwards

Historically, Puppeteer supported Firefox indirectly through puppeteer-firefox, which relied on a custom, patched version of Firefox. This approach was also known as “Juggler”. After discussions with Mozilla, we collectively concluded that relying on custom patches was infeasible. Since then, we have been collaborating with Mozilla on supporting Puppeteer on “stock” Firefox. From Puppeteer v2.1.0 onwards, as an experimental feature, you can specify puppeteer.launch({product: 'firefox'}) to run your Puppeteer scripts in Firefox Nightly, without any additional custom patches.

```sh
npm i puppeteer@v2.1.0
```

If you want to try this expirement within CodeceptJS, you should add it in Puppeteer section in codecept.conf.js.

- browser: 'chrome' OR 'firefox', 'chrome' is default value

```js
helpers: {
        Puppeteer: {
            browser: process.env.BROWSER || 'firefox',
            url: process.env.BASE_URL || 'https://example.com',
            chrome: {
                args: [
                    '--ignore-certificate-errors',
                ],
            },
            firefox: {
                args: [
                    '--ignore-certificate-errors'
                ],
            },
        },
```
