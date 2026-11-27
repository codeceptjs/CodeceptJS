import Step from './base.js'
import MetaStep from './meta.js'

const metaSteps = new Map()
const registry = new FinalizationRegistry(id => {
  if (!metaSteps.get(id)?.deref()) metaSteps.delete(id)
})

function getMetaStep(data) {
  let metaStep = metaSteps.get(data.id)?.deref()
  if (!metaStep) {
    metaStep = new MetaStep(data.actor, data.title)
    metaSteps.set(data.id, new WeakRef(metaStep))
    registry.register(metaStep, data.id)
  }
  return metaStep
}

function deserializeStep(data) {
  if (!data || data instanceof Step) return data

  const { metaStep, humanizedArgs, text, ...props } = data
  const step = props.id ? getMetaStep(props) : new Step(props.title)
  Object.assign(step, props)

  if (humanizedArgs !== undefined) step.humanizeArgs = () => humanizedArgs
  if (text !== undefined) step.toString = () => text
  step.metaStep = metaStep ? deserializeStep(metaStep) : undefined

  return step
}

export default deserializeStep
