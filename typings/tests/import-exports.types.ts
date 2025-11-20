import { expectType } from 'tsd'
import { container, codecept, Codecept, output, event, recorder, config, actor, helper, Helper, pause, within, dataTable, dataTableArgument, store, locator } from 'codeceptjs'
import defaultExport from 'codeceptjs'

// Test that container can be imported and has the expected methods
const helpers = container.helpers()
const helper1 = container.helpers('Playwright')
const support = container.support()
const plugins = container.plugins()

expectType<typeof CodeceptJS.Codecept>(codecept)
expectType<typeof CodeceptJS.Codecept>(Codecept)
expectType<typeof CodeceptJS.output>(output)
expectType<typeof CodeceptJS.event>(event)
expectType<CodeceptJS.recorder>(recorder)
expectType<typeof CodeceptJS.Config>(config)
expectType<CodeceptJS.actor>(actor)
expectType<typeof CodeceptJS.Helper>(helper)
expectType<typeof CodeceptJS.Helper>(Helper)
expectType<typeof CodeceptJS.pause>(pause)
expectType<typeof CodeceptJS.within>(within)
expectType<typeof CodeceptJS.DataTable>(dataTable)
expectType<typeof CodeceptJS.DataTableArgument>(dataTableArgument)
expectType<typeof CodeceptJS.store>(store)
expectType<typeof CodeceptJS.Locator>(locator)

expectType<typeof defaultExport>(defaultExport)
