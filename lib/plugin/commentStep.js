const event = require('../event');
const recorder = require('../recorder');
const { MetaStep } = require('../step');

let currentCommentStep;

const defaultGlobalName = '__';

/**
 * Add descriptive nested steps for your tests:
 *
 * ```js
 * Scenario('project update test', async (I) => {
 *   __`Prepare project`;
 *   const projectId = await I.createProject();
 *
 *   __`Change project`;
 *   projectPage.update(projectId, { title: 'new title' });
 *
 *   __`Check project`;
 *   projectPage.open(projectId);
 *   I.see('new title', 'h1');
 * })
 * ```
 * Steps prefixed with `__` will be printed as nested steps in `--steps` output:
 *
 * ```
 *   Prepare project
 *     I create project
 *   Change project
 *     projectPage update
 *   Check project
 *     projectPage open
 *     I see "new title", "h1"
 * ```
 *
 * Also those steps will be exported to allure reports.
 *
 * This plugin can be used
 *
 * ### Config
 *
 * * `enabled` - (default: false) enable a plugin
 * * `regusterGlobal` - (default: false) register `__` template literal function globally. You can override function global name by providing a name as a value.
 *
 * ### Examples
 *
 * Registering `__` globally:
 *
 * ```js
 * plugins: {
 *   commentStep: {
 *     enabled: true,
 *     registerGlobal: true
 *   }
 * }
 * ```
 *
 * Registering `Step` globally:
 * ```js
 * plugins: {
 *   commentStep: {
 *     enabled: true,
 *     registerGlobal: 'Step'
 *   }
 * }
 * ```
 *
 * Using only local function names:
 * ```js
 * plugins: {
 *   commentStep: {
 *     enabled: true
 *   }
 * }
 * ```
 * Then inside a test import a comment function from a plugin:
 *
 * ```js
 * // inside a test
 * const Step = codeceptjs.container.plugins('commentStep');
 * ```
 *
 */
module.exports = function (config) {
  event.dispatcher.on(event.test.started, (test) => {
    currentCommentStep = null;
  });

  event.dispatcher.on(event.step.started, (step) => {
    if (currentCommentStep) {
      const metaStep = getRootMetaStep(step);
      metaStep.metaStep = currentCommentStep;
    }
  });

  if (config.registerGlobal) {
    if (config.registerGlobal === true) {
      config.registerGlobal = defaultGlobalName;
    }
    global[config.registerGlobal] = setCommentString;
  }

  return setCommentString;
};

function getRootMetaStep(step) {
  if (step.metaStep) return getRootMetaStep(step.metaStep);
  return step;
}

function setCommentString(string) {
  recorder.add('set comment metastep', () => {
    currentCommentStep = new MetaStep(String.raw(string), '');
  });
}
