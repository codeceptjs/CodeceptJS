import assert from 'assert'
import { actor } from 'codeceptjs'
import Smth from '../pages/Smth.js'

const I = actor()
// Add in your custom step files

Given('I have a defined step', () => {
  // TODO: replace with your own step
  console.log('Step executed: I have a defined step')
})

Given('Open google', () => {
  I.amOnPage('https://www.google.com')
})

Given('I open GitHub', () => {
  Smth.openGitHub()
  I.dontSee('Ups')
})

Then('check link', async () => {
  // From "features\lawPage.feature" {"line":73,"column":7}
  const link = await I.grabAttributeFrom({ css: '#gbw > div > div > div.gb_qe.gb_R.gb_Pg.gb_Fg > div:nth-child(2) > a' }, 'href')
  const response = await I.sendGetRequest(link)
  assert(response.statusCode === 200)
  I.see('Google')
})

When(/^I see "(.*)" text and "(.*)" is not "(.*)"$/, async (text, text2, text3) => {
  console.log(`Step executed: I see "${text}" text and "${text2}" is not "${text3}"`)
  assert(text2 !== text3)
})
