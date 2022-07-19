const { expect } = require('chai');
const { it } = require('mocha');
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

  const gherkinDataTableWithColumnHeader = {
    rows: [
      {
        type: 'TableRow',
        location: { line: 59, column: 13 },
        cells: [
          { type: 'TableCell', location: [Object], value: 'firstName' },
          { type: 'TableCell', location: [Object], value: 'Chuck' },
        ],
      },
      {
        type: 'TableRow',
        location: { line: 59, column: 13 },
        cells: [
          { type: 'TableCell', location: [Object], value: 'lastName' },
          { type: 'TableCell', location: [Object], value: 'Norris' },
        ],
      },
    ],
  };

  it('should return a 2D array containing each row', () => {
    const dta = new DataTableArgument(gherkinDataTable);
    const raw = dta.raw();
    const expectedRaw = [['John', 'Doe'], ['Chuck', 'Norris']];
    expect(raw).to.deep.equal(expectedRaw);
  });

  it('should return a 2D array containing each row without the header (first one)', () => {
    const dta = new DataTableArgument(gherkinDataTableWithHeader);
    const rows = dta.rows();
    const expectedRows = [['Chuck', 'Norris']];
    expect(rows).to.deep.equal(expectedRows);
  });

  it('should return an of object where properties is the header', () => {
    const dta = new DataTableArgument(gherkinDataTableWithHeader);
    const rows = dta.hashes();
    const expectedRows = [{ firstName: 'Chuck', lastName: 'Norris' }];
    expect(rows).to.deep.equal(expectedRows);
  });

  it('transpose should transpose the gherkin data table', () => {
    const dta = new DataTableArgument(gherkinDataTable);
    dta.transpose();
    const raw = dta.raw();
    const expectedRaw = [['John', 'Chuck'], ['Doe', 'Norris']];
    expect(raw).to.deep.equal(expectedRaw);
  });

  it('rowsHash returns an object where the keys are the first column', () => {
    const dta = new DataTableArgument(gherkinDataTableWithColumnHeader);
    const rawHash = dta.rowsHash();
    const expectedRaw = { firstName: 'Chuck', lastName: 'Norris' };
    expect(rawHash).to.deep.equal(expectedRaw);
  });
});
