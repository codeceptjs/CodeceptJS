
const getConfig = require('./utils').getConfig;
const getTestRoot = require('./utils').getTestRoot;
const transform = require('./utils').transform;

module.exports = function (test, options) {
  const configFile = options.config;

  const config = getConfig(configFile);
  const testRoot = getTestRoot(configFile);
  const newSource = transform();
  console.log(newSource);
};


/**
JS File:
1. Scenario('title', (I, pageObject) => {})
2. Scenario('title', async (I, pageObject) => {})
3. Scenario('title', async (pageObject, pageObject2) => {})
4. Scenario('title', {...options}, async (pageObject, pageObject2) => {})
5. Scenario('title', async () => {})
6. Scenario('title', () => {})
7. Scenario.todo
8. Scenario.skip
9. Data([]).Scenario('title', (I, pageObject, current) => {})

TS Files:
1. Scenario('title', (I: CodeceptJS.I) => {})
2. Scenario('title', (I: CodeceptJS.I, pageObject: CodeceptJS.pageObject) => {})
 */


/** Old Example
       // root.params.forEach(param => {
      // console.log(param);
      // param.name = `{ ${param.name}`;
      // const key = j.identifier(param.name);
      // const value = j.identifier(param.name);
      // const property = j.objectProperty(key, value);
      // property.shorthand = true;
      // objPatternProperties.push(property);
      // });
      // const objPattern = j.objectPattern(objPatternProperties);
      // root.params = [objPattern];
  */
