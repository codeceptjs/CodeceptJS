// @ts-nocheck
const fs = require('fs');
const path = require('path');
const semver = require('semver');
const util = require('util');
const mkdirp = require('mkdirp');

const output = require('../output');
const { fileExists, beautify } = require('../utils');


// alias to deep merge
module.exports.deepMerge = require('../utils').deepMerge;

module.exports.getConfig = function (configFile) {
  try {
    return require('../config').load(configFile);
  } catch (err) {
    fail(err.stack);
  }
};

function getTestRoot(currentPath) {
  if (!currentPath) currentPath = '.';
  if (!path.isAbsolute(currentPath)) currentPath = path.join(process.cwd(), currentPath);
  currentPath = fs.lstatSync(currentPath).isDirectory() || !path.extname(currentPath) ? currentPath : path.dirname(currentPath);
  return currentPath;
}
module.exports.getTestRoot = getTestRoot;

function fail(msg) {
  output.error(msg);
  process.exit(1);
}

module.exports.fail = fail;

function updateConfig(testsPath, config, key) {
  const configFile = path.join(testsPath, 'codecept.conf.js');
  if (!fileExists(configFile)) {
    console.log();
    console.log(`${output.colors.bold.red('codecept.conf.js config can\'t be updated automatically')}`);
    console.log('Please update it manually:');
    console.log();
    console.log(`${key}: ${config[key]}`);
    console.log();
    return;
  }
  console.log(`${output.colors.yellow('Updating configuration file...')}`);
  return fs.writeFileSync(configFile, beautify(`exports.config = ${util.inspect(config, false, 4, false)}`), 'utf-8');
}

module.exports.updateConfig = updateConfig;

function safeFileWrite(file, contents) {
  if (fileExists(file)) {
    output.error(`File ${file} already exist, skipping...`);
    return false;
  }
  fs.writeFileSync(file, contents);
  return true;
}

module.exports.safeFileWrite = safeFileWrite;

module.exports.satisfyNodeVersion = (
  version,
  failureMessage = `Required Node version: ${version}`,
) => {
  if (!semver.satisfies(process.version, version)) {
    fail(failureMessage);
  }
};

module.exports.captureStream = (stream) => {
  let oldStream;
  let buffer = '';

  return {
    startCapture() {
      buffer = '';
      oldStream = stream.write.bind(stream);
      stream.write = chunk => (buffer += chunk);
    },
    stopCapture() {
      if (oldStream !== undefined) stream.write = oldStream;
    },
    getData: () => buffer,
  };
};

module.exports.printError = (err) => {
  output.print('');
  output.error(err.message);
  output.print('');
  output.print(output.colors.grey(err.stack.replace(err.message, '')));
};

module.exports.createOutputDir = (config, testRoot) => {
  let outputDir;
  if (path.isAbsolute(config.output)) outputDir = config.output;
  else outputDir = path.join(testRoot, config.output);

  if (!fileExists(outputDir)) {
    output.print(`creating output directory: ${outputDir}`);
    mkdirp.sync(outputDir);
  }
};

module.exports.transform = (source) => {
  const j = require('jscodeshift');
  let newSource = j(source).find(j.ExpressionStatement, {
    expression: {
      callee: {
        name: 'Scenario',
      },
    },
  });

  if (newSource.paths().length > 0) {
    newSource = j(source).find(j.ExpressionStatement, {
      expression: {
        callee: {
          name: 'Scenario',
        },
      },
    })
      .find(j.ArrowFunctionExpression)
      // eslint-disable-next-line array-callback-return
      .filter(p => {
        const root = p.value;
        for (const param of root.params) {
          if (param.type === 'ObjectPattern') {
            // console.log(param);
          }
          return param.type !== 'ObjectPattern';
        }
      })
      .replaceWith(p => {
        const root = p.value;
        const firstParam = root.params[0];
        const lastParam = root.params[root.params.length - 1];

        firstParam.name = `{ ${firstParam.name}`;
        lastParam.name = `${lastParam.name} }`;
        return root;
      });
  } else {
    newSource = j(source).find(j.ExpressionStatement, {
      expression: {
        callee: {
          property: {
            name: 'Scenario',
          },
        },
      },
    })
      .find(j.ArrowFunctionExpression)
    // eslint-disable-next-line array-callback-return
      .filter(p => {
        const root = p.value;
        for (const param of root.params) {
          if (param.type === 'ObjectPattern') {
            // console.log(param);
          }
          return param.type !== 'ObjectPattern';
        }
      })
      .replaceWith(p => {
        const root = p.value;
        const firstParam = root.params[0];
        const lastParam = root.params[root.params.length - 1];

        firstParam.name = `{ ${firstParam.name}`;
        lastParam.name = `${lastParam.name} }`;
        return root;
      });
  }

  return newSource.toSource();
};
