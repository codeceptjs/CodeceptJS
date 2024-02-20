import { expect } from 'chai';
import path from 'path';
import FileSystem from '../../lib/helper/FileSystem.js';
import actor from '../../lib/actor.js';
import container from '../../lib/container.js';
import Translation from  '../../lib/translation.js';
import { createRequire } from 'node:module';

import dummyPage from "../data/dummy_page.js";

const require = createRequire(import.meta.url);
const __dirname = path.resolve();

describe('Container', async () => {
  before(() => {
    global.codecept_dir = path.join(__dirname);
    global.inject = container.support;
    global.actor = actor;
  });

  afterEach(() => {
    container.clear();
    ['I', 'dummy_page'].forEach((po) => {
      const name = require.resolve(path.join(__dirname, `/test/data/${po}.js`));
      delete require.cache[name];
    });
  });

  describe('#translation', async () => {
    it('should create empty translation', async () => {
      await container.create({});
      expect(container.translation()).to.be.instanceOf(Translation);
      expect(container.translation().loaded).to.be.false;
      expect(container.translation().actionAliasFor('see')).to.eql('see');
    });

    it('should create Russian translation', async () => {
      await container.create({ translation: 'ru-RU' });
      expect(container.translation()).to.be.instanceOf(Translation);
      expect(container.translation().loaded).to.be.true;
      expect(container.translation().I).to.eql('Я');
      expect(container.translation().actionAliasFor('see')).to.eql('вижу');
    });

    it('should create Italian translation', async () => {
      await container.create({ translation: 'it-IT' });
      expect(container.translation()).to.be.instanceOf(Translation);
      expect(container.translation().loaded).to.be.true;
      expect(container.translation().I).to.eql('io');
      expect(container.translation().value('contexts').Feature).to.eql('Caratteristica');
    });

    it('should create French translation', async () => {
      await container.create({ translation: 'fr-FR' });
      expect(container.translation()).to.be.instanceOf(Translation);
      expect(container.translation().loaded).to.be.true;
      expect(container.translation().I).to.eql('Je');
      expect(container.translation().value('contexts').Feature).to.eql('Fonctionnalité');
    });

    it('should create Portuguese translation', async () => {
      await container.create({ translation: 'pt-BR' });
      expect(container.translation()).to.be.instanceOf(Translation);
      expect(container.translation().loaded).to.be.true;
      expect(container.translation().I).to.eql('Eu');
      expect(container.translation().value('contexts').Feature).to.eql('Funcionalidade');
    });

    it('should load custom translation', async () => {
      await container.create({ translation: 'my' });
      expect(container.translation()).to.be.instanceOf(Translation);
      expect(container.translation().loaded).to.be.true;
    });

    it('should load no translation', async () => {
      await container.create({});
      expect(container.translation()).to.be.instanceOf(Translation);
      expect(container.translation().loaded).to.be.false;
    });

    it('should load custom translation with vocabularies', async () => {
      await container.create({ translation: 'my', vocabularies: ['test/data/custom_vocabulary.json'] });
      expect(container.translation()).to.be.instanceOf(Translation);
      expect(container.translation().loaded).to.be.true;
      const translation = container.translation();
      expect(translation.actionAliasFor('say')).to.eql('arr');
    });
  });

  describe('#helpers', async () => {
    beforeEach(() => {
      container.clear({
        helper1: { name: 'hello' },
        helper2: { name: 'world' },
      });
    });

    it('should return all helper with no args', async () => expect(container.helpers()).to.have.keys('helper1', 'helper2'));

    it('should return helper by name', async () => {
      expect(container.helpers('helper1')).is.ok;
      expect(container.helpers('helper1').name).to.eql('hello');
      expect(container.helpers('helper2')).is.ok;
      expect(container.helpers('helper2').name).to.eql('world');
      expect(!container.helpers('helper3')).is.ok;
    });
  });

  describe('#support', async () => {
    beforeEach(() => {
      container.clear({}, {
        support1: { name: 'hello' },
        support2: { name: 'world' },
      });
    });

    it('should return all support objects', async () => expect(await container.support()).to.have.keys('support1', 'support2'));

    it('should support object by name', async () => {
      expect(await container.support('support1')).is.ok;
      expect(await container.support('support1').name).to.eql('hello');
      expect(await container.support('support2')).is.ok;
      expect(await container.support('support2').name).to.eql('world');
      expect(!await container.support('support3')).is.ok;
    });
  });

  describe('#plugins', async () => {
    beforeEach(() => {
      container.clear({}, {}, {
        plugin1: { name: 'hello' },
        plugin2: { name: 'world' },
      });
    });

    it('should return all plugins', async () => expect(container.plugins()).to.have.keys('plugin1', 'plugin2'));

    it('should get plugin by name', async () => {
      expect(container.plugins('plugin1')).is.ok;
      expect(container.plugins('plugin1').name).is.eql('hello');
      expect(container.plugins('plugin2')).is.ok;
      expect(container.plugins('plugin2').name).is.eql('world');
      expect(!container.plugins('plugin3')).is.ok;
    });
  });

  describe('#create', async () => {
    it('should create container with helpers', async () => {
      const config = {
        helpers: {
          MyHelper: {
            require: './test/data/helper.js',
          },
          FileSystem: {},
        },
      };
      await container.create(config);
      // custom helpers
      expect(container.helpers('MyHelper')).is.ok;
      expect(container.helpers('MyHelper').method()).to.eql('hello world');

      // built-in helpers
      expect(container.helpers('FileSystem')).is.ok;
      expect(container.helpers('FileSystem')).to.be.instanceOf(FileSystem);
    });

    it('should always create I', async () => {
      await container.create({});
      expect(await container.support('I')).is.ok;
    });

    it('should load DI and return a reference to the module', async () => {
      await container.create({
        include: {
          dummyPage: './test/data/dummy_page.js',
        },
      });
      expect(await container.support('dummyPage')).is.eql(dummyPage);
    });

    it('should load I from path and execute _init', async () => {
      await container.create({
        include: {
          I: './test/data/I.js',
        },
      });
      expect(await container.support('I')).is.ok;
      expect(await container.support('I')).to.include.keys('_init', 'doSomething');
      expect(global.I_initialized).to.be.true;
    });

    it('should load DI includes provided as require paths', async () => {
      await container.create({
        include: {
          dummyPage: './test/data/dummy_page.js',
        },
      });
      expect(await container.support('dummyPage')).is.ok;
      expect(await container.support('dummyPage')).to.include.keys('openDummyPage');
    });

    it('should load DI and inject I into PO', async () => {
      await container.create({
        include: {
          dummyPage: './test/data/dummy_page.js',
        },
      });
      expect(await container.support('dummyPage')).is.ok;
      expect(await container.support('I')).is.ok;
      expect(await container.support('dummyPage')).to.include.keys('openDummyPage');
    });

    it('should load DI and inject custom I into PO', async () => {
      await container.create({
        include: {
          dummyPage: './test/data/dummy_page.js',
          I: './test/data/I.js',
        },
      });
      expect(await container.support('dummyPage')).is.ok;
      expect(await container.support('I')).is.ok;
      expect(await container.support('dummyPage')).to.include.keys('openDummyPage');
      expect((await container.support('dummyPage')).getI()).to.have.keys(Object.keys(await container.support('I')));
    });

    it('should load DI includes provided as objects', async () => {
      await container.create({
        include: {
          dummyPage: {
            openDummyPage: () => 'dummy page opened',
          },
        },
      });
      expect(await container.support('dummyPage')).is.ok;
      expect(await container.support('dummyPage')).to.include.keys('openDummyPage');
    });

    it('should load DI includes provided as objects', async () => {
      await container.create({
        include: {
          dummyPage: {
            openDummyPage: () => 'dummy page opened',
          },
        },
      });
      expect(await container.support('dummyPage')).is.ok;
      expect(await container.support('dummyPage')).to.include.keys('openDummyPage');
    });
  });

  describe('#append', async () => {
    it('should be able to add new helper', async () => {
      const config = {
        helpers: {
          FileSystem: {},
        },
      };
      await container.create(config);
      container.append({
        helpers: {
          AnotherHelper: { method: () => 'executed' },
        },
      });
      expect(await container.helpers('FileSystem')).is.ok;
      expect((await container.helpers()).FileSystem).is.instanceOf(FileSystem);

      expect(container.helpers('AnotherHelper')).is.ok;
      expect(container.helpers('AnotherHelper').method()).is.eql('executed');
    });

    it('should be able to add new support object', async () => {
      await container.create({});
      container.append({ support: { userPage: { login: '#login' } } });
      expect(await container.support('I')).is.ok;
      expect(await container.support('userPage')).is.ok;
      expect(await container.support('userPage')).is.eql('#login');
    });
  });
});
