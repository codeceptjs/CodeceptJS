var fs = require('fs');
var path = require('path');
var getParameterNames = require('get-parameter-names');

module.exports.fileExists = function (filePath) {
  try {
    fs.statSync(filePath);
  } catch (err) {
    if (err.code === 'ENOENT') return false;
  }
  return true;
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
  return getParameterNames(fn);
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
    obj = obj.__proto__;

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

module.exports.hashCode = function (str) {
  /* Getting 32bit hashCode of string like in Java.
   *  Used in Screenshot name to provide short screenshot names
   */
  var hash = 0;
  var char;
  if (str.length == 0) return hash;
  for (var i = 0; i < str.length; i++) {
    char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
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
  },

  expectError: function () {
    throw new Error('should not be thrown');
  }
};
