import * as chai from 'chai'

const assert = chai.assert
const expect = chai.expect

import { 
  setRestartStrategy, 
  restartsSession, 
  restartsContext, 
  restartsBrowser 
} from '../../lib/helper/extras/PlaywrightRestartOpts.js'

describe('PlaywrightRestartOpts', function () {
  describe('setRestartStrategy', function () {
    it('should set context restart when restart is false', function () {
      setRestartStrategy({ restart: false })
      assert.isFalse(restartsSession())
      assert.isTrue(restartsContext())
      assert.isFalse(restartsBrowser())
    })

    it('should set browser restart when restart is true', function () {
      setRestartStrategy({ restart: true })
      assert.isFalse(restartsSession())
      assert.isFalse(restartsContext())
      assert.isTrue(restartsBrowser())
    })

    it('should set context restart when restart is "context"', function () {
      setRestartStrategy({ restart: 'context' })
      assert.isFalse(restartsSession())
      assert.isTrue(restartsContext())
      assert.isFalse(restartsBrowser())
    })

    it('should set session restart when restart is "session"', function () {
      setRestartStrategy({ restart: 'session' })
      assert.isTrue(restartsSession())
      assert.isFalse(restartsContext())
      assert.isFalse(restartsBrowser())
    })

    it('should set browser restart when restart is "browser"', function () {
      setRestartStrategy({ restart: 'browser' })
      assert.isFalse(restartsSession())
      assert.isFalse(restartsContext())
      assert.isTrue(restartsBrowser())
    })
  })
})
