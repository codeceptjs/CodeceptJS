Feature('login')

Scenario('login', ({ I }) => {
  I.fillField('Email', 'user@example.com')
  I.fillField('Password', '123456')
  I.fillField('Password', secret('123456'))
  I.fillField('#api_key', process.env.API_KEY)
  I.fillField('Token', secret(process.env.AUTH_TOKEN))
  I.sendPostRequest('/login', process.env.USER_PASSWORD)
  I.fillField('Username', process.env.USERNAME)
})
