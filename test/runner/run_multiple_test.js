const assert = require('assert');
const path = require('path');
const exec = require('child_process').exec;

const runner = path.join(__dirname, '/../../bin/codecept.js');
const codecept_dir = path.join(__dirname, '/../data/sandbox');
const codecept_run = `${runner} run-multiple --config ${codecept_dir}/codecept.multiple.json `;

describe('CodeceptJS Multiple Runner', function () {
  this.timeout(40000);

  before(() => {
    global.codecept_dir = path.join(__dirname, '/../data/sandbox');
  });

  it('should execute one suite with browser', (done) => {
    exec(`${codecept_run}default:firefox`, (err, stdout, stderr) => {
      stdout.should.include('CodeceptJS'); // feature
      stdout.should.include('.default:firefox] print browser ');
      stdout.should.not.include('.default:chrome] print browser ');
      assert(!err);
      done();
    });
  });

  it('should execute all suites', (done) => {
    exec(`${codecept_run}--all`, (err, stdout, stderr) => {
      stdout.should.include('CodeceptJS'); // feature
      stdout.should.include('[1.default:chrome] print browser ');
      stdout.should.include('[2.default:firefox] print browser ');
      stdout.should.include('[3.mobile:android] print browser ');
      stdout.should.include('[4.mobile:safari] print browser ');
      stdout.should.include('[5.mobile:chrome] print browser ');
      stdout.should.include('[6.mobile:safari] print browser ');
      stdout.should.include('[7.grep:chrome] @grep print browser size ');
      stdout.should.include('[8.grep:firefox] @grep print browser size ');
      stdout.should.not.include('[7.grep:chrome] print browser ');
      stdout.should.include('[1.default:chrome] @grep print browser size ');
      stdout.should.include('[3.mobile:android] @grep print browser size ');
      assert(!err);
      done();
    });
  });

  it('should replace parameters', (done) => {
    exec(`${codecept_run}grep --debug`, (err, stdout, stderr) => {
      stdout.should.include('CodeceptJS'); // feature
      stdout.should.include('[1.grep:chrome]     › maximize');
      stdout.should.include('[2.grep:firefox]     › 1200x840');
      assert(!err);
      done();
    });
  });

  it('should execute multiple suites', (done) => {
    exec(`${codecept_run}mobile default `, (err, stdout, stderr) => {
      stdout.should.include('CodeceptJS'); // feature
      stdout.should.include('[1.mobile:android] print browser ');
      stdout.should.include('[2.mobile:safari] print browser ');
      stdout.should.include('[3.mobile:chrome] print browser ');
      stdout.should.include('[4.mobile:safari] print browser ');
      stdout.should.include('[5.default:chrome] print browser ');
      stdout.should.include('[6.default:firefox] print browser ');
      assert(!err);
      done();
    });
  });

  it('should execute multiple suites with selected browsers', (done) => {
    exec(`${codecept_run}mobile:safari default:chrome `, (err, stdout, stderr) => {
      stdout.should.include('CodeceptJS'); // feature
      stdout.should.include('[1.mobile:safari] print browser ');
      stdout.should.include('[2.mobile:safari] print browser ');
      stdout.should.include('[3.default:chrome] print browser ');
      assert(!err);
      done();
    });
  });

  it('should print steps', (done) => {
    exec(`${codecept_run}default --steps`, (err, stdout, stderr) => {
      stdout.should.include('CodeceptJS'); // feature
      stdout.should.include('[2.default:firefox]   print browser ');
      stdout.should.include('[2.default:firefox]     I print browser ');
      stdout.should.include('[1.default:chrome]   print browser ');
      stdout.should.include('[1.default:chrome]     I print browser ');
      assert(!err);
      done();
    });
  });

  it('should pass grep to configuration', (done) => {
    exec(`${codecept_run}default --grep @grep`, (err, stdout, stderr) => {
      stdout.should.include('CodeceptJS'); // feature
      stdout.should.include('[1.default:chrome] @grep print browser size');
      stdout.should.include('[2.default:firefox] @grep print browser size');
      stdout.should.not.include('[1.default:chrome] print browser ');
      stdout.should.not.include('[2.default:firefox] print browser ');
      assert(!err);
      done();
    });
  });

  it('should pass tests to configuration', (done) => {
    exec(`${codecept_run}test`, (err, stdout, stderr) => {
      stdout.should.include('CodeceptJS'); // feature
      stdout.should.include('[1.test:chrome] print browser size');
      stdout.should.include('[2.test:firefox] print browser size');
      stdout.should.include('[1.test:chrome] print browser ');
      stdout.should.include('[2.test:firefox] print browser ');
      assert(!err);
      done();
    });
  });

  it('should run chunks', (done) => {
    exec(`${codecept_run}chunks`, (err, stdout, stderr) => {
      stdout.should.include('CodeceptJS'); // feature
      stdout.should.include('[1.chunks:chunk1:dummy] print browser');
      stdout.should.include('[2.chunks:chunk2:dummy] @grep print browser size');
      assert(!err);
      done();
    });
  });
});

