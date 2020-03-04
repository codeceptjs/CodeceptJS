const assert = require('assert');
const DataTableArgument = require('../../../lib/data/dataTableArgument');

describe('DataTableArgument', () => {
  const gherkinDataTable = {
    rows: [
      {
        type: 'TableRow',
        location: { line: 59, column: 13 },
        cells: [
          { type: 'TableCell', location: [Object], value: 'John' },
          { type: 'TableCell', location: [Object], value: 'Doe' },
        ],
      },
      {
        type: 'TableRow',
        location: { line: 59, column: 13 },
        cells: [
          { type: 'TableCell', location: [Object], value: 'Chuck' },
          { type: 'TableCell', location: [Object], value: 'Norris' },
        ],
      },
    ],
  };

  const gherkinDataTableWithHeader = {
    rows: [
      {
        type: 'TableRow',
        location: { line: 59, column: 13 },
        cells: [
          { type: 'TableCell', location: [Object], value: 'firstName' },
          { type: 'TableCell', location: [Object], value: 'lastName' },
        ],
      },
      {
        type: 'TableRow',
        location: { line: 59, column: 13 },
        cells: [
          { type: 'TableCell', location: [Object], value: 'Chuck' },
          { type: 'TableCell', location: [Object], value: 'Norris' },
        ],
      },
    ],
  };

  it('should return a 2D array containing each row', () => {
    const dta = new DataTableArgument(gherkinDataTable);
    const raw = dta.raw();
    const expectedRaw = [['John', 'Doe'], ['Chuck', 'Norris']];
    assert.deepEqual(raw, expectedRaw);
  });

  it('should return a 2D array containing each row without the header (first one)', () => {
    const dta = new DataTableArgument(gherkinDataTableWithHeader);
    const rows = dta.rows();
    const expectedRows = [['Chuck', 'Norris']];
    assert.deepEqual(rows, expectedRows);
  });

  it('should return an of object where properties is the header', () => {
    const dta = new DataTableArgument(gherkinDataTableWithHeader);
    const rows = dta.hashes();
    const expectedRows = [{ firstName: 'Chuck', lastName: 'Norris' }];
    assert.deepEqual(rows, expectedRows);
  });
});
