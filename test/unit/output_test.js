const assert = require('assert');
const chai = require('chai');

const expect = chai.expect;
const sinonChai = require('sinon-chai');

chai.use(sinonChai);

const sinon = require('sinon');

sinon.assert.expose(chai.assert, { prefix: '' });

const originalOutput = require('../../lib/output');

let output;

describe('Output', () => {
  beforeEach(() => {
    sinon.spy(console, 'log');
    output = originalOutput;
  });

  it('should allow the output level to be set', () => {
    const expectedLevel = 2;
    output.level(expectedLevel);
    assert.equal(output.level(), expectedLevel);
  });

  it('should allow the process to be set', () => {
    const expectedProcess = {
      profile: 'firefox',
    };

    output.process(expectedProcess);
    assert.equal(output.process(), `[${expectedProcess}]`);
  });

  it('should allow debug messages when output level >= 2', () => {
    const debugMsg = 'Dear Henrietta';

    output.level(0);
    output.debug(debugMsg);
    expect(console.log).not.to.be.called;

    output.level(1);
    output.debug(debugMsg);
    expect(console.log).not.to.be.called;

    output.level(2);
    output.debug(debugMsg);
    expect(console.log).to.have.been.called;

    output.level(3);
    output.debug(debugMsg);
    expect(console.log).to.have.been.calledTwice;
  });

  afterEach(() => {
    console.log.restore();
  });
});
