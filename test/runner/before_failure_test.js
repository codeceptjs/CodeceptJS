const path = require('path');
const exec = require('child_process').exec;

const runner = path.join(__dirname, '/../../bin/codecept.js');
const codecept_dir = path.join(__dirname, '/../data/sandbox');
const codecept_run = `${runner} run --config ${codecept_dir}/codecept.beforetest.failure.json `;

describe('Failure in before', () => {
  it('should skip tests that are skipped because of failure in before hook', (done) => {
    exec(`${codecept_run}`, (err, stdout) => {
      stdout.should.include('✔ First test will be passed');
      stdout.should.include('S Third test will be skipped @grep');
      stdout.should.include('S Fourth test will be skipped');
      stdout.should.include('1 passed, 1 failed, 2 skipped');
      err.code.should.eql(1);
      done();
    });
  });

  it('should skip tests correctly with grep options', (done) => {
    exec(`${codecept_run} --grep @grep`, (err, stdout) => {
      stdout.should.include('✔ First test will be passed');
      stdout.should.include('S Third test will be skipped @grep');
      stdout.should.include('1 passed, 1 failed, 1 skipped');
      err.code.should.eql(1);
      done();
    });
  });

  it('should trigger skipped events', (done) => {
    exec(`${codecept_run} --verbose`, { env: { DEBUG: 'codeceptjs:*' } }, (err, stdout, stderr) => {
      err.code.should.eql(1);
      stderr.should.include('Emitted | test.skipped');
      done();
    });
  });
});
