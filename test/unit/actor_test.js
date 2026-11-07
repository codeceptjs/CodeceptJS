import path from 'path'
import { expect } from 'expect'
import { fileURLToPath } from 'url'

import actor from '../../lib/actor.js'
import container from '../../lib/container.js'
import recorder from '../../lib/recorder.js'
import step from '../../lib/steps.js'
import event from '../../lib/event.js'
import store from '../../lib/store.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

global.codecept_dir = path.join(__dirname, '/..')
let I
let counter

describe('Actor', () => {
  beforeEach(async () => {
    counter = 0
    await container.clear(
      {
        MyHelper: {
          hello: () => 'hello world',
          bye: () => 'bye world',
          die: () => {
            throw new Error('ups')
          },
          _hidden: () => 'hidden',
          slow: () => new Promise(resolve => setTimeout(resolve, 200)),
          failAfter: (i = 1) => {
            counter++
            if (counter <= i) throw new Error('ups')
            counter = 0
          },
        },
        MyHelper2: {
          greeting: () => 'greetings, world',
        },
      },
      undefined,
      undefined,
    )
    store.actor = null
    const translation = container.translation()
    if (translation && translation.vocabulary && translation.vocabulary.actions) {
      translation.vocabulary.actions.hello = 'привет'
    }
    I = actor({}, container)
    await container.started()
    event.cleanDispatcher()
  })

  it('should collect pageobject methods in actor', async () => {
    const poI = actor(
      {
        customStep: () => {},
      },
      container,
    )
    expect(poI).toHaveProperty('customStep')
    expect(I).toHaveProperty('customStep')
  })

  it('should correct run step from Helper inside PageObject', () => {
    actor(
      {
        customStep() {
          return this.hello()
        },
      },
      container,
    )
    recorder.start()
    const promise = I.customStep()
    return promise.then(val => expect(val).toEqual('hello world'))
  })

  it('should init pageobject methods as metastep', () => {
    actor(
      {
        customStep: () => 3,
      },
      container,
    )
    expect(I.customStep()).toEqual(3)
  })

  it('should correct add translation for step from Helper', () => {
    expect(I).toHaveProperty('привет')
  })

  it('should correct add translation for step from PageObject', async () => {
    const translation = container.translation()
    if (translation && translation.vocabulary && translation.vocabulary.actions) {
      translation.vocabulary.actions.customStep = 'кастомный_шаг'
    }
    actor(
      {
        customStep: () => 3,
      },
      container,
    )
    await container.started()
    if (translation && translation.vocabulary && translation.vocabulary.actions) {
      expect(I).toHaveProperty('кастомный_шаг')
    }
  })

  it('should take all methods from helpers and built in', () => {
    ;['hello', 'bye', 'die', 'failAfter', 'say', 'greeting'].forEach(key => {
      expect(I).toHaveProperty(key)
    })
  })

  it('should return promise', () => {
    recorder.start()
    const promise = I.hello()
    expect(promise).toBeInstanceOf(Promise)
    return promise.then(val => expect(val).toEqual('hello world'))
  })

  it('should produce step events', () => {
    recorder.start()
    let listeners = 0
    event.dispatcher.addListener(event.step.before, () => listeners++)
    event.dispatcher.addListener(event.step.after, () => listeners++)
    event.dispatcher.addListener(event.step.passed, step => {
      listeners++
      expect(step.endTime).toBeTruthy()
      expect(step.startTime).toBeTruthy()
    })

    return I.hello().then(() => {
      expect(listeners).toEqual(3)
    })
  })

  it('should alway use the latest global retry options', () => {
    recorder.start()
    recorder.retry({
      retries: 0,
      minTimeout: 0,
      when: () => true,
    })
    recorder.retry({
      retries: 1,
      minTimeout: 0,
      when: () => true,
    })
    I.hello() // before fix: this changed the order of retries
    return I.failAfter(1)
  })

  it('should not delete a global retry option', () => {
    recorder.start()
    recorder.retry({
      retries: 2,
      minTimeout: 0,
      when: () => true,
    })
    I.failAfter(1, step.retry(1)) // before fix: this changed the order of retries
    return I.failAfter(2)
  })

  it('should measure duration of a retried step from its first attempt', () => {
    recorder.start()
    let duration
    event.dispatcher.addListener(event.step.finished, step => (duration = step.duration))

    return I.failAfter(2, step.retry({ retries: 2, minTimeout: 100, factor: 1 })).then(() => {
      expect(duration).toBeGreaterThanOrEqual(190)
    })
  })

  it('should print handle failed steps', () => {
    recorder.start()
    let listeners = 0
    event.dispatcher.addListener(event.step.before, () => listeners++)
    event.dispatcher.addListener(event.step.after, () => listeners++)
    event.dispatcher.addListener(event.step.failed, step => {
      listeners++
      expect(step.endTime).toBeTruthy()
      expect(step.startTime).toBeTruthy()
    })

    return I.die()
      .then(() => (listeners = 0))
      .catch(() => null)
      .then(() => {
        expect(listeners).toEqual(3)
      })
  })

  describe('element selection chain', () => {
    let startedOpts

    beforeEach(() => {
      startedOpts = undefined
      event.dispatcher.on(event.step.started, step => (startedOpts = step.opts))
      recorder.start()
    })

    it('should select first element and keep the step result', async () => {
      const val = await I.hello().first()
      expect(val).toEqual('hello world')
      expect(startedOpts.elementIndex).toEqual('first')
    })

    it('should select last element', async () => {
      await I.hello().last()
      expect(startedOpts.elementIndex).toEqual('last')
    })

    it('should select element by position', async () => {
      await I.hello().at(2)
      expect(startedOpts.elementIndex).toEqual(2)
    })

    it('should keep options passed with step.opts', async () => {
      await I.hello(step.opts({ exact: true })).last()
      expect(startedOpts).toEqual({ exact: true, elementIndex: 'last' })
    })

    it('should not change the options object shared between steps', async () => {
      const config = step.opts({ exact: true })
      await I.hello(config).first()
      expect(config.getConfig().opts).toEqual({ exact: true })
    })

    it('should use the option of the last selection in the chain', async () => {
      await I.hello().first().at(3)
      expect(startedOpts.elementIndex).toEqual(3)
    })

    it('should fail when selection is applied after the step was executed', async () => {
      const promise = I.hello()
      await promise
      expect(() => promise.first()).toThrow('already')
    })
  })

  describe('step config chain', () => {
    const noDelay = retries => ({ retries, minTimeout: 0 })

    beforeEach(() => {
      recorder.retries = []
      recorder.start()
    })

    afterEach(() => {
      recorder.stop()
      recorder.reset()
      recorder.retries = []
    })

    it('should interrupt a step with a chained timeout', async () => {
      await expect(I.slow().timeout(0.01)).rejects.toThrow('interrupted on timeout')
    })

    it('should keep the step running within a chained timeout', async () => {
      await expect(I.hello().timeout(5)).resolves.toEqual('hello world')
    })

    it('should retry a step with a chained retry', async () => {
      await I.failAfter(2).retry(noDelay(2))
      expect(counter).toEqual(0)
    })

    it('should accept a number of retries', async () => {
      I.failAfter(1).retry(1)
      expect(recorder.retries).toEqual([{ retries: 1 }])
      await recorder.promise()
    })

    it('should remove a chained retry when the step passes', async () => {
      await I.failAfter(1).retry(noDelay(1))
      await recorder.promise()
      expect(recorder.retries).toEqual([])
    })

    it('should remove a chained retry when the step fails', async () => {
      await expect(I.die().retry(noDelay(1))).rejects.toThrow('ups')
      expect(recorder.retries).toEqual([])
    })

    it('should not retry the next step after a chained retry', async () => {
      await I.hello().retry(noDelay(3))
      await recorder.promise()
      await expect(I.failAfter(1)).rejects.toThrow('ups')
    })

    it('should keep a global retry rule', async () => {
      const globalRule = { retries: 2, minTimeout: 0, when: () => true }
      recorder.retry(globalRule)
      await I.failAfter(1).retry(noDelay(1))
      await recorder.promise()
      expect(recorder.retries).toEqual([globalRule])
    })

    it('should replace a retry chained twice', async () => {
      await I.failAfter(1).retry(noDelay(0)).retry(noDelay(1))
      await recorder.promise()
      expect(recorder.retries).toEqual([])
    })

    it('should apply every option of a step config', async () => {
      let startedOpts
      event.dispatcher.on(event.step.started, started => (startedOpts = started.opts))
      const config = step.opts({ exact: true }).timeout(0.01)
      await expect(I.slow().stepConfig(config)).rejects.toThrow('interrupted on timeout')
      expect(startedOpts).toEqual({ exact: true })
    })

    it('should combine selection with timeout and retry', async () => {
      let startedOpts
      event.dispatcher.on(event.step.started, started => (startedOpts = started.opts))
      const val = await I.hello().first().timeout(5).retry(noDelay(1))
      expect(val).toEqual('hello world')
      expect(startedOpts.elementIndex).toEqual('first')
    })

    it('should fail when a config is applied after the step was executed', async () => {
      const promise = I.hello()
      await promise
      expect(() => promise.timeout(1)).toThrow('already')
      expect(() => promise.retry(1)).toThrow('already')
    })
  })
})
