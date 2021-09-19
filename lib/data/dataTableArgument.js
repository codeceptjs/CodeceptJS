/**
 * DataTableArgument class to store the Cucumber data table from
 * a step as an object with methods that can be used to access the data.
 */
class DataTableArgument {
  /** @param {*} gherkinDataTable */
  constructor(gherkinDataTable) {
    this.rawData = gherkinDataTable.rows.map((row) => {
      return row.cells.map((cell) => {
        return cell.value;
      });
    });
  }

  /** Returns the table as a 2-D array
  * @returns {string[][]}
  */
  raw() {
    return this.rawData.slice(0);
  }

  /** Returns the table as a 2-D array, without the first row
  * @returns {string[][]}
  */
  rows() {
    const copy = this.raw();
    copy.shift();
    return copy;
  }

  /** Returns an array of objects where each row is converted to an object (column header is the key)
  * @returns {any[]}
  */
  hashes() {
    const copy = this.raw();
    const header = copy.shift();
    return copy.map((row) => {
      const r = {};
      row.forEach((cell, index) => r[header[index]] = cell);
      return r;
    });
  }

  /** Returns an object where each row corresponds to an entry
   * (first column is the key, second column is the value)
  * @returns {Record<string, string>}
  */
  rowsHash() {
    const rows = this.raw();
    const everyRowHasTwoColumns = rows.every((row) => row.length === 2);
    if (!everyRowHasTwoColumns) {
      throw new Error('rowsHash can only be called on a data table where all rows have exactly two columns');
    }
    /** @type {Record<string, string>} */
    const result = {};
    rows.forEach((x) => (result[x[0]] = x[1]));
    return result;
  }

  /** Transposed the data */
  transpose() {
    this.rawData = this.rawData[0].map((x, i) => this.rawData.map((y) => y[i]));
  }
}

module.exports = DataTableArgument;
