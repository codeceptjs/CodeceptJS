const MAX_KEY_PRESSES = 1000

function readSliderState(node) {
  const attr = name => node.getAttribute(name)
  const rect = node.getBoundingClientRect()
  return {
    min: attr('aria-valuemin') !== null ? attr('aria-valuemin') : attr('min'),
    max: attr('aria-valuemax') !== null ? attr('aria-valuemax') : attr('max'),
    value: attr('aria-valuenow') !== null ? attr('aria-valuenow') : node.value,
    step: attr('step'),
    orientation: attr('aria-orientation'),
    width: rect.width,
    height: rect.height,
  }
}

function toNumber(value, fallback = null) {
  if (value === null || value === undefined || value === '') return fallback
  const num = Number(value)
  return Number.isNaN(num) ? fallback : num
}

function sliderKeys(orientation) {
  if (orientation === 'vertical') return { increase: 'ArrowUp', decrease: 'ArrowDown' }
  return { increase: 'ArrowRight', decrease: 'ArrowLeft' }
}

function tolerance(step) {
  return Math.max(1e-9, Math.abs(step) * 1e-6)
}

async function currentValue(actions, fallback) {
  return toNumber((await actions.state()).value, fallback)
}

async function pressTowards(actions, plan, options) {
  const { target, step, keys, locator } = options
  let current = plan.from

  if (plan.key) {
    await actions.press(plan.key)
    current = await currentValue(actions, plan.from)
  }

  const presses = Math.round(Math.abs(target - current) / step)
  if (presses > MAX_KEY_PRESSES) {
    throw new Error(`Slider (${locator}) needs ${presses} key presses to reach ${target}, which is over the limit of ${MAX_KEY_PRESSES}`)
  }

  const key = target > current ? keys.increase : keys.decrease
  for (let i = 0; i < presses; i++) {
    await actions.press(key)
  }
  return currentValue(actions, current)
}

/**
 * Drives a slider to an absolute value with the keyboard.
 *
 * Dragging can not reach a slider that has no bounding box and `fill()` is refused by widgets
 * that are not form fields, while `focus()` plus Home/End and arrow keys works for both.
 *
 * `actions` adapts the helper: `state()` reads the slider attributes, `focus()` focuses it and
 * `press(key)` sends a single key without waiting between steps.
 */
async function setSliderToValue(actions, locator, value) {
  const target = toNumber(value)
  if (target === null) throw new Error(`Slider (${locator}) can not be set to "${value}", a number is expected`)

  const state = await actions.state()
  const min = toNumber(state.min, 0)
  const max = toNumber(state.max, 100)
  const keys = sliderKeys(state.orientation)

  if (target < min || target > max) {
    throw new Error(`Slider (${locator}) can not be set to ${target}, its range is ${min}..${max}`)
  }

  await actions.focus()

  let step = toNumber(state.step)
  let current = toNumber(state.value)

  if (step === null || step <= 0) {
    if (current === null) {
      await actions.press('Home')
      current = await currentValue(actions, min)
    }
    const before = current
    await actions.press(before >= max ? keys.decrease : keys.increase)
    current = await currentValue(actions, before)
    step = Math.abs(current - before)
    if (!step) {
      throw new Error(`Slider (${locator}) does not react to arrow keys, its value can not be set`)
    }
  }

  const eps = tolerance(step)
  const isReachable = distance => Math.abs(Math.round(distance / step) * step - distance) <= eps

  if (!isReachable(target - min)) {
    const lower = min + Math.floor((target - min) / step) * step
    throw new Error(`Slider (${locator}) can not be set to ${target}, with step ${step} the nearest values are ${lower} and ${lower + step}`)
  }

  const starts = []
  if (current !== null && isReachable(target - current)) starts.push({ key: null, from: current })
  starts.push({ key: 'Home', from: min })
  if (isReachable(max - min)) starts.push({ key: 'End', from: max })

  const options = { target, step, keys, locator }
  const plan = starts.reduce((best, start) => (Math.abs(target - start.from) < Math.abs(target - best.from) ? start : best))

  let reached = await pressTowards(actions, plan, options)

  if (Math.abs(reached - target) > eps && !plan.key) {
    reached = await pressTowards(actions, { key: 'Home', from: min }, options)
  }

  if (Math.abs(reached - target) > eps) {
    throw new Error(`Slider (${locator}) stopped at ${reached} instead of ${target}, the value was clamped or stepped differently`)
  }
  return reached
}

/**
 * Moves a slider by `offset` steps with the keyboard.
 * Used by dragSlider when the element has no bounding box to drag along.
 */
async function nudgeSliderByKeyboard(actions, offset) {
  const state = await actions.state()
  const keys = sliderKeys(state.orientation)
  const presses = Math.min(Math.abs(Math.round(offset)), MAX_KEY_PRESSES)
  const key = offset < 0 ? keys.decrease : keys.increase

  await actions.focus()
  for (let i = 0; i < presses; i++) {
    await actions.press(key)
  }
}

function isSliderWithoutBox(state) {
  return !state || !state.width || !state.height
}

export { readSliderState, setSliderToValue, nudgeSliderByKeyboard, isSliderWithoutBox, sliderKeys, MAX_KEY_PRESSES }
