// @TODO: Need tests arguments of protected methods

import Helper from '@codeceptjs/helper'
import { expectError, expectType } from 'tsd';

class CustomClass extends Helper {
  constructor(config: any) {
    super(
      expectType<any>(config)
    )
    // @ts-ignore
    expectType<any>(this.helpers)
    expectError(this.debug())
    expectError(this.debugSection())
    expectError(this.debugSection('[Section]'))

    // @ts-ignore
    expectType<void>(this.debug('log'))
    // @ts-ignore
    expectType<void>(this.debugSection('[Section]', 'log'))
  }
  _failed() {}
  _finishTest() {}
  _init() {}
  _passed() {}
  _setConfig() {}
  _useTo() {}
  _validateConfig() {}
  _before() {}
  _beforeStep() {}
  _beforeSuite() {}
  _after() {}
  _afterStep() {}
  _afterSuite() {}
}

const customClass = new CustomClass({})

expectType<void>(customClass._failed())
expectType<void>(customClass._finishTest())
expectType<void>(customClass._init())
expectType<void>(customClass._passed())
expectType<void>(customClass._setConfig())
expectType<void>(customClass._validateConfig())
expectType<void>(customClass._before())
expectType<void>(customClass._beforeStep())
expectType<void>(customClass._beforeSuite())
expectType<void>(customClass._after())
expectType<void>(customClass._afterStep())
expectType<void>(customClass._afterSuite())

expectType<void>(customClass._useTo())

class CapableHelper extends Helper {
  capabilities: CodeceptJS.HelperCapabilities = { screenshot: true, video: false, trace: false, aria: true }
}

expectType<CodeceptJS.HelperCapabilities>(new CapableHelper({}).capabilities)

class DetectingHelper extends Helper {
  capabilities: CodeceptJS.HelperCapabilities = { screenshot: null, video: null, trace: false, aria: false, layout: null }
}

expectType<CodeceptJS.HelperCapabilities>(new DetectingHelper({}).capabilities)

class IncompleteHelper extends Helper {
  // @ts-expect-error
  capabilities: CodeceptJS.HelperCapabilities = { screenshot: true }
}

class WrongValueHelper extends Helper {
  // @ts-expect-error
  capabilities: CodeceptJS.HelperCapabilities = { screenshot: true, video: false, trace: false, aria: false, layout: 'partial' }
}
