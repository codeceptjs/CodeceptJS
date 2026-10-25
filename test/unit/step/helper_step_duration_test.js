import { expect } from 'chai'
import HelperStep from '../../../lib/step/helper.js'

describe('HelperStep duration', () => {
  const helper = {
    slowAction: () => new Promise(resolve => setTimeout(() => resolve('done'), 60)),
    slowFailure: () => new Promise((_, reject) => setTimeout(() => reject(new Error('boom')), 60)),
    syncAction: () => 'sync',
  }

  it('ends an async step when its promise resolves', async () => {
    const step = new HelperStep(helper, 'slowAction')
    const result = await step.run()
    expect(result).to.equal('done')
    expect(step.duration).to.be.at.least(50)
  })

  it('ends an async step when its promise rejects', async () => {
    const step = new HelperStep(helper, 'slowFailure')
    try {
      await step.run()
      throw new Error('should have thrown')
    } catch (err) {
      expect(err.message).to.equal('boom')
    }
    expect(step.duration).to.be.at.least(50)
  })

  it('keeps the returned value of a sync step', () => {
    const step = new HelperStep(helper, 'syncAction')
    expect(step.run()).to.equal('sync')
    expect(step.endTime).to.be.at.least(step.startTime)
  })
})
