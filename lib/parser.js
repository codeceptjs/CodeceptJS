function _interopDefault(ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex.default : ex; }
const parser = _interopDefault(require('parse-function'))({ ecmaVersion: 2017 });

module.exports.getParamsToString = function (fn) {
  return getParams(fn).join(', ');
};

function getParams(fn) {
  if (fn.isSinonProxy) return [];
  const newFn = fn.toString().replace(/^async/, 'async function');
  try {
    const reflected = parser.parse(newFn);
    const params = reflected.args.map((p) => {
      const def = reflected.defaults[p];
      if (def) {
        return `${p}=${def}`;
      }
      return p;
    });
    return params;
  } catch (err) {
    console.log(`Error in ${newFn.toString()}`);
    console.error(err);
  }
}
