import debug from 'debug';
import colors from 'chalk';
import Container from '../container.js';
import AiAssistant from '../ai.cjs';
import recorder from '../recorder.js';
import * as event from '../event.js';
import * as output from '../output.js';
import supportedHelpers from './standardActingHelpers.js';

debug('codeceptjs:heal');
const heal = require('../heal');
const store = require('../store');

const defaultConfig = {
  healLimit: 2,
};

/**
 * Self-healing tests with AI.
 *
 * Read more about heaking in [Self-Healing Tests](https://codecept.io/heal/)
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
 *
 */

export default function (config = {}) {
  if (store.store.debugMode && !process.env.DEBUG) {
    event.dispatcher.on(event.test.failed, () => {
      output.output.plugin('heal', 'Healing is disabled in --debug mode, use DEBUG="codeceptjs:heal" to enable it in debug mode');
    });
    return;
  }

  let currentTest = null;
  let currentStep = null;
  let healedSteps = 0;
  let caughtError;
  let healTries = 0;
  let isHealing = false;

  config = Object.assign(defaultConfig, config);

  event.dispatcher.on(event.test.before, (test) => {
    currentTest = test;
    healedSteps = 0;
    caughtError = null;
  });

  event.dispatcher.on(event.step.started, step => currentStep = step);

  event.dispatcher.on(event.step.after, (step) => {
    if (isHealing) return;
    if (store.store.debugMode) return;
    if (healTries >= config.healLimit) return; // out of limit

    if (!heal.hasCorrespondingRecipes(step)) return;

    recorder.catchWithoutStop(async (err) => {
      isHealing = true;
      if (caughtError === err) throw err; // avoid double handling
      caughtError = err;

      const test = currentTest;

      recorder.session.start('heal');

      debug('Self-healing started', step.toCode());

      await heal.healStep(step, err, { test });

      healTries++;

      recorder.add('close healing session', () => {
        recorder.reset();
        recorder.session.restore('heal');
        recorder.ignoreErr(err);
      });
      await recorder.promise();

      isHealing = false;
    });
  });

  event.dispatcher.on(event.all.result, () => {
    if (!heal.fixes?.length) return;

    const { print } = output;

    print('');
    print('===================');
    print(colors.bold.green('Self-Healing Report:'));

    print(`${colors.bold(heal.fixes.length)} ${heal.fixes.length === 1 ? 'step was' : 'steps were'} healed`);

    const suggestions = heal.fixes.filter(fix => fix.recipe && heal.recipes[fix.recipe].suggest);

    if (!suggestions.length) return;

    let i = 1;
    print('');
    print('Suggested changes:');
    print('');

    for (const suggestion of suggestions) {
      print(`${i}. To fix ${colors.bold.magenta(suggestion.test?.title)}`);
      print('  Replace the failed code:', colors.gray(`(suggested by ${colors.bold(suggestion.recipe)})`));
      print(colors.red(`- ${suggestion.step.toCode()}`));
      print(colors.green(`+ ${suggestion.snippet}`));
      print(suggestion.step.line());
      print('');
      i++;
    }
  });

  async function tryToHeal(failedStep, err) {
    output.output.debug(`Running OpenAI to heal ${failedStep.toCode()} step`);

    const codeSnippets = await AiAssistant.healFailedStep(failedStep, err, currentTest);

    output.output.debug(`Received ${codeSnippets.length} suggestions from OpenAI`);
    const I = Container.support('I'); // eslint-disable-line

    for (const codeSnippet of codeSnippets) {
      try {
        debug('Executing', codeSnippet);
        recorder.catch((e) => {
          console.log(e);
        });
        await eval(codeSnippet); // eslint-disable-line

        let healSuggestions = [];
        healSuggestions.push({
          test: currentTest,
          step: failedStep,
          snippet: codeSnippet,
        });

        recorder.add('healed', () => output.print(colors.bold.green('  Code healed successfully')));
        healedSteps++;
        return;
      } catch (err) {
        debug('Failed to execute code', err);
        recorder.ignoreErr(err); // healing ded not help
        // recorder.catch(() => output.print(colors.bold.red('  Failed healing code')));
      }
    }

    output.output.debug(`Couldn't heal the code for ${failedStep.toCode()}`);
  }
  return recorder.promise();
}
