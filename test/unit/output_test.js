const chai = require('chai');
const { expect } = require('chai');
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
    expect(output.level()).to.equal(expectedLevel);
  });

  it('should allow the process to be set', () => {
    const expectedProcess = {
      profile: 'firefox',
    };

    output.process(expectedProcess);
    expect(output.process()).to.equal(`[${expectedProcess}]`);
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

  it('should not throwing error when using non predefined system color for say function', () => {
    const debugMsg = 'Dear Henrietta';

    output.say(debugMsg, 'orange');
    expect(console.log).to.have.been.called;
  });

  afterEach(() => {
    console.log.restore();
  });
});
