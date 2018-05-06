const isGenerator = require('../utils').isGenerator;
const DataTable = require('./table');

module.exports = function (context) {
  context.Data = function (dataTable) {
    const data = detectDataType(dataTable);
    return {
      Scenario(title, opts, fn) {
        if (typeof opts === 'function' && !fn) {
          fn = opts;
          opts = {};
        }
        data.forEach((dataRow) => {
          if (dataRow.skip) {
            context.xScenario(`${title} | ${dataRow.data}`);
          } else {
            opts.data = dataRow;
            context.Scenario(`${title} | ${dataRow.data}`, opts, fn)
              .inject({ current: dataRow.data });
          }
        });
      },
      only: {
        Scenario(title, opts, fn) {
          if (typeof opts === 'function' && !fn) {
            fn = opts;
            opts = {};
          }
          data.forEach((dataRow) => {
            if (dataRow.skip) {
              context.xScenario(`${title} | ${dataRow.data}`);
            } else {
              opts.data = dataRow;
              context.Scenario.only(`${title} | ${dataRow.data}`, opts, fn)
                .inject({ current: dataRow.data });
            }
          });
        },
      },
    };
  };

  context.xData = function (dataTable) {
    const data = detectDataType(dataTable);
    return { Scenario: context.xScenario };
  };
};

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
