const { expect } = require('chai');
const path = require('path');

const FileSystem = require('../../lib/helper/FileSystem');
const actor = require('../../lib/actor');
const container = require('../../lib/container');

describe('Container', () => {
  before(() => {
    global.codecept_dir = path.join(__dirname, '/..');
    global.inject = container.support;
    global.actor = actor;
  });

  afterEach(() => {
    container.clear();
    ['I', 'dummy_page'].forEach((po) => {
      const name = require.resolve(path.join(__dirname, `../data/${po}`));
      delete require.cache[name];
    });
  });

  describe('#translation', () => {
    const Translation = require('../../lib/translation');

    it('should create empty translation', () => {
      container.create({});
      expect(container.translation()).to.be.instanceOf(Translation);
      expect(container.translation().loaded).to.be.false;
      expect(container.translation().actionAliasFor('see')).to.eql('see');
    });

    it('should create Russian translation', () => {
      container.create({ translation: 'ru-RU' });
      expect(container.translation()).to.be.instanceOf(Translation);
      expect(container.translation().loaded).to.be.true;
      expect(container.translation().I).to.eql('Я');
      expect(container.translation().actionAliasFor('see')).to.eql('вижу');
    });

    it('should create Italian translation', () => {
      container.create({ translation: 'it-IT' });
      expect(container.translation()).to.be.instanceOf(Translation);
      expect(container.translation().loaded).to.be.true;
      expect(container.translation().I).to.eql('io');
      expect(container.translation().value('contexts').Feature).to.eql('Caratteristica');
    });

    it('should create French translation', () => {
      container.create({ translation: 'fr-FR' });
      expect(container.translation()).to.be.instanceOf(Translation);
      expect(container.translation().loaded).to.be.true;
      expect(container.translation().I).to.eql('Je');
      expect(container.translation().value('contexts').Feature).to.eql('Fonctionnalité');
    });

    it('should create Portuguese translation', () => {
      container.create({ translation: 'pt-BR' });
      expect(container.translation()).to.be.instanceOf(Translation);
      expect(container.translation().loaded).to.be.true;
      expect(container.translation().I).to.eql('Eu');
      expect(container.translation().value('contexts').Feature).to.eql('Funcionalidade');
    });

    it('should load custom translation', () => {
      container.create({ translation: 'my' });
      expect(container.translation()).to.be.instanceOf(Translation);
      expect(container.translation().loaded).to.be.true;
    });

    it('should load no translation', () => {
      container.create({});
      expect(container.translation()).to.be.instanceOf(Translation);
      expect(container.translation().loaded).to.be.false;
    });

    it('should load custom translation with vocabularies', () => {
      container.create({ translation: 'my', vocabularies: ['data/custom_vocabulary.json'] });
      expect(container.translation()).to.be.instanceOf(Translation);
      expect(container.translation().loaded).to.be.true;
      const translation = container.translation();
      expect(translation.actionAliasFor('say')).to.eql('arr');
    });
  });

  describe('#helpers', () => {
    beforeEach(() => {
      container.clear({
        helper1: { name: 'hello' },
        helper2: { name: 'world' },
      });
    });

    it('should return all helper with no args', () => expect(container.helpers()).to.have.keys('helper1', 'helper2'));

    it('should return helper by name', () => {
      expect(container.helpers('helper1')).is.ok;
      expect(container.helpers('helper1').name).to.eql('hello');
      expect(container.helpers('helper2')).is.ok;
      expect(container.helpers('helper2').name).to.eql('world');
      expect(!container.helpers('helper3')).is.ok;
    });
  });

  describe('#support', () => {
    beforeEach(() => {
      container.clear({}, {
        support1: { name: 'hello' },
        support2: { name: 'world' },
      });
    });

    it('should return all support objects', () => expect(container.support()).to.have.keys('support1', 'support2'));

    it('should support object by name', () => {
      expect(container.support('support1')).is.ok;
      expect(container.support('support1').name).to.eql('hello');
      expect(container.support('support2')).is.ok;
      expect(container.support('support2').name).to.eql('world');
      expect(!container.support('support3')).is.ok;
    });
  });

  describe('#plugins', () => {
    beforeEach(() => {
      container.clear({}, {}, {
        plugin1: { name: 'hello' },
        plugin2: { name: 'world' },
      });
    });

    it('should return all plugins', () => expect(container.plugins()).to.have.keys('plugin1', 'plugin2'));

    it('should get plugin by name', () => {
      expect(container.plugins('plugin1')).is.ok;
      expect(container.plugins('plugin1').name).is.eql('hello');
      expect(container.plugins('plugin2')).is.ok;
      expect(container.plugins('plugin2').name).is.eql('world');
      expect(!container.plugins('plugin3')).is.ok;
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
      expect(container.helpers('MyHelper')).is.ok;
      expect(container.helpers('MyHelper').method()).to.eql('hello world');

      // built-in helpers
      expect(container.helpers('FileSystem')).is.ok;
      expect(container.helpers('FileSystem')).to.be.instanceOf(FileSystem);
    });

    it('should always create I', () => {
      container.create({});
      expect(container.support('I')).is.ok;
    });

    it('should load DI and return a reference to the module', () => {
      container.create({
        include: {
          dummyPage: './data/dummy_page',
        },
      });
      const dummyPage = require('../data/dummy_page');
      expect(container.support('dummyPage')).is.eql(dummyPage);
    });

    it('should load I from path and execute _init', () => {
      container.create({
        include: {
          I: './data/I',
        },
      });
      expect(container.support('I')).is.ok;
      expect(container.support('I')).to.include.keys('_init', 'doSomething');
      expect(global.I_initialized).to.be.true;
    });

    it('should load DI includes provided as require paths', () => {
      container.create({
        include: {
          dummyPage: './data/dummy_page',
        },
      });
      expect(container.support('dummyPage')).is.ok;
      expect(container.support('dummyPage')).to.include.keys('openDummyPage');
    });

    it('should load DI and inject I into PO', () => {
      container.create({
        include: {
          dummyPage: './data/dummy_page',
        },
      });
      expect(container.support('dummyPage')).is.ok;
      expect(container.support('I')).is.ok;
      expect(container.support('dummyPage')).to.include.keys('openDummyPage');
      expect(container.support('dummyPage').getI()).to.have.keys(Object.keys(container.support('I')));
    });

    it('should load DI and inject custom I into PO', () => {
      container.create({
        include: {
          dummyPage: './data/dummy_page',
          I: './data/I',
        },
      });
      expect(container.support('dummyPage')).is.ok;
      expect(container.support('I')).is.ok;
      expect(container.support('dummyPage')).to.include.keys('openDummyPage');
      expect(container.support('dummyPage').getI()).to.have.keys(Object.keys(container.support('I')));
    });

    it('should load DI includes provided as objects', () => {
      container.create({
        include: {
          dummyPage: {
            openDummyPage: () => 'dummy page opened',
          },
        },
      });
      expect(container.support('dummyPage')).is.ok;
      expect(container.support('dummyPage')).to.include.keys('openDummyPage');
    });

    it('should load DI includes provided as objects', () => {
      container.create({
        include: {
          dummyPage: {
            openDummyPage: () => 'dummy page opened',
          },
        },
      });
      expect(container.support('dummyPage')).is.ok;
      expect(container.support('dummyPage')).to.include.keys('openDummyPage');
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
      expect(container.helpers('FileSystem')).is.ok;
      expect(container.helpers('FileSystem')).is.instanceOf(FileSystem);

      expect(container.helpers('AnotherHelper')).is.ok;
      expect(container.helpers('AnotherHelper').method()).is.eql('executed');
    });

    it('should be able to add new support object', () => {
      container.create({});
      container.append({ support: { userPage: { login: '#login' } } });
      expect(container.support('I')).is.ok;
      expect(container.support('userPage')).is.ok;
      expect(container.support('userPage').login).is.eql('#login');
    });
  });
});
