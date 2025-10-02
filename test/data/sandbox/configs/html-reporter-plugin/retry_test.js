Feature('HTML Reporter Retry Test')

let attemptCounter = 0

Scenario('test that fails first time then passes', ({ I }) => {
  attemptCounter++
  I.amInPath('.')
  if (attemptCounter === 1) {
    I.seeFile('this-file-does-not-exist.txt') // Will fail first time
  } else {
    I.seeFile('package.json') // Will pass on retry
  }
})

Scenario('test that always fails even with retries', ({ I }) => {
  I.amInPath('.')
  I.seeFile('this-will-never-exist.txt')
})

Scenario('test that passes without retries', ({ I }) => {
  I.amInPath('.')
  I.seeFile('codecept.conf.js')
})
