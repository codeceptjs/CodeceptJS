import { actor } from 'codeceptjs'

const I = actor()

const loginMethods = {
  login(email, password) {
    I.click('Sign in')
    I.fillField('Username or email address', email)
    I.fillField('Password', password)
    I.click('Sign in')
  },
}

Object.setPrototypeOf(loginMethods, class Login {}.prototype)

export default loginMethods
