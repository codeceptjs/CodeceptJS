Given(/I have product with \$(\d+) price/, price => {
  const I = actor()
  I.addItem(parseInt(price, 10))
})
When('I go to checkout process', () => {
  const I = actor()
  I.checkout()
  I.checkout()
})

Then('I should see that total number of products is {int}', num => {
  const I = actor()
  I.seeNum(num)
})
Then('my order amount is ${int}', sum => {
  const I = actor()
  I.seeSum(sum)
})

Given('I have product with price {int}$ in my cart', price => {
  const I = actor()
  I.addItem(parseInt(price, 10))
})

Given('discount for orders greater than ${int} is {int} %', (maxPrice, discount) => {
  const I = actor()
  I.haveDiscountForPrice(maxPrice, discount)
})

When('I go to checkout', () => {
  const I = actor()
  I.checkout()
})

Then('I should see overall price is "{float}" $', price => {
  const I = actor()
  I.seeSum(price)
})

Given('I login', () => {
  const I = actor()
  I.login('user', secret('password'))
})

Given(/^I have this product in my cart$/, table => {
  let str = ''
  for (const id in table.rows) {
    const cells = table.rows[id].cells
    str += cells
      .map(c => c.value)
      .map(c => c.slice(0, 15).padEnd(15))
      .join(' | ')
    str += '\n'
  }
  console.log(str)
})

Then(/^I should see total price is "([^"]*)" \$$/, () => {})

Before(test => {
  console.log(`-- before ${test.title} --`)
})

After(test => {
  console.log(`-- after ${test.title} --`)
})

Fail(test => {
  console.log(`-- failed ${test.title} --`)
})
