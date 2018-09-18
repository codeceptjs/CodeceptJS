const container = require('../../lib/container');
const assert = require('assert');
const path = require('path');
const FileSystem = require('../../lib/helper/FileSystem');

describe('Container', () => {
  before(() => {
    global.codecept_dir = path.join(__dirname, '/..');
  });

  afterEach(() => {
    container.clear();
  });


  describe('#translation', () => {
    const Translation = require('../../lib/translation');

    it('should create empty translation', () => {
      container.create({});
      container.translation().should.be.instanceOf(Translation);
      container.translation().loaded.should.be.false;
      container.translation().actionAliasFor('see').should.eql('see');
    });

    it('should create russian translation', () => {
      container.create({ translation: 'ru-RU' });
      container.translation().should.be.instanceOf(Translation);
      container.translation().loaded.should.be.true;
      container.translation().I.should.eql('Я');
      container.translation().actionAliasFor('see').should.eql('вижу');
    });
  });

  describe('#helpers', () => {
    beforeEach(() => {
      container.clear({
        helper1: { name: 'hello' },
        helper2: { name: 'world' },
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
        support2: { name: 'world' },
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

  describe('#plugins', () => {
    beforeEach(() => {
      container.clear({}, {}, {
        plugin1: { name: 'hello' },
        plugin2: { name: 'world' },
      });
    });

    it('should return all plugins', () => container.plugins().should.have.keys('plugin1', 'plugin2'));

    it('should get plugin by name', () => {
      container.plugins('plugin1').should.be.ok;
      container.plugins('plugin1').name.should.eql('hello');
      container.plugins('plugin2').should.be.ok;
      container.plugins('plugin2').name.should.eql('world');
      assert.ok(!container.plugins('plugin3'));
    });
  });

  describe('#create', () => {
    it('should create container with helpers', () => {
      const config = {
        helpers: {
          MyHelper: {
            require: './data/helper',
          },
          FileSystem: {},
        },
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

    it('should load I from path and execute _init', () => {
      container.create({
        include: {
          I: './data/I',
        },
      });
      assert.ok(container.support('I'));
      container.support('I').should.have.keys('_init', 'doSomething');
      assert(global.I_initialized);
    });

    it('should load DI includes provided as require paths', () => {
      container.create({
        include: {
          dummyPage: './data/dummy_page',
        },
      });
      assert.ok(container.support('dummyPage'));
      container.support('dummyPage').should.have.keys('openDummyPage');
    });

    it('should load DI includes provided as objects', () => {
      container.create({
        include: {
          dummyPage: {
            openDummyPage: () => 'dummy page opened',
          },
        },
      });
      assert.ok(container.support('dummyPage'));
      container.support('dummyPage').should.have.keys('openDummyPage');
    });
  });

  describe('#append', () => {
    it('should be able to add new helper', () => {
      const config = {
        helpers: {
          FileSystem: {},
        },
      };
      container.create(config);
      container.append({
        helpers: {
          AnotherHelper: { method: () => 'executed' },
        },
      });
      assert.ok(container.helpers('FileSystem'));
      container.helpers('FileSystem').should.be.instanceOf(FileSystem);

      assert.ok(container.helpers('AnotherHelper'));
      container.helpers('AnotherHelper').method().should.eql('executed');
    });

    it('should be able to add new support object', () => {
      container.create({});
      container.append({ support: { userPage: { login: '#login' } } });
      assert.ok(container.support('I'));
      assert.ok(container.support('userPage'));
      container.support('userPage').login.should.eql('#login');
    });
  });
});
