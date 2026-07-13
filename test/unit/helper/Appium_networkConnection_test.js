import { expect } from 'chai'
import sinon from 'sinon'
import Appium from '../../../lib/helper/Appium.js'

function createApp() {
  const app = new Appium({
    platform: 'Android',
    desiredCapabilities: {
      platformName: 'Android',
    },
  })
  app.browser = { execute: sinon.stub() }
  return app
}

describe('Appium #setNetworkConnection, #grabNetworkConnection', () => {
  it('should call mobile: setConnectivity with airplane mode only for value 1', async () => {
    const app = createApp()
    await app.setNetworkConnection(1)
    expect(app.browser.execute.calledWith('mobile: setConnectivity', { airplaneMode: true, wifi: false, data: false })).to.be.true
  })

  it('should call mobile: setConnectivity with wifi only for value 2', async () => {
    const app = createApp()
    await app.setNetworkConnection(2)
    expect(app.browser.execute.calledWith('mobile: setConnectivity', { airplaneMode: false, wifi: true, data: false })).to.be.true
  })

  it('should call mobile: setConnectivity with data only for value 4', async () => {
    const app = createApp()
    await app.setNetworkConnection(4)
    expect(app.browser.execute.calledWith('mobile: setConnectivity', { airplaneMode: false, wifi: false, data: true })).to.be.true
  })

  it('should call mobile: setConnectivity with wifi and data for value 6', async () => {
    const app = createApp()
    await app.setNetworkConnection(6)
    expect(app.browser.execute.calledWith('mobile: setConnectivity', { airplaneMode: false, wifi: true, data: true })).to.be.true
  })

  it('should call mobile: setConnectivity with everything off for value 0', async () => {
    const app = createApp()
    await app.setNetworkConnection(0)
    expect(app.browser.execute.calledWith('mobile: setConnectivity', { airplaneMode: false, wifi: false, data: false })).to.be.true
  })

  it('should grab network connection using mobile: getConnectivity and map to legacy bitmask shape', async () => {
    const app = createApp()
    app.browser.execute.resolves({ airplaneMode: false, wifi: false, data: true })
    const val = await app.grabNetworkConnection()
    expect(app.browser.execute.calledWith('mobile: getConnectivity')).to.be.true
    expect(val.value).to.equal(4)
    expect(val.inAirplaneMode).to.equal(false)
    expect(val.hasWifi).to.equal(false)
    expect(val.hasData).to.equal(true)
  })

  it('should grab network connection with wifi and airplane mode combined', async () => {
    const app = createApp()
    app.browser.execute.resolves({ airplaneMode: true, wifi: true, data: false })
    const val = await app.grabNetworkConnection()
    expect(val.value).to.equal(3)
    expect(val.inAirplaneMode).to.equal(true)
    expect(val.hasWifi).to.equal(true)
    expect(val.hasData).to.equal(false)
  })

  it('should throw when used outside android platform', async () => {
    const app = new Appium({
      platform: 'iOS',
      desiredCapabilities: {
        platformName: 'iOS',
      },
    })
    app.browser = { execute: sinon.stub() }
    let error
    try {
      await app.setNetworkConnection(1)
    } catch (err) {
      error = err
    }
    expect(error).to.be.instanceOf(Error)
  })
})
