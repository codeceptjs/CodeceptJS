let event;
try {
  require.resolve('../../lib');
  event = require('../../lib').event;
} catch (err) {
  event = require('/codecept/lib').event; // eslint-disable-line
}
const assert = require('assert');
const expect = require('chai').expect;
const eventHandlers = require('../data/sandbox/eventHandlers');

const expectedEvents = [];

Feature('Events');

BeforeSuite((I) => {
  expectedEvents.push(...[
    event.suite.before,
  ]);
  expect(eventHandlers.events).to.deep.equal(expectedEvents);
});

Before((I) => {
  expectedEvents.push(...[
    event.test.before,
  ]);
  expect(eventHandlers.events).to.deep.equal(expectedEvents);
});

After((I) => {
  expectedEvents.push(...[
    event.test.passed,
    // event.test.after, // Does not fire until after After()
  ]);
  expect(eventHandlers.events).to.deep.equal(expectedEvents);
});

AfterSuite(() => {
  expectedEvents.push(...[
    event.test.after,
    // event.suite.after, // Does not fire until after AfterSuite()
    // event.all.result, // Does not fire until after AfterSuite()
    // event.all.after, // Does not fire until after AfterSuite()
  ]);

  expect(eventHandlers.events).to.deep.equal(expectedEvents);

  expectedEvents.forEach((name) => {
    assert.equal(eventHandlers.counter[name], 1, `${name} should have been fired`);
  });
});

Scenario('Event Hooks @WebDriverIO @Protractor @Nightmare @Puppeteer', (I) => {
  expectedEvents.push(...[
    event.test.started,
  ]);
  expect(eventHandlers.events).to.deep.equal(expectedEvents);
  assert.ok(true);
});
