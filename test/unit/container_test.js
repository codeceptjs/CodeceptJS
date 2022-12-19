const expect = require('expect');
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
      expect(container.translation()).toBeInstanceOf(Translation);
      expect(container.translation().loaded).toBeFalsy();
      expect(container.translation().actionAliasFor('see')).toEqual('see');
    });

    it('should create Russian translation', () => {
      container.create({ translation: 'ru-RU' });
      expect(container.translation()).toBeInstanceOf(Translation);
      expect(container.translation().loaded).toBeTruthy();
      expect(container.translation().I).toEqual('Я');
      expect(container.translation().actionAliasFor('see')).toEqual('вижу');
    });

    it('should create Italian translation', () => {
      container.create({ translation: 'it-IT' });
      expect(container.translation()).toBeInstanceOf(Translation);
      expect(container.translation().loaded).toBeTruthy();
      expect(container.translation().I).toEqual('io');
      expect(container.translation().value('contexts').Feature).toEqual('Caratteristica');
    });

    it('should create French translation', () => {
      container.create({ translation: 'fr-FR' });
      expect(container.translation()).toBeInstanceOf(Translation);
      expect(container.translation().loaded).toBeTruthy();
      expect(container.translation().I).toEqual('Je');
      expect(container.translation().value('contexts').Feature).toEqual('Fonctionnalité');
    });

    it('should create Portuguese translation', () => {
      container.create({ translation: 'pt-BR' });
      expect(container.translation()).toBeInstanceOf(Translation);
      expect(container.translation().loaded).toBeTruthy();
      expect(container.translation().I).toEqual('Eu');
      expect(container.translation().value('contexts').Feature).toEqual('Funcionalidade');
    });

    it('should load custom translation', () => {
      container.create({ translation: 'my' });
      expect(container.translation()).toBeInstanceOf(Translation);
      expect(container.translation().loaded).toBeTruthy();
    });

    it('should load no translation', () => {
      container.create({});
      expect(container.translation()).toBeInstanceOf(Translation);
      expect(container.translation().loaded).toBeFalsy();
    });

    it('should load custom translation with vocabularies', () => {
      container.create({ translation: 'my', vocabularies: ['data/custom_vocabulary.json'] });
      expect(container.translation()).toBeInstanceOf(Translation);
      expect(container.translation().loaded).toBeTruthy();
      const translation = container.translation();
      expect(translation.actionAliasFor('say')).toEqual('arr');
    });
  });

  describe('#helpers', () => {
    beforeEach(() => {
      container.clear({
        helper1: { name: 'hello' },
        helper2: { name: 'world' },
      });
    });

    it('should return all helpers with no args', () => expect(container.helpers()).toHaveProperty('helper1', 'helper2'));

    it('should return helper by name', () => {
      expect(container.helpers('helper1')).toBeTruthy();
      expect(container.helpers('helper1').name).toEqual('hello');
      expect(container.helpers('helper2')).toBeTruthy();
      expect(container.helpers('helper2').name).toEqual('world');
      expect(!container.helpers('helper3')).toBeTruthy();
    });
  });

  describe('#support', () => {
    beforeEach(() => {
      container.clear({}, {
        support1: { name: 'hello' },
        support2: { name: 'world' },
      });
    });

    it('should return all support objects', () => expect(container.support()).toHaveProperty('support1', 'support2'));

    it('should support object by name', () => {
      expect(container.support('support1')).toBeTruthy();
      expect(container.support('support1').name).toEqual('hello');
      expect(container.support('support2')).toBeTruthy();
      expect(container.support('support2').name).toEqual('world');
      expect(!container.support('support3')).toBeTruthy();
    });
  });

  describe('#plugins', () => {
    beforeEach(() => {
      container.clear({}, {}, {
        plugin1: { name: 'hello' },
        plugin2: { name: 'world' },
      });
    });

    it('should return all plugins', () => expect(container.plugins()).toHaveProperty('plugin1', 'plugin2'));

    it('should get plugin by name', () => {
      expect(container.plugins('plugin1')).toBeTruthy();
      expect(container.plugins('plugin1').name).toEqual('hello');
      expect(container.plugins('plugin2')).toBeTruthy();
      expect(container.plugins('plugin2').name).toEqual('world');
      expect(!container.plugins('plugin3')).toBeTruthy();
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
      expect(container.helpers('MyHelper')).toBeTruthy();
      expect(container.helpers('MyHelper').method()).toEqual('hello world');

      // built-in helpers
      expect(container.helpers('FileSystem')).toBeTruthy();
      expect(container.helpers('FileSystem')).toBeInstanceOf(FileSystem);
    });

    it('should always create I', () => {
      container.create({});
      expect(container.support('I')).toBeTruthy();
    });

    it('should load DI and return a reference to the module', () => {
      container.create({
        include: {
          dummyPage: './data/dummy_page',
        },
      });
      const dummyPage = require('../data/dummy_page');
      expect(container.support('dummyPage')).toEqual(dummyPage);
    });

    it('should load I from path and execute _init', () => {
      container.create({
        include: {
          I: './data/I',
        },
      });
      expect(container.support('I')).toBeTruthy();
      expect(container.support('I')).to('_init', 'doSomething');
      expect(global.I_initialized).toBeTruthy();
    });

    it('should load DI includes provided as require paths', () => {
      container.create({
        include: {
          dummyPage: './data/dummy_page',
        },
      });
      expect(container.support('dummyPage')).toBeTruthy();
      expect(container.support('dummyPage')).toHaveProperty('openDummyPage');
    });

    it('should load DI and inject I into PO', () => {
      container.create({
        include: {
          dummyPage: './data/dummy_page',
        },
      });
      expect(container.support('dummyPage')).toBeTruthy();
      expect(container.support('I')).toBeTruthy();
      expect(container.support('dummyPage')).toHaveProperty('openDummyPage');
      expect(container.support('dummyPage').getI()).toHaveProperty(Object.keys(container.support('I')));
    });

    it('should load DI and inject custom I into PO', () => {
      container.create({
        include: {
          dummyPage: './data/dummy_page',
          I: './data/I',
        },
      });
      expect(container.support('dummyPage')).toBeTruthy();
      expect(container.support('I')).toBeTruthy();
      expect(container.support('dummyPage')).toHaveProperty('openDummyPage');
      expect(container.support('dummyPage').getI()).toHaveProperty(Object.keys(container.support('I')));
    });

    it('should load DI includes provided as objects', () => {
      container.create({
        include: {
          dummyPage: {
            openDummyPage: () => 'dummy page opened',
          },
        },
      });
      expect(container.support('dummyPage')).toBeTruthy();
      expect(container.support('dummyPage')).toHaveProperty('openDummyPage');
    });

    it('should load DI includes provided as objects', () => {
      container.create({
        include: {
          dummyPage: {
            openDummyPage: () => 'dummy page opened',
          },
        },
      });
      expect(container.support('dummyPage')).toBeTruthy();
      expect(container.support('dummyPage')).toHaveProperty('openDummyPage');
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
      expect(container.helpers('FileSystem')).toBeTruthy();
      expect(container.helpers('FileSystem')).toBeInstanceOf(FileSystem);

      expect(container.helpers('AnotherHelper')).toBeTruthy();
      expect(container.helpers('AnotherHelper').method()).toEqual('executed');
    });

    it('should be able to add new support object', () => {
      container.create({});
      container.append({ support: { userPage: { login: '#login' } } });
      expect(container.support('I')).toBeTruthy();
      expect(container.support('userPage')).toBeTruthy();
      expect(container.support('userPage').login).toEqual('#login');
    });
  });
});
