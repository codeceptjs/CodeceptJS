Feature('Retry #Async hooks')

let i = 0

Before(async ({ I }) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      console.log('ok', i, new Date())
      i++
      if (i < 3) reject(new Error('not works'))
      resolve()
    }, 0)
  })
}).retry(2)

Scenario('async hook works', () => {
  console.log('works')
})
