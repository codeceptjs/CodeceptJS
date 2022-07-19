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
 *   __`Given`;
 *   const projectId = await I.have('project');
 *
 *   __`When`;
 *   projectPage.update(projectId, { title: 'new title' });
 *
 *   __`Then`;
 *   projectPage.open(projectId);
 *   I.see('new title', 'h1');
 * })
 * ```
 * Steps prefixed with `__` will be printed as nested steps in `--steps` output:
 *
 * ```
 *   Given
 *     I have "project"
 *   When
 *     projectPage update
 *   Then
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
 * * `registerGlobal` - (default: false) register `__` template literal function globally. You can override function global name by providing a name as a value.
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
 * Then inside a test import a comment function from a plugin.
 * For instance, you can prepare Given/When/Then functions to use them inside tests:
 *
 * ```js
 * // inside a test
 * const step = codeceptjs.container.plugins('commentStep');
 *
 * const Given = () => step`Given`;
 * const When = () => step`When`;
 * const Then = () => step`Then`;
 * ```
 *
 * Scenario('project update test', async (I) => {
 *   Given();
 *   const projectId = await I.have('project');
 *
 *   When();
 *   projectPage.update(projectId, { title: 'new title' });
 *
 *   Then();
 *   projectPage.open(projectId);
 *   I.see('new title', 'h1');
 * });
 * ```
 */
module.exports = function (config) {
  event.dispatcher.on(event.test.started, () => {
    currentCommentStep = null;
  });

  event.dispatcher.on(event.step.started, (step) => {
    if (currentCommentStep) {
      const metaStep = getRootMetaStep(step);

      if (metaStep !== currentCommentStep) {
        metaStep.metaStep = currentCommentStep;
      }
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
