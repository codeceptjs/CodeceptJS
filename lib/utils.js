import fs from 'fs';
import os from 'os';
import path from 'path';
import getFunctionArguments from 'fn-args';
import deepClone from 'lodash.clonedeep';
import merge from 'lodash.merge';
import { createHash } from 'crypto';
import format from 'js-beautify';
import importSync from 'import-sync';
import { convertColorToRGBA, isColorProperty } from './colorUtils.js';

const __dirname = path.resolve();

export function deepMerge(target, source) {
  return merge(target, source);
}

export const genTestId = (test) => {
  return createHash('sha256').update(test.fullTitle()).digest('base64')
    .slice(0, -2);
};

export { deepClone };

export const isGenerator = function (fn) {
  return fn.constructor.name === 'GeneratorFunction';
};

export const isFunction = function (fn) {
  return typeof fn === 'function';
};

export function isAsyncFunction(fn) {
  if (!fn) return false;
  return fn[Symbol.toStringTag] === 'AsyncFunction';
}

export const fileExists = function (filePath) {
  return fs.existsSync(filePath);
};

export const isFile = function (filePath) {
  let filestat;
  try {
    filestat = fs.statSync(filePath);
  } catch (err) {
    if (err.code === 'ENOENT') return false;
  }
  if (!filestat) return false;
  return filestat.isFile();
};

export const getParamNames = function (fn) {
  if (fn.isSinonProxy) return [];
  return getFunctionArguments(fn);
};

export const installedLocally = function () {
  return path.resolve(`${__dirname}/../`).indexOf(process.cwd()) === 0;
};

