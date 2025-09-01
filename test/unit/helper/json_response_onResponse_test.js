const assert = require('assert')
const REST = require('../../../lib/helper/REST')
const Container = require('../../../lib/container')

const TestHelper = require('../../support/TestHelper')
const axios = require('axios')
const fallBackURL = 'https://jsonplaceholder.typicode.com'
//start the server using npm run test-server as in the package.json
let api_url = TestHelper.jsonServerUrl()

describe('REST onResponse Hook Wrapper', () => {
  let rest
  let isNetworkAvailable = false

  beforeEach(async () => {
    Container.helpers({})
    try {
      await axios.get(`${api_url}`, { timeout: 1000 }) // Check if the server is reachable
      isNetworkAvailable = true
    } catch (e) {
      try {
        await axios.get(fallBackURL, { timeout: 1000 }) // Check if fallback is reachable
        api_url = fallBackURL // Fallback to alternative endpoint
        isNetworkAvailable = true
      } catch (fallbackError) {
        isNetworkAvailable = false
        return // Skip REST initialization if no network is available
      }
    }

    rest = new REST({
      endpoint: api_url,
      onResponse: res => {
        res.customFlag = true
      },
    })

    rest._before()
  })

  afterEach(() => {
    rest = null
  })

  it('should store response in this.response', function() {
    if (!isNetworkAvailable) {
      return this.skip()
    }
    return rest.sendGetRequest('/posts/1').then(response => {
      assert.ok(response, 'Expected response to be set on REST instance')
      assert.equal(response.status, 200)
    })
  })

  it('should call onResponse function and preserve modifications', function() {
    if (!isNetworkAvailable) {
      return this.skip()
    }
    return rest.sendGetRequest('/posts/1').then(response => {
      assert.ok(response.customFlag, 'Expected original onResponse to run and modify response')
    })
  })

  it('should not fail if original onResponse is not set in the config', function() {
    if (!isNetworkAvailable) {
      return this.skip()
    }
    const restNoHook = new REST({ endpoint: api_url })
    restNoHook._before()

    return restNoHook.sendGetRequest('/posts/1').then(response => {
      assert.ok(response, 'Expected response to be returned')
      assert.equal(response.status, 200)
    })
  })

  it('should not throw if onResponse is not a function in the config', function() {
    if (!isNetworkAvailable) {
      return this.skip()
    }
    const restInvalid = new REST({
      endpoint: api_url,
      onResponse: undefined,
    })

    restInvalid._before()

    return restInvalid.sendGetRequest('/posts/1').then(response => {
      assert.ok(response)
      assert.equal(response.status, 200)
    })
  })
})
