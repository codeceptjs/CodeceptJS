const { isGenerator } = require('../utils')
const DataTable = require('./table')
const DataScenarioConfig = require('./dataScenarioConfig')
const Secret = require('../secret')

module.exports = function (context) {
  context.Data = function (dataTable) {
    const data = detectDataType(dataTable)
    return {
      Scenario(title, opts, fn) {
        const scenarios = []
        if (typeof opts === 'function' && !fn) {
          fn = opts
          opts = {}
        }
        opts.data = data.map(dataRow => dataRow.data)
        data.forEach(dataRow => {
          const dataTitle = replaceTitle(title, dataRow)
          if (dataRow.skip) {
            context.xScenario(dataTitle)
          } else {
            scenarios.push(context.Scenario(dataTitle, opts, fn).inject({ current: dataRow.data }))
          }
        })
        maskSecretInTitle(scenarios)
        return new DataScenarioConfig(scenarios)
      },
      only: {
        Scenario(title, opts, fn) {
          const scenarios = []
          if (typeof opts === 'function' && !fn) {
            fn = opts
            opts = {}
          }
          opts.data = data.map(dataRow => dataRow.data)
          data.forEach(dataRow => {
            const dataTitle = replaceTitle(title, dataRow)
            if (dataRow.skip) {
              context.xScenario(dataTitle)
            } else {
              scenarios.push(context.Scenario.only(dataTitle, opts, fn).inject({ current: dataRow.data }))
            }
          })
          maskSecretInTitle(scenarios)
          return new DataScenarioConfig(scenarios)
        },
      },
    }
  }

  context.xData = function (dataTable) {
    const data = detectDataType(dataTable)
    return {
      Scenario: title => {
        data.forEach(dataRow => {
          const dataTitle = replaceTitle(title, dataRow)
          context.xScenario(dataTitle)
        })
        return new DataScenarioConfig([])
      },
    }
  }
}

function replaceTitle(title, dataRow) {
  if (typeof dataRow.data !== 'object') {
    return `${title} | {${JSON.stringify(dataRow.data)}}`
  }

  // if `dataRow` is object and has own `toString()` method,
  // it should be printed
  if (Object.prototype.toString.call(dataRow.data) === Object().toString() && dataRow.data.toString() !== Object().toString()) {
    return `${title} | ${dataRow.data}`
  }

  return `${title} | ${JSON.stringify(dataRow.data)}`
}

function isTableDataRow(row) {
  const has = Object.prototype.hasOwnProperty
  return has.call(row, 'data') && has.call(row, 'skip')
}

function detectDataType(dataTable) {
  if (dataTable instanceof DataTable) {
    return dataTable.rows
  }

  if (isGenerator(dataTable)) {
    const data = []
    for (const dataRow of dataTable()) {
      data.push({
        data: dataRow,
      })
    }
    return data
  }
  if (typeof dataTable === 'function') {
    return dataTable()
  }
  if (Array.isArray(dataTable)) {
    return dataTable.map(item => {
      if (isTableDataRow(item)) {
        return item
      }
      return {
        data: item,
        skip: false,
      }
    })
  }

  throw new Error('Invalid data type. Data accepts either: DataTable || generator || Array || function')
}

function maskSecretInTitle(scenarios) {
  scenarios.forEach(scenario => {
    const res = []

    scenario.test.title.split(',').forEach(item => {
      res.push(item.replace(/{"_secret":"(.*)"}/, '"*****"'))
    })

    scenario.test.title = res.join(',')
  })
}
