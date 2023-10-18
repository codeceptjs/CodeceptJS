const I = actor();

Given('ich habe ein Produkt mit einem Preis von {int}$ in meinem Warenkorb', (price) => {
  I.addItem(parseInt(price, 10));
});

Given('der Rabatt für Bestellungen über $\{int} beträgt {int} %', (maxPrice, discount) => { // eslint-disable-line
  I.haveDiscountForPrice(maxPrice, discount);
});

When('ich zur Kasse gehe', () => {
  I.checkout();
});

Then('sollte ich den Gesamtpreis von "{float}" $ sehen', (price) => {
  I.seeSum(price);
});
