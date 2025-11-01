import expect from 'chai'
import Appium from '../../lib/helper/Appium'

describe('Appium platformName normalization', () => {
  it('should normalize platformName to lowercase for Android', () => {
    const app = new Appium({
      platform: 'Android',
      desiredCapabilities: {
        platformName: 'Android',
      },
    })
    const config = app._validateConfig({
      platform: 'Android',
      desiredCapabilities: {
        platformName: 'Android',
      },
    })
    expect(config.capabilities.platformName).to.equal('android')
    expect(app.platform).to.equal('android')
  })

  it('should normalize platformName to lowercase for iOS', () => {
    const app = new Appium({
      platform: 'iOS',
      desiredCapabilities: {
        platformName: 'iOS',
      },
    })
    const config = app._validateConfig({
      platform: 'iOS',
      desiredCapabilities: {
        platformName: 'iOS',
      },
    })
    expect(config.capabilities.platformName).to.equal('ios')
    expect(app.platform).to.equal('ios')
  })

  it('should not change platformName if already lowercase', () => {
    const app = new Appium({
      platform: 'android',
      desiredCapabilities: {
        platformName: 'android',
      },
    })
    const config = app._validateConfig({
      platform: 'android',
      desiredCapabilities: {
        platformName: 'android',
      },
    })
    expect(config.capabilities.platformName).to.equal('android')
    expect(app.platform).to.equal('android')
  })
})
