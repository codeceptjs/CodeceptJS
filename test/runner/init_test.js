const { DOWN, ENTER } = require('inquirer-test');
const run = require('inquirer-test');
const path = require('path');
const fs = require('fs');
const mkdirp = require('mkdirp');

const runner = path.join(__dirname, '../../bin/codecept.js');
const codecept_dir = path.join(__dirname, '/../data/sandbox/configs/init');

describe('Init Command', function () {
  this.timeout(20000);

  beforeEach(() => {
    mkdirp.sync(codecept_dir);
    process.env._INIT_DRY_RUN_INSTALL = true;
  });

  afterEach(() => {
    try {
      fs.unlinkSync(`${codecept_dir}/codecept.conf.ts`);
      fs.unlinkSync(`${codecept_dir}/steps_file.ts`);
      fs.unlinkSync(`${codecept_dir}/tsconfig.json`);
    } catch (e) {
      // continue regardless of error
    }

    try {
      fs.unlinkSync(`${codecept_dir}/codecept.conf.js`);
      fs.unlinkSync(`${codecept_dir}/steps_file.js`);
      fs.unlinkSync(`${codecept_dir}/jsconfig.json`);
    } catch (e) {
      // continue regardless of error
    }

    delete process.env._INIT_DRY_RUN_INSTALL;
  });

  it('should init Codecept with TypeScript REST JSONResponse English', async () => {
    const result = await run([runner, 'init', codecept_dir], ['Y', ENTER, ENTER, DOWN, DOWN, DOWN, ENTER, 'y', ENTER, codecept_dir, ENTER, ENTER, ENTER, ENTER]);

    result.should.include('Welcome to CodeceptJS initialization tool');
    result.should.include('It will prepare and configure a test environment for you');
    result.should.include('Installing to');
    result.should.include('? Do you plan to write tests in TypeScript? (y/N)');
    result.should.include('Where are your tests located? ./*_test.ts');
    result.should.include('What helpers do you want to use? REST');
    result.should.include('? Do you want to use JSONResponse helper for assertions on JSON responses?');
    result.should.include('? Where should logs, screenshots, and reports to be stored?');
    result.should.include('? Do you want to enable localization for tests?');

    const config = fs.readFileSync(`${codecept_dir}/codecept.conf.ts`).toString();
    config.should.include('I: \'./steps_file\'');

    fs.accessSync(`${codecept_dir}/steps_file.ts`, fs.constants.R_OK);
    fs.accessSync(`${codecept_dir}/tsconfig.json`, fs.constants.R_OK);
  });

  it('should init Codecept with JavaScript REST JSONResponse de-DE', async () => {
    const result = await run([runner, 'init', codecept_dir], [ENTER, ENTER, DOWN, DOWN, DOWN, ENTER, 'y', ENTER, codecept_dir, ENTER, DOWN, ENTER, ENTER, ENTER]);

    result.should.include('Welcome to CodeceptJS initialization tool');
    result.should.include('It will prepare and configure a test environment for you');
    result.should.include('Installing to');
    result.should.include('? Do you plan to write tests in TypeScript? (y/N)');
    result.should.include('Where are your tests located? ./*_test.js');
    result.should.include('What helpers do you want to use? REST');
    result.should.include('? Do you want to use JSONResponse helper for assertions on JSON responses?');
    result.should.include('? Where should logs, screenshots, and reports to be stored?');
    result.should.include('? Do you want to enable localization for tests?');
    result.should.include('de-DE');

    const config = fs.readFileSync(`${codecept_dir}/codecept.conf.js`).toString();
    config.should.include('Ich: \'./steps_file.js\'');

    fs.accessSync(`${codecept_dir}/steps_file.js`, fs.constants.R_OK);
    fs.accessSync(`${codecept_dir}/jsconfig.json`, fs.constants.R_OK);
  });
});
