const isGenerator = require('../utils').isGenerator;
const DataTable = require('./table');

module.exports = function (context) {
  context.Data = function (dataTable) {
    const data = detectDataType(dataTable);
    return {
      Scenario(title, opts, fn) {
        const scenarios = [];
        if (typeof opts === 'function' && !fn) {
          fn = opts;
          opts = {};
        }
        data.forEach((dataRow) => {
          const dataTitle = replaceTitle(title, dataRow);
          if (dataRow.skip) {
            scenarios.push(context.xScenario(dataTitle));
          } else {
            opts.data = dataRow;
            scenarios.push(context.Scenario(dataTitle, opts, fn)
              .inject({ current: dataRow.data }));
          }
        });
        return dataScenarioConfig(scenarios);
      },
      only: {
        Scenario(title, opts, fn) {
          const scenarios = [];
          if (typeof opts === 'function' && !fn) {
            fn = opts;
            opts = {};
          }
          data.forEach((dataRow) => {
            const dataTitle = replaceTitle(title, dataRow);
            if (dataRow.skip) {
              scenarios.push(context.xScenario(dataTitle));
            } else {
              opts.data = dataRow;
              scenarios.push(context.Scenario.only(dataTitle, opts, fn)
                .inject({ current: dataRow.data }));
            }
          });
          return dataScenarioConfig(scenarios);
        },
      },
    };
  };

  context.xData = function (dataTable) {
    const data = detectDataType(dataTable);
    return { Scenario: context.xScenario };
  };
};

function replaceTitle(title, dataRow) {
  if (typeof dataRow.data !== 'object') {
    return `${title} | {${JSON.stringify(dataRow.data)}}`;
  }

  return `${title} | ${JSON.stringify(dataRow.data)}`;
}

function isTableDataRow(row) {
  const has = Object.prototype.hasOwnProperty;
  return has.call(row, 'data') && has.call(row, 'skip');
}

function detectDataType(dataTable) {
  if (dataTable instanceof DataTable) {
    return dataTable.rows;
  }

  if (isGenerator(dataTable)) {
    const data = [];
    for (const dataRow of dataTable()) {
      data.push({
        data: dataRow,
      });
    }
    return data;
  }
  if (typeof dataTable === 'function') {
    return dataTable();
  }
  if (Array.isArray(dataTable)) {
    return dataTable.map((item) => {
      if (isTableDataRow(item)) {
        return item;
      }
      return {
        data: item,
        skip: false,
      };
    });
  }

  throw new Error('Invalid data type. Data accepts either: DataTable || generator || Array || function');
}

function dataScenarioConfig(scenarios) {
  function applyFunctionToAllScenarios(scenarios, funct, ...args) {
    scenarios.forEach(scenario => scenario[funct](...args));
  }

  return {
    throws(err) {
      applyFunctionToAllScenarios(scenarios, 'throws', err);
      return this;
    },
    fails() {
      applyFunctionToAllScenarios(scenarios, 'fails');
      return this;
    },
    retry(retries) {
      applyFunctionToAllScenarios(scenarios, 'retry', retries);
      return this;
    },
    timeout() {
      applyFunctionToAllScenarios(scenarios, 'timeout');
      return this;
    },
    config(helper, obj) {
      applyFunctionToAllScenarios(scenarios, 'config', helper, obj);
      return this;
    },
    tag(tagName) {
      applyFunctionToAllScenarios(scenarios, 'tag', tagName);
      return this;
    },
  };
}
