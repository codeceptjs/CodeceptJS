const debug = require('debug')('codeceptjs:heal');
const colors = require('chalk');
const Container = require('../container');
const AiAssistant = require('../ai');
const recorder = require('../recorder');
const event = require('../event');
const output = require('../output');
const supportedHelpers = require('./standardActingHelpers');

const defaultConfig = {
  healLimit: 2,
  healSteps: [
    'click',
    'fillField',
    'appendField',
    'selectOption',
    'attachFile',
    'checkOption',
    'uncheckOption',
    'doubleClick',
  ],
};

/**
 * Self-healing tests with OpenAI.
 *
 * This plugin is experimental and requires OpenAI API key.
 *
 * To use it you need to set OPENAI_API_KEY env variable and enable plugin inside the config.
 *
 * ```js
 * plugins: {
 *   heal: {
 *    enabled: true,
 *   }
 * }
 * ```
 *
 * More config options are available:
 *
 * * `healLimit` - how many steps can be healed in a single test (default: 2)
 * * `healSteps` - which steps can be healed (default: all steps that interact with UI, see list below)
 *
 * Steps to heal:
 *
 * * `click`
 * * `fillField`
 * * `appendField`
 * * `selectOption`
 * * `attachFile`
 * * `checkOption`
 * * `uncheckOption`
 * * `doubleClick`
 *
 */
module.exports = function (config = {}) {
  const aiAssistant = new AiAssistant();

  let currentTest = null;
  let currentStep = null;
  let healedSteps = 0;

  const healSuggestions = [];

  config = Object.assign(defaultConfig, config);

  event.dispatcher.on(event.test.before, (test) => {
    currentTest = test;
    healedSteps = 0;
  });

  event.dispatcher.on(event.step.started, step => currentStep = step);

  event.dispatcher.on(event.step.before, () => {
    const store = require('../store');
    if (store.debugMode) return;

    recorder.catchWithoutStop(async (err) => {
      if (!aiAssistant.isEnabled) throw err;
      if (!currentStep) throw err;
      if (!config.healSteps.includes(currentStep.name)) throw err;
      const test = currentTest;

      if (healedSteps >= config.healLimit) {
        output.print(colors.bold.red(`Can't heal more than ${config.healLimit} step(s) in a test`));
        output.print('Entire flow can be broken, please check it manually');
        output.print('or increase healing limit in heal plugin config');

        throw err;
      }

      recorder.session.start('heal');
      const helpers = Container.helpers();
      let helper;

      for (const helperName of supportedHelpers) {
        if (Object.keys(helpers).indexOf(helperName) > -1) {
          helper = helpers[helperName];
        }
      }

      if (!helper) throw err; // no helpers for html

      const step = test.steps[test.steps.length - 1];
      debug('Self-healing started', step.toCode());

      const currentOutputLevel = output.level();
      output.level(0);
      const html = await helper.grabHTMLFrom('body');
      output.level(currentOutputLevel);

      if (!html) throw err;

      aiAssistant.setHtmlContext(html);
      await tryToHeal(step, err);
      recorder.session.restore();
    });
  });

  event.dispatcher.on(event.all.result, () => {
    if (!healSuggestions.length) return;

    const { print } = output;

    print('');
    print('===================');
    print(colors.bold.green('Self-Healing Report:'));

    print(`${colors.bold(healSuggestions.length)} step(s) were healed by AI`);

    let i = 1;
    print('');
    print('Suggested changes:');
    print('');

    for (const suggestion of healSuggestions) {
      print(`${i}. To fix ${colors.bold.blue(suggestion.test.title)}`);
      print('Replace the failed code with:');
      print(colors.red(`- ${suggestion.step.toCode()}`));
      print(colors.green(`+ ${suggestion.snippet}`));
      print(suggestion.step.line());
      print('');
      i++;
    }
  });

  async function tryToHeal(failedStep, err) {
    output.debug(`Running OpenAI to heal ${failedStep.toCode()} step`);

    const codeSnippets = await aiAssistant.healFailedStep(failedStep, err, currentTest);

    output.debug(`Received ${codeSnippets.length} suggestions from OpenAI`);
    const I = Container.support('I'); // eslint-disable-line

    for (const codeSnippet of codeSnippets) {
      try {
        debug('Executing', codeSnippet);
        await eval(codeSnippet); // eslint-disable-line

        healSuggestions.push({
          test: currentTest,
          step: failedStep,
          snippet: codeSnippet,
        });

        output.print(colors.bold.green('  Code healed successfully'));
        healedSteps++;
        return;
      } catch (err) {
        debug('Failed to execute code', err);
      }
    }

    output.debug(`Couldn't heal the code for ${failedStep.toCode()}`);
  }
};
