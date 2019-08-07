module.exports = {
  source: {
    include: [
      './docs/build',
      './lib/codecept.js',
      './lib/config.js',
      './lib/container.js',
      './lib/data/table.js',
      './lib/Helper.js',
      './lib/interfaces',
      './lib/locator.js',
      './lib/pause.js',
      './lib/secret.js',
      './lib/session.js',
      './lib/step.js',
      './lib/ui.js',
      './lib/within.js',
    ],
  },
  opts: {
    template: 'node_modules/tsd-jsdoc/dist',
    recurse: true,
    destination: './typings/',
  },
  plugins: ['jsdoc.namespace.js'],
};
