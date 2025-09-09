import { actor } from 'codeceptjs'
import loginPage from './Login.js'

const I = actor()

class Smth {}

const smthMethods = {
  openGitHub() {
    I.amOnPage('https://github.com')
  },

  openAndLogin() {
    this.openGitHub()
    loginPage.login('something@totest.com', '1234356')
  },
}

Object.setPrototypeOf(smthMethods, Smth.prototype)

export default smthMethods
