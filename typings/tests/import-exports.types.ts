import { expectType } from 'tsd'
import { container, codecept, output, event, recorder, config, actor, helper, pause, within, dataTable, dataTableArgument, store, locator, heal, ai, Workers, Secret, secret } from 'codeceptjs'
import defaultExport from 'codeceptjs'

expectType<typeof CodeceptJS.Container>(container)
expectType<typeof CodeceptJS.Codecept>(codecept)
expectType<typeof CodeceptJS.output>(output)
expectType<typeof CodeceptJS.event>(event)
expectType<CodeceptJS.recorder>(recorder)
expectType<typeof CodeceptJS.Config>(config)
expectType<CodeceptJS.actor>(actor)
expectType<typeof CodeceptJS.Helper>(helper)
expectType<typeof CodeceptJS.pause>(pause)
expectType<typeof CodeceptJS.within>(within)
expectType<typeof CodeceptJS.DataTable>(dataTable)
expectType<typeof CodeceptJS.DataTableArgument>(dataTableArgument)
expectType<typeof CodeceptJS.store>(store)
expectType<typeof CodeceptJS.Locator>(locator)
expectType<typeof CodeceptJS.Secret>(Secret)
expectType<typeof CodeceptJS.secret>(secret)

expectType<typeof defaultExport>(defaultExport)

const helperInstance = container.helpers('Playwright')
