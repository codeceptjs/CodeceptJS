var fs = require('fs');

module.exports.fileExists = function (filePath) {
  try {
    fs.statSync(filePath);
  } catch (err) {
    if (err.code === 'ENOENT') return false;
  }
  return true;
};

module.exports.getParamNames = function (fn) {
  if (fn.isSinonProxy) return [];
  var funStr = fn.toString();
  return funStr.slice(funStr.indexOf('(') + 1, funStr.indexOf(')')).match(/([^\s,]+)/g);
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
      if (typeof(obj[prop]) !== 'function') return;
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
        return data['form'][key];
      }
      return data;
    }  
  },

  expectError: function () {
    throw new Error('should not be thrown');
  }
}
