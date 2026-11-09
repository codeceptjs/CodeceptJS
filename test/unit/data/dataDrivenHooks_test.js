import { expect } from 'chai'
import DataTable from '../../../lib/data/table.js'

describe('Data-driven Before/After hooks - data structure', () => {
  it('should create DataTable with correct structure', () => {
    const accounts = new DataTable(['login', 'password'])
    accounts.add(['davert', '123456'])
    accounts.add(['admin', '654321'])

    expect(accounts.rows).to.have.lengthOf(2)
    expect(accounts.array).to.deep.equal(['login', 'password'])
  })

  it('should have rows property with data and skip', () => {
    const accounts = new DataTable(['login', 'password'])
    accounts.add(['davert', '123456'])

    accounts.rows.forEach(row => {
      expect(row).to.have.property('data')
      expect(row).to.have.property('skip')
      expect(row.data).to.include.keys(['login', 'password'])
    })
  })

  it('first row should have correct data', () => {
    const accounts = new DataTable(['login', 'password'])
    accounts.add(['davert', '123456'])
    accounts.add(['admin', '654321'])

    const firstRow = accounts.rows[0]
    expect(firstRow.data.login).to.equal('davert')
    expect(firstRow.data.password).to.equal('123456')
  })

  it('second row should have correct data', () => {
    const accounts = new DataTable(['login', 'password'])
    accounts.add(['davert', '123456'])
    accounts.add(['admin', '654321'])

    const secondRow = accounts.rows[1]
    expect(secondRow.data.login).to.equal('admin')
    expect(secondRow.data.password).to.equal('654321')
  })

  it('should support filtering skipped rows', () => {
    const accounts = new DataTable(['login', 'password'])
    accounts.add(['davert', '123456'])
    accounts.add(['admin', '654321'])

    const activeRows = accounts.rows.filter(row => !row.skip)
    expect(activeRows).to.have.lengthOf(2)
  })

  it('should extract current from row data', () => {
    const accounts = new DataTable(['login', 'password'])
    accounts.add(['davert', '123456'])

    const row = accounts.rows[0]
    const current = row.data

    expect(current.login).to.equal('davert')
    expect(current.password).to.equal('123456')
  })

  it('should support iterating all rows', () => {
    const accounts = new DataTable(['login', 'password'])
    accounts.add(['davert', '123456'])
    accounts.add(['admin', '654321'])

    const currentValues = accounts.rows.map(row => row.data)
    expect(currentValues).to.have.lengthOf(2)
    expect(currentValues[0].login).to.equal('davert')
    expect(currentValues[1].login).to.equal('admin')
  })

  it('should detect when row is skipped', () => {
    const accounts = new DataTable(['login', 'password'])
    accounts.add(['davert', '123456'])

    const firstRow = accounts.rows[0]
    expect(firstRow.skip).to.be.false
  })
})
