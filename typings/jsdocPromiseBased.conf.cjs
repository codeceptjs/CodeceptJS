module.exports = {
  source: {
    include: [
      './docs/build',
    ],
  },
  opts: {
    template: 'node_modules/tsd-jsdoc/dist',
    recurse: true,
    destination: './typings/',
  },
  plugins: ['jsdoc.promiseBased.cjs', 'jsdoc.namespace.cjs', 'jsdoc-typeof-plugin'],
};
