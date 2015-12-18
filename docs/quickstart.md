# QuickStart

**NodeJS v 4.2.0** and higher required to start. 
Install **CodeceptJS** with NPM:

```
npm install -g codeceptjs
```

(you may need `sudo` to do it).

## Setup

Initialize CodeceptJS running:

```
codeceptjs init
```

It will create `codecept.json` config in current directory (or provide path in the first argument).

You will be asked for tests location (they will be searched in current dir by default). 

On next step you are asked to select **Helpers**. Helpers include actions which can be used in tests.
We recommend to start with **WebDriverIO** helper in order to write acceptance tests using webdriverio library and Selenium Server as test runner.

```
? What helpers do you want to use? 
❯◉ WebDriverIO
 ◯ FileSystem
```

Then you will be asked for an output directory. Logs, reports, and failure screenshots will be placed there.

```
? Where should logs, screenshots, and reports to be stored? ./output
```

If you are going to extend test suite by writing custom steps you should probably agree to create `steps_file.js`

```
? Would you like to extend I object with custom steps? Yes
? Where would you like to place custom steps? ./steps_file.js
```

WebDriverIO helper will ask for additional configuration as well:

```
? [WebDriverIO] Base url of site to be tested http://localhost
? [WebDriverIO] Browser in which testing will be performed firefox
```

If you agree with defaults, finish the installation.

## Creating First Test

