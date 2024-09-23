import { expect } from 'chai';
import path from 'path';

import SoftAssertHelper from '../../lib/helper/SoftExpectHelper.js'

global.codeceptjs = '../../lib'
const __dirname = path.resolve('.');

let I

const goodApple = {
  skin: 'thin',
  colors: ['red', 'green', 'yellow'],
  taste: 10,
}
const badApple = {
  colors: ['brown'],
  taste: 0,
  worms: 2,
}
const fruitSchema = {
  title: 'fresh fruit schema v1',
  type: 'object',
  required: ['skin', 'colors', 'taste'],
  properties: {
    colors: {
      type: 'array',
      minItems: 1,
      uniqueItems: true,
      items: {
        type: 'string',
      },
    },
    skin: {
      type: 'string',
    },
    taste: {
      type: 'number',
      minimum: 5,
    },
  },
}

describe('Soft Expect Helper', function () {
  this.timeout(3000)
  this.retries(1)

  before(() => {
    global.codecept_dir = path.join(__dirname, '/../data')

    I = new SoftAssertHelper()
  })

  describe('#softExpectEqual', () => {
    it('should not show error', () => {
      I.softExpectEqual('a', 'a')
      I.flushSoftAssertions()
    })

    it('should show error', () => {
      try {
        I.softExpectEqual('a', 'b')
        I.flushSoftAssertions()
      } catch (e) {
        expect(e.message).to.contain("expected 'a' to equal 'b'")
      }
    })
  })

  describe('#softExpectNotEqual', () => {
    it('should not show error', () => {
      I.softExpectNotEqual('a', 'b')
      I.flushSoftAssertions()
    })

    it('should show error', () => {
      try {
        I.softExpectNotEqual('a', 'a')
        I.flushSoftAssertions()
      } catch (e) {
        expect(e.message).to.contain("expected 'a' to not equal 'a'")
      }
    })
  })

  describe('#softExpectContain', () => {
    it('should not show error', () => {
      I.softExpectContain('abc', 'a')
      I.flushSoftAssertions()
    })

    it('should show error', () => {
      try {
        I.softExpectContain('abc', 'd')
        I.flushSoftAssertions()
      } catch (e) {
        expect(e.message).to.contain("expected 'abc' to include 'd'")
      }
    })
  })

  describe('#softExpectNotContain', () => {
    it('should not show error', () => {
      I.softExpectNotContain('abc', 'd')
      I.flushSoftAssertions()
    })

    it('should show error', () => {
      try {
        I.softExpectNotContain('abc', 'a')
        I.flushSoftAssertions()
      } catch (e) {
        expect(e.message).to.contain("expected 'abc' to not include 'a'")
      }
    })
  })

  describe('#softExpectStartsWith', () => {
    it('should not show error', () => {
      I.softExpectStartsWith('abc', 'a')
      I.flushSoftAssertions()
    })

    it('should show error', () => {
      try {
        I.softExpectStartsWith('abc', 'b')
        I.flushSoftAssertions()
      } catch (e) {
        expect(e.message).to.contain('expected false to be true')
      }
    })
  })

  describe('#softExpectNotStartsWith', () => {
    it('should not show error', () => {
      I.softExpectNotStartsWith('abc', 'b')
      I.flushSoftAssertions()
    })

    it('should show error', () => {
      try {
        I.softExpectNotStartsWith('abc', 'a')
        I.flushSoftAssertions()
      } catch (e) {
        expect(e.message).to.contain('expected true to be false')
      }
    })
  })

  describe.skip('#softExpectEndsWith', () => {
    it('should not show error', () => {
      I.softExpectEndsWith('abc', 'c')
      I.flushSoftAssertions()
    })

    it('should show error', () => {
      try {
        I.softExpectEndsWith('abc', 'd')
        I.flushSoftAssertions()
      } catch (e) {
        expect(e.message).to.contain('expected abc to end with d')
      }
    })
  })

  describe.skip('#softExpectNotEndsWith', () => {
    it('should not show error', () => {
      I.softExpectNotEndsWith('abc', 'd')
      I.flushSoftAssertions()
    })

    it('should show error', () => {
      try {
        I.softExpectNotEndsWith('abc', 'd')
        I.flushSoftAssertions()
      } catch (e) {
        expect(e.message).to.contain('expected abc not to end with c')
      }
    })
  })

  describe.skip('#softExpectJsonSchema', () => {
    it('should not show error', () => {
      I.softExpectJsonSchema(goodApple, fruitSchema)
      I.flushSoftAssertions()
    })

    it('should show error', () => {
      try {
        I.softExpectJsonSchema(badApple, fruitSchema)
        I.flushSoftAssertions()
      } catch (e) {
        expect(e.message).to.contain('expected value to match json-schema')
      }
    })
  })

  describe('#softExpectHasProperty', () => {
    it('should not show error', () => {
      I.softExpectHasProperty(goodApple, 'skin')
      I.flushSoftAssertions()
    })

    it('should show error', () => {
      try {
        I.softExpectHasProperty(badApple, 'skin')
        I.flushSoftAssertions()
      } catch (e) {
        expect(e.message).to.contain('expected { Object (colors, taste')
      }
    })
  })

  describe('#softExpectHasAProperty', () => {
    it('should not show error', () => {
      I.softExpectHasAProperty(goodApple, 'skin')
      I.flushSoftAssertions()
    })

    it('should show error', () => {
      try {
        I.softExpectHasAProperty(badApple, 'skin')
        I.flushSoftAssertions()
      } catch (e) {
        expect(e.message).to.contain('expected { Object (colors, taste')
      }
    })
  })

  describe('#softExpectToBeA', () => {
    it('should not show error', () => {
      I.softExpectToBeA(goodApple, 'object')
      I.flushSoftAssertions()
    })
  })

  describe('#softExpectToBeAn', () => {
    it('should not show error', () => {
      I.softExpectToBeAn(goodApple, 'object')
      I.flushSoftAssertions()
    })

    it('should show error', () => {
      try {
        I.softExpectToBeAn(badApple, 'skin')
        I.flushSoftAssertions()
      } catch (e) {
        expect(e.message).to.contain('expected { Object (colors, taste')
      }
    })
  })

  describe('#softExpectMatchRegex', () => {
    it('should not show error', () => {
      I.softExpectMatchRegex('goodApple', /good/)
      I.flushSoftAssertions()
    })

    it('should show error', () => {
      try {
        I.softExpectMatchRegex('Apple', /good/)
        I.flushSoftAssertions()
      } catch (e) {
        expect(e.message).to.contain('to match /good/')
      }
    })
  })

  describe('#softExpectLengthOf', () => {
    it('should not show error', () => {
      I.softExpectLengthOf('good', 4)
      I.flushSoftAssertions()
    })

    it('should show error', () => {
      try {
        I.softExpectLengthOf('Apple', 4)
        I.flushSoftAssertions()
      } catch (e) {
        expect(e.message).to.contain('to have a length')
      }
    })
  })

  describe('#softExpectTrue', () => {
    it('should not show error', () => {
      I.softExpectTrue(true)
      I.flushSoftAssertions()
    })

    it('should show error', () => {
      try {
        I.softExpectTrue(false)
        I.flushSoftAssertions()
      } catch (e) {
        expect(e.message).to.contain('expected false to be true')
      }
    })
  })

  describe('#softExpectEmpty', () => {
    it('should not show error', () => {
      I.softExpectEmpty('')
      I.flushSoftAssertions()
    })

    it('should show error', () => {
      try {
        I.softExpectEmpty('false')
        I.flushSoftAssertions()
      } catch (e) {
        expect(e.message).to.contain("expected 'false' to be empty")
      }
    })
  })

  describe('#softExpectFalse', () => {
    it('should not show error', () => {
      I.softExpectFalse(false)
      I.flushSoftAssertions()
    })

    it('should show error', () => {
      try {
        I.softExpectFalse(true)
        I.flushSoftAssertions()
      } catch (e) {
        expect(e.message).to.contain('expected true to be false')
      }
    })
  })

  describe('#softExpectAbove', () => {
    it('should not show error', () => {
      I.softExpectAbove(2, 1)
      I.flushSoftAssertions()
    })

    it('should show error', () => {
      try {
        I.softExpectAbove(1, 2)
        I.flushSoftAssertions()
      } catch (e) {
        expect(e.message).to.contain('expected 1 to be above 2')
      }
    })
  })

  describe('#softExpectBelow', () => {
    it('should not show error', () => {
      I.softExpectBelow(1, 2)
      I.flushSoftAssertions()
    })

    it('should show error', () => {
      try {
        I.softExpectBelow(2, 1)
        I.flushSoftAssertions()
      } catch (e) {
        expect(e.message).to.contain('expected 2 to be below 1')
      }
    })
  })

  describe('#softExpectLengthAboveThan', () => {
    it('should not show error', () => {
      I.softExpectLengthAboveThan('hello', 4)
      I.flushSoftAssertions()
    })

    it('should show error', () => {
      try {
        I.softExpectLengthAboveThan('hello', 5)
        I.flushSoftAssertions()
      } catch (e) {
        expect(e.message).to.contain('to have a length above 5')
      }
    })
  })

  describe.skip('#softExpectLengthBelowThan', () => {
    it('should not show error', () => {
      I.softExpectLengthBelowThan('hello', 6)
      I.flushSoftAssertions()
    })

    it('should show error', () => {
      try {
        I.softExpectLengthBelowThan('hello', 4)
        I.flushSoftAssertions()
      } catch (e) {
        expect(e.message).to.contain('to have a length below 4')
      }
    })
  })

  describe.skip('#softExpectLengthBelowThan', () => {
    it('should not show error', () => {
      I.softExpectEqualIgnoreCase('hEllo', 'hello')
      I.flushSoftAssertions()
    })

    it('should show error', () => {
      try {
        I.softExpectEqualIgnoreCase('hEllo', 'hell0')
        I.flushSoftAssertions()
      } catch (e) {
        expect(e.message).to.contain('expected hEllo to equal hell0')
      }
    })
  })

  describe('#softExpectDeepMembers', () => {
    it('should not show error', () => {
      I.softExpectDeepMembers([1, 2, 3], [1, 2, 3])
      I.flushSoftAssertions()
    })

    it('should show error', () => {
      try {
        I.softExpectDeepMembers([1, 2, 3], [3])
        I.flushSoftAssertions()
      } catch (e) {
        expect(e.message).to.contain('expected [ 1, 2, 3 ] to have the same members')
      }
    })
  })

  describe('#softExpectDeepIncludeMembers', () => {
    it('should not show error', () => {
      I.softExpectDeepIncludeMembers([3, 4, 5, 6], [3, 4, 5])
      I.flushSoftAssertions()
    })

    it('should show error', () => {
      try {
        I.softExpectDeepIncludeMembers([3, 4, 5], [3, 4, 5, 6])
        I.flushSoftAssertions()
      } catch (e) {
        expect(e.message).to.contain('expected [ 3, 4, 5 ] to be a superset of [ 3, 4, 5, 6 ]')
      }
    })
  })

  describe.skip('#softExpectDeepEqualExcluding', () => {
    it('should not show error', () => {
      I.softExpectDeepEqualExcluding({ a: 1, b: 2 }, { b: 2, a: 1, c: 3 }, 'c')
      I.flushSoftAssertions()
    })

    it('should show error', () => {
      try {
        I.softExpectDeepEqualExcluding({ a: 1, b: 2 }, { b: 2, a: 1, c: 3 }, 'a')
        I.flushSoftAssertions()
      } catch (e) {
        expect(e.message).to.contain('expected { b: 2 } to deeply equal')
      }
    })
  })

  describe.skip('#softExpectLengthBelowThan', () => {
    it('should not show error', () => {
      I.softExpectMatchesPattern('123', /123/)
      I.flushSoftAssertions()
    })

    it('should show error', () => {
      try {
        I.softExpectMatchesPattern('123', /1235/)
        I.flushSoftAssertions()
      } catch (e) {
        expect(e.message).to.contain("didn't match target /1235/")
      }
    })
  })
})
