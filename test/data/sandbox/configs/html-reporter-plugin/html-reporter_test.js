Feature('HTML Reporter Test')

Scenario('test with multiple steps', ({ I }) => {
  I.amInPath('.')
  I.seeFile('package.json')
})

Scenario('test that will fail', ({ I }) => {
  I.amInPath('.')
  I.seeFile('this-file-should-not-exist.txt')
})

Scenario('test that will pass', ({ I }) => {
  I.amInPath('.')
  I.seeFile('codecept.conf.js')
})