const I = actor()

Given('ik heb een product met een prijs van {int}$ in mijn winkelwagen', price => {
  I.addItem(parseInt(price, 10))
})

Given('de korting voor bestellingen van meer dan ${int} is {int} %', (maxPrice, discount) => {
  I.haveDiscountForPrice(maxPrice, discount)
})

When('ik naar de kassa ga', () => {
  I.checkout()
})

Then('zou ik de totaalprijs van "{float}" $ moeten zien', price => {
  I.seeSum(price)
})
