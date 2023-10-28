const path = require('path');
const { expect } = require('chai');
const ExpectHelper = require('../../lib/helper/Expect');

global.codeceptjs = require('../../lib');

let I;

const goodApple = {
  skin: 'thin',
  colors: ['red', 'green', 'yellow'],
  taste: 10,
};
const badApple = {
  colors: ['brown'],
  taste: 0,
  worms: 2,
};
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
};

describe('Expect Helper', function () {
  this.timeout(3000);
  this.retries(1);

  before(() => {
    global.codecept_dir = path.join(__dirname, '/../data');

    I = new ExpectHelper();
  });

  describe('#expectEqual', () => {
    it('should not show error', () => {
      I.expectEqual('a', 'a');
    });

    it('should show error', () => {
      try {
        I.expectEqual('a', 'b');
      } catch (e) {
        expect(e.message).to.eq('expected \'a\' to equal \'b\'');
      }
    });
  });

  describe('#expectNotEqual', () => {
    it('should not show error', () => {
      I.expectNotEqual('a', 'b');
    });

    it('should show error', () => {
      try {
        I.expectNotEqual('a', 'a');
      } catch (e) {
        expect(e.message).to.eq('expected \'a\' to not equal \'a\'');
      }
    });
  });

  describe('#expectContain', () => {
    it('should not show error', () => {
      I.expectContain('abc', 'a');
    });

    it('should show error', () => {
      try {
        I.expectContain('abc', 'd');
      } catch (e) {
        expect(e.message).to.eq('expected \'abc\' to include \'d\'');
      }
    });
  });

  describe('#expectNotContain', () => {
    it('should not show error', () => {
      I.expectNotContain('abc', 'd');
    });

    it('should show error', () => {
      try {
        I.expectNotContain('abc', 'a');
      } catch (e) {
        expect(e.message).to.eq('expected \'abc\' to not include \'a\'');
      }
    });
  });

  describe('#expectStartsWith', () => {
    it('should not show error', () => {
      I.expectStartsWith('abc', 'a');
    });

    it('should show error', () => {
      try {
        I.expectStartsWith('abc', 'b');
      } catch (e) {
        expect(e.message).to.eq('expected abc to start with b');
      }
    });
  });

  describe('#expectNotStartsWith', () => {
    it('should not show error', () => {
      I.expectNotStartsWith('abc', 'b');
    });

    it('should show error', () => {
      try {
        I.expectNotStartsWith('abc', 'a');
      } catch (e) {
        expect(e.message).to.eq('expected abc not to start with a');
      }
    });
  });

  describe('#expectEndsWith', () => {
    it('should not show error', () => {
      I.expectEndsWith('abc', 'c');
    });

    it('should show error', () => {
      try {
        I.expectEndsWith('abc', 'd');
      } catch (e) {
        expect(e.message).to.eq('expected abc to end with d');
      }
    });
  });

  describe('#expectNotEndsWith', () => {
    it('should not show error', () => {
      I.expectNotEndsWith('abc', 'd');
    });

    it('should show error', () => {
      try {
        I.expectNotEndsWith('abc', 'd');
      } catch (e) {
        expect(e.message).to.eq('expected abc not to end with c');
      }
    });
  });

  describe('#expectJsonSchema', () => {
    it('should not show error', () => {
      I.expectJsonSchema(goodApple, fruitSchema);
    });

    it('should show error', () => {
      try {
        I.expectJsonSchema(badApple, fruitSchema);
      } catch (e) {
        expect(e.message).to.contain('expected value to match json-schema');
      }
    });
  });

  describe('#expectHasProperty', () => {
    it('should not show error', () => {
      I.expectHasProperty(goodApple, 'skin');
    });

    it('should show error', () => {
      try {
        I.expectHasProperty(badApple, 'skin');
      } catch (e) {
        expect(e.message).to.contain('expected { Object (colors, taste');
      }
    });
  });

  describe('#expectHasAProperty', () => {
    it('should not show error', () => {
      I.expectHasAProperty(goodApple, 'skin');
    });

    it('should show error', () => {
      try {
        I.expectHasAProperty(badApple, 'skin');
      } catch (e) {
        expect(e.message).to.contain('expected { Object (colors, taste');
      }
    });
  });

  describe('#expectToBeA', () => {
    it('should not show error', () => {
      I.expectToBeA(goodApple, 'object');
    });
  });

  describe('#expectToBeAn', () => {
    it('should not show error', () => {
      I.expectToBeAn(goodApple, 'object');
    });

    it('should show error', () => {
      try {
        I.expectToBeAn(badApple, 'skin');
      } catch (e) {
        expect(e.message).to.contain('expected { Object (colors, taste');
      }
    });
  });

  describe('#expectMatchRegex', () => {
    it('should not show error', () => {
      I.expectMatchRegex('goodApple', /good/);
    });

    it('should show error', () => {
      try {
        I.expectMatchRegex('Apple', /good/);
      } catch (e) {
        expect(e.message).to.contain('to match /good/');
      }
    });
  });

  describe('#expectLengthOf', () => {
    it('should not show error', () => {
      I.expectLengthOf('good', 4);
    });

    it('should show error', () => {
      try {
        I.expectLengthOf('Apple', 4);
      } catch (e) {
        expect(e.message).to.contain('to have a length');
      }
    });
  });

  describe('#expectTrue', () => {
    it('should not show error', () => {
      I.expectTrue(true);
    });

    it('should show error', () => {
      try {
        I.expectTrue(false);
      } catch (e) {
        expect(e.message).to.contain('expected false to be true');
      }
    });
  });

  describe('#expectEmpty', () => {
    it('should not show error', () => {
      I.expectEmpty('');
    });

    it('should show error', () => {
      try {
        I.expectEmpty('false');
      } catch (e) {
        expect(e.message).to.contain('expected \'false\' to be empty');
      }
    });
  });

  describe('#expectFalse', () => {
    it('should not show error', () => {
      I.expectFalse(false);
    });

    it('should show error', () => {
      try {
        I.expectFalse(true);
      } catch (e) {
        expect(e.message).to.contain('expected true to be false');
      }
    });
  });

  describe('#expectAbove', () => {
    it('should not show error', () => {
      I.expectAbove(2, 1);
    });

    it('should show error', () => {
      try {
        I.expectAbove(1, 2);
      } catch (e) {
        expect(e.message).to.contain('expected 1 to be above 2');
      }
    });
  });

  describe('#expectBelow', () => {
    it('should not show error', () => {
      I.expectBelow(1, 2);
    });

    it('should show error', () => {
      try {
        I.expectBelow(2, 1);
      } catch (e) {
        expect(e.message).to.contain('expected 2 to be below 1');
      }
    });
  });

  describe('#expectLengthAboveThan', () => {
    it('should not show error', () => {
      I.expectLengthAboveThan('hello', 4);
    });

    it('should show error', () => {
      try {
        I.expectLengthAboveThan('hello', 5);
      } catch (e) {
        expect(e.message).to.contain('to have a length above 5');
      }
    });
  });

  describe('#expectLengthBelowThan', () => {
    it('should not show error', () => {
      I.expectLengthBelowThan('hello', 6);
    });

    it('should show error', () => {
      try {
        I.expectLengthBelowThan('hello', 4);
      } catch (e) {
        expect(e.message).to.contain('to have a length below 4');
      }
    });
  });

  describe('#expectLengthBelowThan', () => {
    it('should not show error', () => {
      I.expectEqualIgnoreCase('hEllo', 'hello');
    });

    it('should show error', () => {
      try {
        I.expectEqualIgnoreCase('hEllo', 'hell0');
      } catch (e) {
        expect(e.message).to.contain('expected hEllo to equal hell0');
      }
    });
  });

  describe('#expectDeepMembers', () => {
    it('should not show error', () => {
      I.expectDeepMembers([1, 2, 3], [1, 2, 3]);
    });

    it('should show error', () => {
      try {
        I.expectDeepMembers([1, 2, 3], [3]);
      } catch (e) {
        expect(e.message).to.contain('expected [ 1, 2, 3 ] to have the same members');
      }
    });
  });

  describe('#expectDeepIncludeMembers', () => {
    it('should not show error', () => {
      I.expectDeepIncludeMembers([3, 4, 5, 6], [3, 4, 5]);
    });

    it('should show error', () => {
      try {
        I.expectDeepIncludeMembers([3, 4, 5], [3, 4, 5, 6]);
      } catch (e) {
        expect(e.message).to.contain('expected [ 3, 4, 5 ] to be a superset of [ 3, 4, 5, 6 ]');
      }
    });
  });

  describe('#expectDeepEqualExcluding', () => {
    it('should not show error', () => {
      I.expectDeepEqualExcluding({ a: 1, b: 2 }, { b: 2, a: 1, c: 3 }, 'c');
    });

    it('should show error', () => {
      try {
        I.expectDeepEqualExcluding({ a: 1, b: 2 }, { b: 2, a: 1, c: 3 }, 'a');
      } catch (e) {
        expect(e.message).to.contain('expected { b: 2 } to deeply equal');
      }
    });
  });

  describe('#expectLengthBelowThan', () => {
    it('should not show error', () => {
      I.expectMatchesPattern('123', /123/);
    });

    it('should show error', () => {
      try {
        I.expectMatchesPattern('123', /1235/);
      } catch (e) {
        expect(e.message).to.contain('didn\'t match target /1235/');
      }
    });
  });
});
