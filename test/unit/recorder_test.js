const { expect } = require('chai');

const recorder = require('../../lib/recorder');

describe('Recorder', () => {
  beforeEach(() => recorder.start());

  it('should create a promise', () => {
    expect(recorder.promise()).to.be.instanceof(Promise);
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
        .then(() => expect(order).is.equal('acdb'));
    });
  });

  describe('#add', () => {
    it('should add steps to promise', () => {
      let counter = 0;
      recorder.add(() => counter++);
      recorder.add(() => counter++);
      recorder.add(() => expect(counter).eql(2));
      return recorder.promise();
    });

    it('should not add steps when stopped', () => {
      let counter = 0;
      recorder.add(() => counter++);
      recorder.stop();
      recorder.add(() => counter++);
      return recorder.promise()
        .then(() => expect(counter).eql(1));
    });
  });

  describe('#retry', () => {
    it('should retry failed steps when asked', () => {
      let counter = 0;
      recorder.retry(2);
      recorder.add(() => {
        counter++;
        if (counter < 3) {
          throw new Error('ups');
        }
      }, undefined, undefined, true);
      return recorder.promise();
    });

    it('should create a chain of retries', () => {
      let counter = 0;
      const errorText = 'noerror';
      recorder.retry({ retries: 2, when: (err) => { return err.message === errorText; } });
      recorder.retry({ retries: 2, when: (err) => { return err.message === 'othererror'; } });

      recorder.add(() => {
        counter++;
        if (counter < 3) {
          throw new Error(errorText);
        }
      }, undefined, undefined, true);
      return recorder.promise();
    });

    it('should prefer opts for non-when retry when possible', () => {
      let counter = 0;
      const errorText = 'noerror';
      recorder.retry({ retries: 2 });
      recorder.retry({ retries: 100, when: (err) => { return err.message === errorText; } });

      recorder.add(() => {
        counter++;
        if (counter < 3) {
          throw new Error(errorText);
        }
      }, undefined, undefined, true);
      return recorder.promise();
    });
  });
});
