'use strict';

/**
 * Datatable class to provide data driven testing
 */
class dataTable {

  constructor(array) {
    this.array = array;
    this.datatable = [];
  }

  add(array) {
    if (array.length !== this.array.length) throw new Error(`There is to much elements in given data array. Please provide data in this format ${this.array}`);
    let tempObj = {};
    let arrayCounter = 0;
    this.array.forEach(function (elem) {
      tempObj[elem] = array[arrayCounter];
      arrayCounter++;
    });
    this.datatable.push(tempObj);
  }

}

module.exports = dataTable;
