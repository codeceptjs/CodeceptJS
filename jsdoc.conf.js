module.exports = {
  source: {
    include: [
      './lib/actor.js',
      './lib/codecept.js',
      './lib/index.js',
      './lib/locator.js',
      './lib/pause.js',
      './lib/secret.js',
      './lib/session.js',
      './lib/ui.js',
      './lib/within.js',
      './lib/data/context.js',
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
