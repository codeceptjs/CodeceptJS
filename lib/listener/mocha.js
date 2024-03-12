import * as event from '../event.js';
import container from '../container.js';

export default function () {
  let mocha;

  event.dispatcher.on(event.all.before, () => {
    mocha = container.mocha();
  });

  event.dispatcher.on(event.test.passed, (test) => {
    mocha.Runner.emit('pass', test);
  });

  event.dispatcher.on(event.test.failed, (test, err) => {
    test.state = 'failed';
    mocha.Runner.emit('fail', test, err);
  });
}
