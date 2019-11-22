/**
 * Datatable class to provide data driven testing
 */
class DataTable {
  /** @param {Array<*>} array */
  constructor(array) {
    this.array = array;
    this.rows = new Array(0);
  }

  /** @param {Array<*>} array */
  add(array) {
    if (array.length !== this.array.length) throw new Error(`There is too many elements in given data array. Please provide data in this format: ${this.array}`);
    const tempObj = {};
    let arrayCounter = 0;
    this.array.forEach((elem) => {
      tempObj[elem] = array[arrayCounter];
      tempObj.toString = () => JSON.stringify(tempObj);
      arrayCounter++;
    });
    this.rows.push({ skip: false, data: tempObj });
  }

  /** @param {Array<*>} array */
  xadd(array) {
    if (array.length !== this.array.length) throw new Error(`There is too many elements in given data array. Please provide data in this format: ${this.array}`);
    const tempObj = {};
    let arrayCounter = 0;
    this.array.forEach((elem) => {
      tempObj[elem] = array[arrayCounter];
      tempObj.toString = () => JSON.stringify(tempObj);
      arrayCounter++;
    });
    this.rows.push({ skip: true, data: tempObj });
  }

  /** @param {Function} func */
  filter(func) {
    return this.rows.filter(row => func(row.data));
  }
}

module.exports = DataTable;
