// Helps tsd-jsdoc to exports all typings into the CodeceptJS namespace,
// instead of the global.

let namespaceAdded = false;
const kinds = ['class', 'constant', 'function', 'typedef'];
const namespace = 'CodeceptJS';

module.exports = {
  handlers: {
    beforeParse(event) {
      if (!namespaceAdded) {
        event.source += '/** @namespace CodeceptJS */';
        namespaceAdded = true;
      }
    },
    newDoclet: ({ doclet }) => {
      if (doclet.undocumented || doclet.memberof || !kinds.includes(doclet.kind)) return;
      doclet.memberof = 'CodeceptJS';
      doclet.longname = `${doclet.memberof}.${doclet.longname}`;
      if (doclet.scope === 'global') doclet.scope = 'static';
    },
  },
};
