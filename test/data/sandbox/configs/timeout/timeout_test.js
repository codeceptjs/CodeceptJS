Feature('Defualt Timeout');

Scenario('Should fail test by timeout', ({ I }) => {
  I.sleep(1500);
  I.sleep(20000);
  I.writeFile();
});
