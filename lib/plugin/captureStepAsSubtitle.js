const { formatTimestamp } = require('subtitle');
const { v4: uuidv4 } = require('uuid');
const fsPromises = require('fs/promises');
const event = require('../event');

let steps = {};
let stepCounter = 1;

let testStartedAt;
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
  event.dispatcher.on(event.test.before, (test) => {
    testStartedAt = Date.now();
    steps = {};
    stepCounter = 1;
  });

  event.dispatcher.on(event.step.started, (step) => {
    const stepStartedAt = Date.now();
    step.id = uuidv4();

    steps[step.id] = {
      start: formatTimestamp(stepStartedAt - testStartedAt),
      startedAt: stepStartedAt,
      counter: stepCounter,
      title: `${step.actor}.${step.name}(${step.args ? step.args.join(',') : ''})`,
    };
    stepCounter += 1;
  });

  event.dispatcher.on(event.step.finished, (step) => {
    if (step.id) {
      steps[step.id].end = formatTimestamp(Date.now() - testStartedAt);
    }
  });

  event.dispatcher.on(event.test.after, async (test) => {
    if (test.artifacts.video) {
      const sorted = Object.values(steps);
      sorted.sort((stepA, stepB) => {
        return stepA.startedAt - stepB.startedAt;
      });

      let subtitle = '';

      sorted.forEach((step, index) => {
        subtitle = `${subtitle}${index + 1}
${step.start} --> ${step.end}
${step.title}

`;
      });
      const videoPath = require('path').dirname(test.artifacts.video);
      const videoFileName = require('path').basename(test.artifacts.video, '.webm');

      await fsPromises.writeFile(`${videoPath}/${videoFileName}.srt`, subtitle);
      test.artifacts.subtitle = `${videoPath}/${videoFileName}.srt`;
    }
  });
};
