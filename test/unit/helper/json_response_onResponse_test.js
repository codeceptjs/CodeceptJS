import assert from 'assert'
import REST from '../../../lib/helper/REST.js'
import Container from '../../../lib/container.js'
import TestHelper from '../../support/TestHelper.js'

const fallBackURL = 'https://jsonplaceholder.typicode.com'
//start the server using npm run test-server as in the package.json
let api_url = TestHelper.jsonServerUrl()

describe('REST onResponse Hook Wrapper', () => {
  let rest

  beforeEach(async () => {
    Container.helpers({})
    try {
      const controller = new AbortController()
      const id = setTimeout(() => controller.abort(), 1000)
      await fetch(`${api_url}`, { signal: controller.signal }) // Check if the server is reachable
      clearTimeout(id)
    } catch (e) {
      api_url = fallBackURL // Fallback to alternative endpoint
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

  it('should store response in this.response', async () => {
    const response = await rest.sendGetRequest('/posts/1')
    assert.ok(response, 'Expected response to be set on REST instance')
    assert.equal(response.status, 200)
  })

  it('should call onResponse function and preserve modifications', async () => {
    const response = await rest.sendGetRequest('/posts/1')
    assert.ok(response.customFlag, 'Expected original onResponse to run and modify response')
  })

  it('should not fail if original onResponse is not set in the config', async () => {
    const restNoHook = new REST({ endpoint: api_url })
    restNoHook._before()

    const response = await restNoHook.sendGetRequest('/posts/1')
    assert.ok(response, 'Expected response to be returned')
    assert.equal(response.status, 200)
  })

  it('should not throw if onResponse is not a function in the config', async () => {
    const restInvalid = new REST({
      endpoint: api_url,
      onResponse: undefined,
    })

    restInvalid._before()

    const response = await restInvalid.sendGetRequest('/posts/1')
    assert.ok(response)
    assert.equal(response.status, 200)
  })
})