export const methodsOfObject = function (obj, className) {
  const methods = [];

  const standard = [
    'constructor',
    'toString',
    'toLocaleString',
    'valueOf',
    'hasOwnProperty',
    'bind',
    'apply',
    'call',
    'isPrototypeOf',
    'propertyIsEnumerable',
  ];

  function pushToMethods(prop) {
    try {
      if (!isFunction(obj[prop]) && !isAsyncFunction(obj[prop])) return;
    } catch (err) { // can't access property
      return;
    }
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

export const template = function (template, data) {
  return template.replace(/{{([^{}]*)}}/g, (a, b) => {
    const r = data[b];
    if (r === undefined) return '';
    return r.toString();
  });
};

/**
 * Make first char uppercase.
 * @param {string} str
 * @returns {string}
 */
export const ucfirst = function (str) {
  return str.charAt(0).toUpperCase() + str.substr(1);
};

/**
 * Make first char lowercase.
 * @param {string} str
 * @returns {string}
 */
export const lcfirst = function (str) {
  return str.charAt(0).toLowerCase() + str.substr(1);
};

export const chunkArray = function (arr, chunk) {
  let i;
  let j;
  const tmp = [];
  for (i = 0, j = arr.length; i < j; i += chunk) {
    tmp.push(arr.slice(i, i + chunk));
  }
  return tmp;
};

export const clearString = function (str) {
  if (!str) return '';
  /* Replace forbidden symbols in string
   */
  if (str.endsWith('.')) {
    str = str.slice(0, -1);
  }
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
    .replace(/\*/g, '^')
    .replace(/'/g, '');
};

export const decodeUrl = function (url) {
  /* Replace forbidden symbols in string
   */
  return decodeURIComponent(decodeURIComponent(decodeURIComponent(url)));
};

export const xpathLocator = {
  /**
   * @param {string} string
   * @returns {string}
   */
  literal: (string) => {
    if (string.indexOf("'") > -1) {
      string = string.split("'", -1).map(substr => `'${substr}'`).join(',"\'",');
      return `concat(${string})`;
    }
    return `'${string}'`;
  },

  /**
   * Combines passed locators into one disjunction one.
   * @param {string[]} locators
   * @returns {string}
   */
  combine: locators => locators.join(' | '),
};

export default {
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

export function grepLines(array, startString, endString) {
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
}

function toCamelCase(name) {
  if (typeof name !== 'string') {
    return name;
  }
  return name.replace(/-(\w)/gi, (_word, letter) => {
    return letter.toUpperCase();
  });
}
export { toCamelCase };

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
  return prop === 'fontWeight';
}

export const convertCssPropertiesToCamelCase = function (props) {
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

export const deleteDir = function (dir_path) {
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

/**
 * Returns absolute filename to save screenshot.
 * @param fileName {string} - filename.
 */
export const screenshotOutputFolder = function (fileName) {
  const fileSep = path.sep;

  if (!fileName.includes(fileSep) || fileName.includes('record_')) {
    return path.resolve(global.output_dir, fileName);
  }
  return path.resolve(global.codecept_dir, fileName);
};

export const beautify = function (code) {
  return format(code, { indent_size: 2, space_in_empty_paren: true });
};

function shouldAppendBaseUrl(url) {
  return !/^\w+\:\/\//.test(url);
}

function trimUrl(url) {
  const firstChar = url.substr(1);
  if (firstChar === '/') {
    url = url.slice(1);
  }
  return url;
}

function joinUrl(baseUrl, url) {
  return shouldAppendBaseUrl(url) ? `${baseUrl}/${trimUrl(url)}` : url;
}

export const appendBaseUrl = function (baseUrl = '', oneOrMoreUrls) {
  if (typeof baseUrl !== 'string') {
    throw new Error(`Invalid value for baseUrl: ${baseUrl}`);
  }
  if (!(typeof oneOrMoreUrls === 'string' || Array.isArray(oneOrMoreUrls))) {
    throw new Error(`Expected type of Urls is 'string' or 'array', Found '${typeof oneOrMoreUrls}'.`);
  }
  // Remove '/' if it's at the end of baseUrl
  const lastChar = baseUrl.substr(-1);
  if (lastChar === '/') {
    baseUrl = baseUrl.slice(0, -1);
  }

  if (!Array.isArray(oneOrMoreUrls)) {
    return joinUrl(baseUrl, oneOrMoreUrls);
  }
  return oneOrMoreUrls.map(url => joinUrl(baseUrl, url));
};

/**
 * Recursively search key in object and replace it's value.
 *
 * @param {*} obj source object for replacing
 * @param {string} key key to search
 * @param {*} value value to set for key
 */
export const replaceValueDeep = function replaceValueDeep(obj, key, value) {
  if (!obj) return;

  if (obj instanceof Array) {
    for (const i in obj) {
      replaceValueDeep(obj[i], key, value);
    }
  }

  if (Object.prototype.hasOwnProperty.call(obj, key)) {
    obj[key] = value;
  }

  if (typeof obj === 'object' && obj !== null) {
    const children = Object.values(obj);
    for (const child of children) {
      replaceValueDeep(child, key, value);
    }
  }
  return obj;
};

export const ansiRegExp = function ({ onlyFirst = false } = {}) {
  const pattern = [
    '[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:[a-zA-Z\\d]*(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)',
    '(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))',
  ].join('|');

  return new RegExp(pattern, onlyFirst ? undefined : 'g');
};

export const tryOrDefault = function (fn, defaultValue) {
  try {
    return fn();
  } catch (_) {
    return defaultValue;
  }
};

function normalizeKeyReplacer(match, prefix, key, suffix, offset, string) {
  if (typeof key !== 'string') {
    return string;
  }
  const normalizedKey = key.charAt(0).toUpperCase() + key.substr(1).toLowerCase();
  let position = '';
  if (typeof prefix === 'string') {
    position = prefix;
  } else if (typeof suffix === 'string') {
    position = suffix;
  }
  return normalizedKey + position.charAt(0).toUpperCase() + position.substr(1).toLowerCase();
}

/**
 * Transforms `key` into normalized to OS key.
 * @param {string} key
 * @returns {string}
 */
export const getNormalizedKeyAttributeValue = function (key) {
  // Use operation modifier key based on operating system
  key = key.replace(/(Ctrl|Control|Cmd|Command)[ _]?Or[ _]?(Ctrl|Control|Cmd|Command)/i, os.platform() === 'darwin' ? 'Meta' : 'Control');
  // Selection of keys (https://www.w3.org/TR/uievents-key/#named-key-attribute-values)
  // which can be written in various ways and should be normalized.
  // For example 'LEFT ALT', 'ALT_Left', 'alt left' or 'LeftAlt' will be normalized as 'AltLeft'.
  key = key.replace(/^\s*(?:(Down|Left|Right|Up)[ _]?)?(Arrow|Alt|Ctrl|Control|Cmd|Command|Meta|Option|OS|Page|Shift|Super)(?:[ _]?(Down|Left|Right|Up|Gr(?:aph)?))?\s*$/i, normalizeKeyReplacer);
  // Map alias to corresponding key value
  key = key.replace(/^(Add|Divide|Decimal|Multiply|Subtract)$/, 'Numpad$1');
  key = key.replace(/^AltGr$/, 'AltGraph');
  key = key.replace(/^(Cmd|Command|Os|Super)/, 'Meta');
  key = key.replace('Ctrl', 'Control');
  key = key.replace('Option', 'Alt');
  key = key.replace(/^(NumpadComma|Separator)$/, 'Comma');
  return key;
};

const modifierKeys = [
  'Alt', 'AltGraph', 'AltLeft', 'AltRight',
  'Control', 'ControlLeft', 'ControlRight',
  'Meta', 'MetaLeft', 'MetaRight',
  'Shift', 'ShiftLeft', 'ShiftRight',
];

export { modifierKeys };

export const isModifierKey = function (key) {
  return modifierKeys.includes(key);
};

export const requireWithFallback = function (...packages) {
  const exists = function (pkg) {
    try {
      importSync(pkg);
    } catch (e) {
      return false;
    }

    return true;
  };

  for (const pkg of packages) {
    if (exists(pkg)) {
      return importSync(pkg);
    }
  }

  throw new Error(`Cannot find modules ${packages.join(',')}`);
};

export const isNotSet = function (obj) {
  if (obj === null) return true;
  if (obj === undefined) return true;
  return false;
};

export const emptyFolder = async (directoryPath) => {
  importSync('child_process').execSync(`rm -rf ${directoryPath}/*`);
};

export const printObjectProperties = (obj) => {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  let result = '';
  for (const [key, value] of Object.entries(obj)) {
    result += `${key}: "${value}"; `;
  }

  return `{${result}}`;
};

export const normalizeSpacesInString = (string) => {
  return string.replace(/\s+/g, ' ');
};
