const { I } = inject()

Given('I setup the test environment', () => {
  console.log('Setting up test environment')
})

Given('I have a basic setup', () => {
  console.log('Basic setup completed')
})

When('I perform an action', () => {
  console.log('Performing action')
})

Then('I should see the expected result', () => {
  console.log('Expected result verified')
})

Then('everything should work correctly', () => {
  console.log('Everything working correctly')
})

Given('I have the following items:', (table) => {
  const data = table.parse()
  console.log('Items:', data)
})

When('I process the items', () => {
  console.log('Processing items')
})

Then('the total should be {int}', (total) => {
  console.log('Total verified:', total)
})

Given('I have a setup that will fail', () => {
  console.log('Setup that will fail')
})

When('I perform a failing action', () => {
  throw new Error('This is an intentional failure for testing')
})

Then('this step will not be reached', () => {
  console.log('This should not be reached')
})