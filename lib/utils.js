const fs = require('fs');
const path = require('path');
const getFunctionArguments = require('fn-args');
const { convertColorToRGBA, isColorProperty } = require('./colorUtils');

function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

function flatTail(flatParams, params) {
  const res = [];
  for (const fp of flatParams) {
    for (const p of params) {
      res.push([p].concat(fp));
    }
  }
  return res;
}

module.exports.flatTail = flatTail;

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

const isGenerator = module.exports.isGenerator = function (fn) {
  return fn.constructor.name === 'GeneratorFunction';
};

const isAsyncFunction = module.exports.isAsyncFunction = function (fn) {
  return fn[Symbol.toStringTag] === 'AsyncFunction';
};

module.exports.fileExists = function (filePath) {
  try {
    fs.statSync(filePath);
  } catch (err) {
    if (err.code === 'ENOENT') return false;
  }
  return true;
};

module.exports.isFile = function (filePath) {
  let filestat;
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


module.exports.installedLocally = function () {
  return path.resolve(`${__dirname}/../`).indexOf(process.cwd()) === 0;
};

module.exports.methodsOfObject = function (obj, className) {
  const methods = [];

  const standard = [
    'constructor',
    'toString',
    'toLocaleString',
    'valueOf',
    'hasOwnProperty',
    'isPrototypeOf',
    'propertyIsEnumerable',
  ];

  function pushToMethods(prop) {
    if (typeof obj[prop] !== 'function') return;
    if (standard.indexOf(prop) >= 0) return;
    if (prop.indexOf('_') === 0) return;
    methods.push(prop);
  }

  while (obj.constructor.name !== className) {
    Object.getOwnPropertyNames(obj).forEach(pushToMethods);
    obj = Object.getPrototypeOf(obj);

    if (!obj || !obj.constructor) break;
  }
  return methods;
};

module.exports.template = function (template, data) {
  return template.replace(/{{([^{}]*)}}/g, (a, b) => {
    const r = data[b];
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
  let i;
  let j;
  const tmp = [];
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
      string = string.split("'", -1).map(substr => `'${substr}'`).join(',"\'",');
      return `concat(${string})`;
    }
    return `'${string}'`;
  },
  combine: locators => locators.join(' | '),
};

module.exports.test = {

  grepLines(array, startString, endString) {
    let startIndex = 0;
    let endIndex;
    array.every((elem, index) => {
      if (elem === startString) {
        startIndex = index;
        return true;
      }
      if (elem === endString) {
        endIndex = index;
        return false;
      }
      return true;
    });
    return array.slice(startIndex + 1, endIndex);
  },


  submittedData(dataFile) {
    return function (key) {
      if (!fs.existsSync(dataFile)) {
        const waitTill = new Date(new Date().getTime() + 1 * 1000); // wait for one sec for file to be created
        while (waitTill > new Date()) {} // eslint-disable-line no-empty
      }
      if (!fs.existsSync(dataFile)) {
        throw new Error('Data file was not created in time');
      }
      const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
      if (key) {
        return data.form[key];
      }
      return data;
    };
  },

};

function toCamelCase(name) {
  if (typeof name !== 'string') {
    return name;
  }
  return name.replace(/-(\w)/gi, (word, letter) => {
    return letter.toUpperCase();
  });
}

function convertFontWeightToNumber(name) {
  const fontWeightPatterns = [
    { num: 100, pattern: /^Thin$/i },
    { num: 200, pattern: /^(Extra|Ultra)-?light$/i },
    { num: 300, pattern: /^Light$/i },
    { num: 400, pattern: /^(Normal|Regular|Roman|Book)$/i },
    { num: 500, pattern: /^Medium$/i },
    { num: 600, pattern: /^(Semi|Demi)-?bold$/i },
    { num: 700, pattern: /^Bold$/i },
    { num: 800, pattern: /^(Extra|Ultra)-?bold$/i },
    { num: 900, pattern: /^(Black|Heavy)$/i },
  ];

  if (/^[1-9]00$/.test(name)) {
    return Number(name);
  }

  const matches = fontWeightPatterns.filter(fontWeight => fontWeight.pattern.test(name));

  if (matches.length) {
    return String(matches[0].num);
  }
  return name;
}

function isFontWeightProperty(prop) {
  return ['fontWeight'].indexOf(prop) > -1;
}

module.exports.convertCssPropertiesToCamelCase = function (props) {
  const output = {};
  Object.keys(props).forEach((key) => {
    const keyCamel = toCamelCase(key);

    if (isFontWeightProperty(keyCamel)) {
      output[keyCamel] = convertFontWeightToNumber(props[key]);
    } else if (isColorProperty(keyCamel)) {
      output[keyCamel] = convertColorToRGBA(props[key]);
    } else {
      output[keyCamel] = props[key];
    }
  });
  return output;
};

module.exports.deleteDir = function (dir_path) {
  if (fs.existsSync(dir_path)) {
    fs.readdirSync(dir_path).forEach(function (entry) {
      const entry_path = path.join(dir_path, entry);
      if (fs.lstatSync(entry_path).isDirectory()) {
        this.deleteDir(entry_path);
      } else {
        fs.unlinkSync(entry_path);
      }
    });
    fs.rmdirSync(dir_path);
  }
};
