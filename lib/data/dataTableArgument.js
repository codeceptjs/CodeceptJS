class DataTableArgument {
  constructor(gherkinDataTable) {
    this.rawData = gherkinDataTable.rows.map((row) => {
      return row.cells.map((cell) => {
        return cell.value;
      });
    });
  }

  raw() {
    return this.rawData.slice(0);
  }

  rows() {
    const copy = this.raw();
    copy.shift();
    return copy;
  }

  hashes() {
    const copy = this.raw();
    const header = copy.shift();
    return copy.map((row) => {
      const r = {};
      row.forEach((cell, index) => r[header[index]] = cell);
      return r;
    });
  }
}

module.exports = DataTableArgument;
