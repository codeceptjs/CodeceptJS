const path = require('path');
const fs = require('fs');
const mkdirp = require('mkdirp');
const { createPromptModule } = require('@inquirer/testing');

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
    const prompt = createPromptModule();
    
    prompt.inject([
      'Y', // Confirm TypeScript usage
      '',  // Default for test location
      'DOWN', 'DOWN', 'DOWN', 'ENTER',  // Select REST helper
      'y', // Confirm JSONResponse usage
      '',  // Default for logs/screenshots/reports
      '',  // Default for localization
    ]);

    await require(runner).init(codecept_dir);

    const config = fs.readFileSync(`${codecept_dir}/codecept.conf.ts`).toString();
    config.should.include("I: './steps_file'");

    fs.accessSync(`${codecept_dir}/steps_file.ts`, fs.constants.R_OK);
    fs.accessSync(`${codecept_dir}/tsconfig.json`, fs.constants.R_OK);
  });

  it.skip('should init Codecept with JavaScript REST JSONResponse de-DE', async () => {
    const prompt = createPromptModule();

    prompt.inject([
      '',  // Default (No TypeScript)
      '',  // Default for test location
      'DOWN', 'DOWN', 'DOWN', 'ENTER',  // Select REST helper
      'y', // Confirm JSONResponse usage
      '',  // Default for logs/screenshots/reports
      'DOWN', '',  // Select de-DE localization
    ]);

    await require(runner).init(codecept_dir);

    const config = fs.readFileSync(`${codecept_dir}/codecept.conf.js`).toString();
    config.should.include("Ich: './steps_file.js'");

    fs.accessSync(`${codecept_dir}/steps_file.js`, fs.constants.R_OK);
    fs.accessSync(`${codecept_dir}/jsconfig.json`, fs.constants.R_OK);
  });
});