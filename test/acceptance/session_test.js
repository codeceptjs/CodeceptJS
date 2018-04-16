Feature('Session');

Scenario('simple session @WebDriverIO', (I) => {
  I.amOnPage('/info');
  session('john', () => {
    I.amOnPage('/');
    I.seeInCurrentUrl('/');
  });
  I.seeInCurrentUrl('/info');
});

