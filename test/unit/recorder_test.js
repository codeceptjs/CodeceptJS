'use strict';

let recorder = require('../../lib/recorder');
let assert = require('assert');
let chai = require('chai').should();

describe('Recorder', () => {
  beforeEach(() => recorder.start());

  it('should create a promise', () => {
    recorder.promise().should.be.instanceof(Promise);
  });

  it('should execute finish handler in the end', (done) => {
    recorder.finishHandler(() => done());
    recorder.add(() => true);
    recorder.finalize();
  });

  it('should execute error handler on error', (done) => {
    recorder.errHandler(() => done());
    recorder.throw(new Error('err'));
    recorder.catch();
  });

  describe('#session', () => {
    it('can be started saving previous promise chain', () => {
      let order = '';
      recorder.add(() => order += 'a');
      recorder.add(() => {
        recorder.session.start();
        recorder.add(() => order += 'c');
        recorder.add(() => order += 'd');
      });
      recorder.add(() => recorder.session.restore());
      recorder.add(() => order += 'b');
      return recorder.promise()
        .then(() => assert.equal(order, 'acdb'));
    });
  });

  describe('#add', () => {
    it('should add steps to promise', () => {
      let counter = 0;
      recorder.add(() => counter++);
      recorder.add(() => counter++);
      recorder.add(() => counter.should.eql(2));
      return recorder.promise();
    });

    it('should not add steps when stopped', () => {
      let counter = 0;
      recorder.add(() => counter++);
      recorder.stop();
      recorder.add(() => counter++);
      return recorder.promise()
        .then(() => counter.should.eql(1));
    });
  });
});
