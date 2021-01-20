const { getConfig, getTestRoot } = require('./utils');
const Codecept = require('../codecept');
const output = require('../output');
const Container = require('../container');

module.exports = async function (options) {
  const config = getConfig();
  const testRoot = getTestRoot();
  const output = config.output || '.';

  try {
    const codecept = new Codecept(config, options);
    codecept.init(testRoot);
    codecept.loadTests();

    const listOfTests = getListOfTests(codecept.testFiles);

    if (!options.file) {
      printTests(listOfTests);
    } else {
      saveTests(listOfTests, output);
    }
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

function getListOfTests(files) {
  const mocha = Container.mocha();
  mocha.files = files;
  mocha.loadFiles();

  const grep = mocha.options.grep || /.*/;
  const invert = !!mocha.options.invert;

  const listOfTests = {
    suites: [],
  };

  for (const suite of mocha.suite.suites) {
    const suiteNode = {
      title: suite.title,
      path: suite.file || '',
      tests: [],
    };

    for (const test of suite.tests) {
      let match = grep.test(test.fullTitle());

      if (invert) {
        match = !match;
      }

      if (match) {
        const testNode = {
          title: test.title,
          fullTitle: test.fullTitle(),
          skipped: !!test.isPending(),
        };

        suiteNode.tests.push(testNode);
      }
    }

    if (suiteNode.tests.length) {
      listOfTests.suites.push(suiteNode);
    }
  }

  return JSON.stringify(listOfTests, null, '\t');
}

function printTests(listOfTests) {
  output.print(output.styles.debug(`Tests from ${global.codecept_dir}:`));
  output.print();

  output.print(listOfTests);
}

function saveTests(listOfTests, path) {
  const fs = require('fs');

  if (!fs.existsSync(path)) {
    fs.mkdirSync(path, { recursive: true });
  }

  fs.writeFileSync(`${path.replace(/\$/, '')}/list_of_tests.json`, listOfTests);
}
