module.exports = {
  source: {
    include: [
      './lib/config.js',
      './lib/codecept.js',
      './lib/container.js',
      './lib/locator.js',
      './lib/pause.js',
      './lib/secret.js',
      './lib/session.js',
      './lib/Helper.js',
      './lib/ui.js',
      './lib/within.js',
      './lib/data/table.js',
      './lib/interfaces',
      './docs/build',
    ],
  },
  opts: {
    template: 'node_modules/tsd-jsdoc/dist',
    recurse: true,
    destination: './typings/',
  },
};
