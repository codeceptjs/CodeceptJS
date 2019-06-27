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
