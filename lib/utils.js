var fs = require('fs');
var path = require('path');
const getParams = require('js-function-reflector');
const getFunctionArguments = require('get-function-arguments');

function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

function deepMerge(target, source) {
  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        deepMerge(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }
  return target;
}

module.exports.deepMerge = deepMerge;

let isGenerator = module.exports.isGenerator = function (fn) {
  return fn.constructor.name === 'GeneratorFunction';
};

module.exports.fileExists = function (filePath) {
  try {
    fs.statSync(filePath);
  } catch (err) {
    if (err.code === 'ENOENT') return false;
  }
  return true;
};

module.exports.detectAbsolutePath = function (filePath) {
  if (filePath.startsWith('/') || filePath.startsWith('\\')) return true;
  if (filePath.match(/^\w\:\\/)) return true; // Windows style
  return false;
};

module.exports.isFile = function (filePath) {
  var filestat;
  try {
    filestat = fs.statSync(filePath);
  } catch (err) {
    if (err.code === 'ENOENT') return false;
  }
  if (!filestat) return false;
  return filestat.isFile();
};

module.exports.getParamNames = function (fn) {
  if (fn.isSinonProxy) return [];
  return getFunctionArguments(fn);
};


module.exports.getParamsToString = function (fn) {
  if (fn.isSinonProxy) return [];
  let params = getParams(fn).args.map((p) => Array.isArray(p) ? `${p[0]}=${p[1]}` : p);
  if (isGenerator(fn) && params[0] && params[0][0] === '*') {
    params[0] = params[2].substr(2);
  }
  return params.join(', ');
};

module.exports.installedLocally = function () {
  return path.resolve(__dirname + '/../').indexOf(process.cwd()) === 0;
};

module.exports.methodsOfObject = function (obj, className) {
  var methods = [];

  const standard = [
    'constructor',
    'toString',
    'toLocaleString',
    'valueOf',
    'hasOwnProperty',
    'isPrototypeOf',
    'propertyIsEnumerable'
  ];

  while (obj.constructor.name !== className) {
    Object.getOwnPropertyNames(obj).forEach((prop) => {
      if (typeof obj[prop] !== 'function') return;
      if (standard.indexOf(prop) >= 0) return;
      if (prop.indexOf('_') === 0) return;
      methods.push(prop);
    });
    obj = Object.getPrototypeOf(obj);

    if (!obj || !obj.constructor) break;
  }
  return methods;
};

module.exports.template = function (template, data) {
  return template.replace(/{{([^{}]*)}}/g, function (a, b) {
    var r = data[b];
    if (r === undefined) return '';
    return r.toString();
  });
};

module.exports.ucfirst = function (str) {
  return str.charAt(0).toUpperCase() + str.substr(1);
};

module.exports.lcfirst = function (str) {
  return str.charAt(0).toLowerCase() + str.substr(1);
};

module.exports.chunkArray = function (arr, chunk) {
  var i;
  var j;
  var tmp = [];
  for (i = 0, j = arr.length; i < j; i += chunk) {
    tmp.push(arr.slice(i, i + chunk));
  }
  return tmp;
};

module.exports.clearString = function (str) {
  /* Replace forbidden symbols in string
   */
  return str
    .replace(/ /g, '_')
    .replace(/"/g, "'")
    .replace(/\//g, '_')
    .replace(/</g, '(')
    .replace(/>/g, ')')
    .replace(/:/g, '_')
    .replace(/\\/g, '_')
    .replace(/\|/g, '_')
    .replace(/\?/g, '.')
    .replace(/\*/g, '^');
};

module.exports.decodeUrl = function (url) {
  /* Replace forbidden symbols in string
   */
  return decodeURIComponent(decodeURIComponent(decodeURIComponent(url)));
};

module.exports.xpathLocator = {
  literal: (string) => {
    if (string.indexOf("'") > -1) {
      string = string.split("'", -1).map(function (substr) {
        return "'" + substr + "'";
      }).join(',"\'",');
      return "concat(" + string + ")";
    } else {
      return "'" + string + "'";
    }
  },
  combine: (locators) => {
    return locators.join(' | ');
  }
};

module.exports.test = {

  submittedData: function (dataFile) {
    return function (key) {
      var data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
      if (key) {
        return data.form[key];
      }
      return data;
    };
  }

};
