const isGenerator = require('../utils').isGenerator;
const DataTable = require('./table');

module.exports = function (context) {

  context.Data = function (dataTable) {
    let data = detectDataType(dataTable);

    return {
      Scenario: function (title, opts, fn) {
        if (typeof opts === 'function' && !fn) {
          fn = opts;
          opts = {};
        }
        data.forEach((dataRow) => {
          if (dataRow.skip)
            context.xScenario(`${title} | ${dataRow.data}`)
          else {
            opts.data = dataRow;
            let test = context.Scenario(`${title} | ${dataRow.data}`, opts, fn);
            test.inject.current = dataRow.data;
          }
        });
      }
    };
  };

  context.xData = function (dataTable) {
    let data = detectDataType(dataTable);
    return { Scenario: context.xScenario };
  };
};

function detectDataType(dataTable) {
  if (dataTable instanceof DataTable) {
    return dataTable.rows;
  }

  if (isGenerator(dataTable)) {
    let data = [];
    for (let dataRow of dataTable()) {
      data.push(dataRow);
    }
    return data;
  }
  if (typeof dataTable === 'function') {
    return dataTable();
  }
  if (Array.isArray(dataTable)) {
    return dataTable;
  }

  throw new Error('Invalid data type. Data accepts either: DataTable || generator || Array || function');
}
