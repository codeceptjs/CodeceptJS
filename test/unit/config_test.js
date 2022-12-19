const expect = require('expect');

const config = require('../../lib/config');

describe('Config', () => {
  beforeEach(() => config.reset());

  it('should be created', () => {
    const cfg = config.create({
      output: './report',
    });
    expect(cfg).toHaveProperty('helpers', 'plugins', 'include');
    expect(config.get()).toEqual(cfg);
    expect(cfg.output).toEqual('./report');
    expect(config.get('output')).toEqual('./report');
    expect(config.get('output', './other')).toEqual('./report');
    expect(config.get('tests', '**_test.js')).toEqual('**_test.js');
  });

  it('should be completely reset', () => {
    config.addHook((cfg) => {
      cfg.helpers.Puppeteer.show = true;
    });
    config.create({
      tests: '**tests',
      helpers: {
        Puppeteer: {},
      },
    });
    config.append({
      output: './other',
    });
    expect(config.get('helpers').Puppeteer.show).toEqual(true);
    config.reset();
    expect(config.get().output).not.toEqual('./other');
    expect(config.get()).not.toHaveProperty('tests');
    expect(config.get('helpers')).not.toHaveProperty('Puppeteer');
    config.create({
      helpers: {
        Puppeteer: {},
      },
    });
    expect(config.get('helpers').Puppeteer.show).not.toEqual(true);
  });

  it('can be updated', () => {
    config.create();
    config.append({
      output: './other',
    });
    expect(config.get('output')).toEqual('./other');
  });

  it('should use config hooks to enhance configs', () => {
    config.addHook((cfg) => {
      cfg.additionalValue = true;
    });
    const cfg = config.create({
      additionalValue: false,
    });
    expect(cfg).toHaveProperty('additionalValue');
    expect(cfg.additionalValue).toEqual(true);
  });
});
