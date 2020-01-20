Feature('CustomLocator plugin');

Scenario('showActual on steps', (I) => {
  I.dontSee('abc', '$carrier-bag-charge-label');
});
