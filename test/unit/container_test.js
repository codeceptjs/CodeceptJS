'use strict';
let container = require('../../lib/container');
let should = require('chai').should();
let assert = require('assert');
let path = require('path');
let sinon = require('sinon');

describe('Container', () => {

  before(() => {
    global.codecept_dir = path.join(__dirname, '/..');
  });

  afterEach(() => {
    container.clear();
  });

  describe('#helpers', () => {
    beforeEach(() => {
      container.clear({
        helper1: { name: 'hello' },
        helper2: { name: 'world' }
      });
    });

    it('should return all helper with no args', () => container.helpers().should.have.keys('helper1', 'helper2'));

    it('should return helper by name', () => {
      container.helpers('helper1').should.be.ok;
      container.helpers('helper1').name.should.eql('hello');
      container.helpers('helper2').should.be.ok;
      container.helpers('helper2').name.should.eql('world');
      assert.ok(!container.helpers('helper3'));
    });

  });

  describe('#support', () => {

    beforeEach(() => {
      container.clear({}, {
        support1: { name: 'hello' },
        support2: { name: 'world' }
      });
    });

    it('should return all support objects', () => container.support().should.have.keys('support1', 'support2'));

    it('should support object by name', () => {
      container.support('support1').should.be.ok;
      container.support('support1').name.should.eql('hello');
      container.support('support2').should.be.ok;
      container.support('support2').name.should.eql('world');
      assert.ok(!container.support('support3'));
    });
  });

  describe('#create', () => {
    it('should create container with helpers', () => {
      let FileSystem = require('../../lib/helper/FileSystem');
      let config = {
        helpers: {
          MyHelper: {
            require: './data/helper'
          },
          FileSystem: {}
        }
      };
      container.create(config);
      // custom helpers
      assert.ok(container.helpers('MyHelper'));
      container.helpers('MyHelper').method().should.eql('hello world');

      // built-in helpers
      assert.ok(container.helpers('FileSystem'));
      container.helpers('FileSystem').should.be.instanceOf(FileSystem);
    });

    it('should always create I', () => {
      container.create({});
      assert.ok(container.support('I'));
    });

    it('should load I from path and excute _init', () => {
      container.create({
        include: {
          I: './data/I'
        }
      });
      assert.ok(container.support('I'));
      container.support('I').should.have.keys('_init', 'doSomething');
      assert(global.I_initialized);
    });



  });


});
