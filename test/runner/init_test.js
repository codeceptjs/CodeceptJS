const { DOWN, ENTER } = require('inquirer-test');
const run = require('inquirer-test');
const path = require('path');

const runner = path.join(__dirname, '../../bin/hermiona.js');

describe('Init Command', function () {
  this.timeout(20000);

  it('steps are showing', async () => {
    const result = await run([runner, 'init'], ['Y', ENTER, ENTER, DOWN, DOWN, DOWN, ENTER, 'y']);
    result.should.include('Welcome to CodeceptJS initialization tool');
    result.should.include('It will prepare and configure a test environment for you');
    result.should.include('Installing to');
    result.should.include('? Do you plan to write tests in TypeScript? (y/N)');
    result.should.include('Where are your tests located? ./*_test.ts');
    result.should.include('What helpers do you want to use? REST');
    result.should.include('? Do you want to use JSONResponse helper for assertions on JSON responses?');
  });
});
