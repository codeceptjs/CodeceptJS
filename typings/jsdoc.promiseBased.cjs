// Helps tsd-jsdoc to exports all helpers methods as Promise
// - Before parsing JS file, change class name and remove configuration already exported
// - For each method set by default 'Promise<any>' if there is no returns tag or if the returns tag doesn't handle a promise

const isHelper = (path) => path.includes('docs/build');
const isDocumentedMethod = (doclet) => doclet.undocumented !== true
  && doclet.kind === 'function'
  && doclet.scope === 'instance';
const shouldOverrideReturns = (doclet) => !doclet.returns
  || !doclet.returns[0].type
  || !doclet.returns[0].type.names[0].includes('Promise');

module.exports = {
  handlers: {
    beforeParse(e) {
      if (isHelper(e.filename)) {
        e.source = e.source
          // add 'Ts' suffix to generate promise-based helpers definition
          .replace(/class (.*) extends/, 'class $1Ts extends')
          // rename parent class to fix the inheritance
          .replace(/(@augments \w+)/, '$1Ts')
          // do not export twice the configuration of the helpers
          .replace(/\/\*\*(.+?(?=config))config = \{\};/s, '');
      }
    },
    newDoclet: ({ doclet }) => {
      if (isHelper(doclet.meta.path)
        && isDocumentedMethod(doclet)
        && shouldOverrideReturns(doclet)) {
        doclet.returns = [];
        doclet.addTag('returns', '{Promise<any>}');
      }
    },
  },
};
