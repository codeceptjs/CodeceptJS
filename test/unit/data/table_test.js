const { expect } = require('chai');

const DataTable = require('../../../lib/data/table');

describe('DataTable', () => {
  it('should take an array for creation', () => {
    const data = ['login', 'password'];
    const dataTable = new DataTable(data);
    expect(dataTable.array).to.deep.equal(data);
    expect(dataTable.rows).to.deep.equal([]);
  });

  it('should allow arrays to be added', () => {
    const data = ['login', 'password'];
    const dataTable = new DataTable(data);
    dataTable.add(['jon', 'snow']);

    const expected = {
      login: 'jon',
      password: 'snow',
    };
    expect(JSON.stringify(dataTable.rows[0].data)).to.equal(JSON.stringify(expected));
  });

  it('should not allow an empty array to be added', () => {
    const data = ['login', 'password'];
    const dataTable = new DataTable(data);
    expect(() => dataTable.add([])).to.throw();
  });

  it('should not allow an array with more slots than the original to be added', () => {
    const data = ['login', 'password'];
    const dataTable = new DataTable(data);
    expect(() => dataTable.add(['Henrietta'])).to.throw();
  });

  it('should not allow an array with less slots than the original to be added', () => {
    const data = ['login', 'password'];
    const dataTable = new DataTable(data);
    expect(() => dataTable.add(['Acid', 'Jazz', 'Singer'])).to.throw();
  });

  it('should filter an array', () => {
    const data = ['login', 'password'];
    const dataTable = new DataTable(data);
    dataTable.add(['jon', 'snow']);
    dataTable.add(['tyrion', 'lannister']);
    dataTable.add(['jaime', 'lannister']);

    const expected = [{
      skip: false,
      data: {
        login: 'tyrion',
        password: 'lannister',
      },
    }, {
      skip: false,
      data: {
        login: 'jaime',
        password: 'lannister',
      },
    }];
    expect(JSON.stringify(dataTable.filter(row => row.password === 'lannister'))).to.equal(JSON.stringify(expected));
  });

  it('should filter an array with skips', () => {
    const data = ['login', 'password'];
    const dataTable = new DataTable(data);
    dataTable.add(['jon', 'snow']);
    dataTable.xadd(['tyrion', 'lannister']);
    dataTable.add(['jaime', 'lannister']);

    const expected = [{
      skip: true,
      data: {
        login: 'tyrion',
        password: 'lannister',
      },
    }, {
      skip: false,
      data: {
        login: 'jaime',
        password: 'lannister',
      },
    }];
    expect(JSON.stringify(dataTable.filter(row => row.password === 'lannister'))).to.equal(JSON.stringify(expected));
  });
});
