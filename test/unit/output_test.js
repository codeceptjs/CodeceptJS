import { expect } from 'chai';
import * as chai from 'chai';
import sinonChai from 'sinon-chai';
import sinon from 'sinon';
import * as originalOutput from '../../lib/output.js';

chai.use(sinonChai);

let output;

describe('Output', () => {
  beforeEach(() => {
    sinon.spy(console, 'log');
    output = originalOutput;
  });

  it('should allow the output level to be set', () => {
    const expectedLevel = 2;
    output.output.level(expectedLevel);
    expect(output.output.level()).to.equal(expectedLevel);
  });

  it('should allow the process to be set', () => {
    const expectedProcess = {
      profile: 'firefox',
    };

    output.output.process(expectedProcess);
    expect(output.output.process()).to.equal(`[${expectedProcess}]`);
  });

  it('should allow debug messages when output level >= 2', () => {
    const debugMsg = 'Dear Henrietta';

    output.output.level(0);
    output.output.debug(debugMsg);
    expect(console.log).not.to.be.called;

    output.output.level(1);
    output.output.debug(debugMsg);
    expect(console.log).not.to.be.called;

    output.output.level(2);
    output.output.debug(debugMsg);
    expect(console.log).to.have.been.called;

    output.output.level(3);
    output.output.debug(debugMsg);
    expect(console.log).to.have.been.calledTwice;
  });

  it('should not throwing error when using non predefined system color for say function', () => {
    const debugMsg = 'Dear Henrietta';

    output.output.say(debugMsg, 'orange');
    expect(console.log).to.have.been.called;
  });

  afterEach(() => {
    console.log.restore();
  });
});
