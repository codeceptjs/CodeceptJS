module.exports = {
  source: {
    include: [
      './docs/build',
    ],
  },
  opts: {
    template: 'node_modules/tsd-jsdoc/dist',
    recurse: true,
    destination: './',
  },
  plugins: ['jsdoc.promiseBased.js', 'jsdoc.namespace.js', 'jsdoc-typeof-plugin'],
};
