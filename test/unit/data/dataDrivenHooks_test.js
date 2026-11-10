import { expect } from 'chai'
import DataTable from '../../../lib/data/table.js'
import addDataContext from '../../../lib/data/context.js'

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

describe('Data-driven Before/After hooks - hook methods', () => {
  it('should have Before and After methods on Data object', () => {
    const credentials = new DataTable(['username', 'password'])
    credentials.add(['alice', 'pass123'])

    const mockContext = {}
    addDataContext(mockContext)

    const data = mockContext.Data(credentials)
    expect(data).to.have.property('Before')
    expect(data).to.have.property('After')
    expect(data.Before).to.be.a('function')
    expect(data.After).to.be.a('function')
  })

  it('should register one Before hook per non-skipped data row', () => {
    const credentials = new DataTable(['username', 'password'])
    credentials.add(['alice', 'pass123'])
    credentials.add(['bob', 'pass456'])

    let hookCount = 0
    const mockContext = {
      Before: (fn) => {
        hookCount++
      },
    }

    addDataContext(mockContext)

    const data = mockContext.Data(credentials)
    data.Before(() => {})

    expect(hookCount).to.equal(2)
  })

  it('should skip rows marked as skipped when registering Before hooks', () => {
    const credentials = new DataTable(['username', 'password'])
    credentials.add(['alice', 'pass123'])

    credentials.rows[0].skip = true

    let hookCount = 0
    const mockContext = {
      Before: (fn) => {
        hookCount++
      },
    }

    addDataContext(mockContext)

    const data = mockContext.Data(credentials)
    data.Before(() => {})

    expect(hookCount).to.equal(0)
  })

  it('should pass current data to Before hook when test matches data row', async () => {
    const credentials = new DataTable(['username', 'password'])
    credentials.add(['alice', 'pass123'])

    const hookCalls = []
    const mockContext = {
      Before: (fn) => {
        hookCalls.push(fn)
      },
    }

    addDataContext(mockContext)

    const data = mockContext.Data(credentials)
    data.Before(({ current }) => {
      return current
    })

    const aliceData = credentials.rows[0].data
    const testWithMatchingData = {
      inject: {
        current: aliceData,
      },
    }

    const result = await hookCalls[0]({ test: testWithMatchingData })
    expect(result).to.have.property('username', 'alice')
    expect(result).to.have.property('password', 'pass123')
  })

  it('should not execute Before hook when test data does not match data row', async () => {
    const credentials = new DataTable(['username', 'password'])
    credentials.add(['alice', 'pass123'])

    const hookCalls = []
    const mockContext = {
      Before: (fn) => {
        hookCalls.push(fn)
      },
    }

    addDataContext(mockContext)

    const data = mockContext.Data(credentials)
    data.Before(({ current }) => {
      return current
    })

    const testWithDifferentData = {
      inject: {
        current: { username: 'bob', password: 'pass456' },
      },
    }

    const result = await hookCalls[0]({ test: testWithDifferentData })
    expect(result).to.be.undefined
  })

  it('should register one After hook per non-skipped data row', () => {
    const credentials = new DataTable(['username', 'password'])
    credentials.add(['alice', 'pass123'])
    credentials.add(['bob', 'pass456'])

    let hookCount = 0
    const mockContext = {
      After: (fn) => {
        hookCount++
      },
    }

    addDataContext(mockContext)

    const data = mockContext.Data(credentials)
    data.After(() => {})

    expect(hookCount).to.equal(2)
  })
})
