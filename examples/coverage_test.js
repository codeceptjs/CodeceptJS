Feature('Local server');

Scenario('Render buttons', ({ I }) => {
  I.amOnPage('http://127.0.0.1:8080/');
  I.see('Hi');
  I.forceClick('Hi');
});
