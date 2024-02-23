const Container = require('../../../../../lib/container.js').default;

const given = when = then = Container.plugins('commentStep');
const { I } = inject();

Feature('Steps');

Scenario('Default command timeout', ({ I }) => {
  I.exceededByTimeout(1500);
});

Scenario('Wait command timeout', ({ I }) => {
  I.waitForSleep(1500);
});

Scenario('Rerun sleep', ({ I }) => {
  I.retry(2).statefulSleep(2250);
});

Scenario('Wait with longer timeout', ({ I }) => {
  I.waitTadLonger(750);
});

Scenario('Wait with shorter timeout', ({ I }) => {
  I.waitTadShorter(750);
});
