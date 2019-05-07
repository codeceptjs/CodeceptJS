const parser = require('parse-function')({ ecmaVersion: 2017 });
const { flatTail } = require('./utils');

module.exports.getParamsToString = function (fn) {
  return getParams(fn).join(', ');
};

module.exports.toTypeDef = function (fn) {
  const types = [];
  const paramNames = [];
  const params = getParams(fn);
  for (const key in params) {
    let paramName = params[key];
    const paramValue = paramName.split('=');
    const isOptional = paramValue.length !== 1;
    if (isOptional) {
      paramName = paramValue[0];
    }
    paramNames[key] = paramName;
    if (isOptional) {
      paramNames[key] += '?';
    }
    types[key] = guessParamTypes(paramName);
  }

  let combinedTypes = types[types.length - 1];
  if (!combinedTypes) return methodSignature(fn);
  if (types.length === 1) {
    return combinedTypes.map(type => methodSignature(fn, paramNames, [type])).join('');
  }

  for (let i = types.length - 2; i >= 0; i--) {
    combinedTypes = flatTail(combinedTypes, types[i]);
  }
  return combinedTypes.map(type => methodSignature(fn, paramNames, type)).join('');
};

function methodSignature(fn, paramNames, params) {
  if (!fn.name) return;
  if (!params) params = [];
  params = params.map((p, i) => `${paramNames[i]}: ${p}`).join(', ');
  let returnType = 'void';
  if (fn.name.indexOf('grab') === 0) {
    if (fn.name.indexOf('BrowserLog') > 0 || fn.name.indexOf('ScrollPosition') > 0) {
      returnType = 'Promise<object>';
    }
    if (fn.name.indexOf('Number') > 0) {
      returnType = 'Promise<number>';
    }
    returnType = 'Promise<string>';
  }
  return `    ${fn.name}(${params}) : ${returnType},\n`;
}

function guessParamTypes(paramName) {
  switch (paramName) {
    case 'fn':
      return ['Function'];
    case 'locator':
    case 'field':
    case 'context':
    case 'select':
      return ['LocatorOrString'];
    case 'num':
    case 'sec':
    case 'width':
    case 'height':
    case 'offset':
    case 'offsetX':
    case 'offsetY':
      return ['number'];
  }
  return ['string'];
}

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

