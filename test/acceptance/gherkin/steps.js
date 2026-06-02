const I = actor();
const event = codeceptjs.event;

const capturedScenarios = [];

Before(test => {
  capturedScenarios.push({
    phase: 'Before-hook',
    title: test && test.title,
    tags: test && Array.isArray(test.tags) ? [...test.tags] : null,
  });
});

After(test => {
  capturedScenarios.push({
    phase: 'After-hook',
    title: test && test.title,
    tags: test && Array.isArray(test.tags) ? [...test.tags] : null,
  });
});

event.dispatcher.on(event.test.before, test => {
  capturedScenarios.push({
    phase: 'event.test.before',
    title: test && test.title,
    tags: test && Array.isArray(test.tags) ? [...test.tags] : null,
  });
});

event.dispatcher.on(event.test.after, test => {
  capturedScenarios.push({
    phase: 'event.test.after',
    title: test && test.title,
    tags: test && Array.isArray(test.tags) ? [...test.tags] : null,
  });
});

Given('I opened website', () => {
  // From "gherkin/basic.feature" {"line":8,"column":5}
  I.amOnPage('/');
});

Then('the Before hook should have captured this scenario', () => {
  const captureSnapshot = JSON.stringify(capturedScenarios, null, 2);

  const matchesScenario = entry =>
    entry.tags && entry.tags.includes('@scenarioHook') && entry.tags.includes('@hookCapture');

  const bddBefore = capturedScenarios.find(
    entry => entry.phase === 'Before-hook' && matchesScenario(entry),
  );
  const eventBefore = capturedScenarios.find(
    entry => entry.phase === 'event.test.before' && matchesScenario(entry),
  );

  if (!bddBefore) throw new Error(`BDD Before() did not fire for @scenarioHook. Captured:\n${captureSnapshot}`);
  if (!eventBefore) throw new Error(`event.test.before did not fire with real test. Captured:\n${captureSnapshot}`);

  for (const entry of [bddBefore, eventBefore]) {
    if (!entry.title || entry.title === '...') {
      throw new Error(`Placeholder title in ${entry.phase}: ${JSON.stringify(entry)}`);
    }
    if (!entry.title.includes('Before hook captures scenario metadata')) {
      throw new Error(`Unexpected title in ${entry.phase}: ${JSON.stringify(entry)}`);
    }
  }
});

When('go to {string} page', (url) => {
  // From "gherkin/basic.feature" {"line":9,"column":5}
  I.amOnPage(url);
  I.seeInCurrentUrl(url);
});

Then('I should see {string}', (str) => {
  // From "gherkin/basic.feature" {"line":10,"column":5}
  I.see(str);
});

Given('I opened {string} website', (website) => {
  I.amOnPage(website);
});

Then('I should be able to fill the value in Hello Binding Shadow Input Element', () => {
  I.fillField({ shadow: ['my-app', 'recipe-hello-binding', 'ui-input', 'input.input'] }, 'value');
});
