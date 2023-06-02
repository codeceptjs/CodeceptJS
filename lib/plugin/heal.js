const debug = require('debug')('codeceptjs:heal');
const colors = require('chalk');
const { Configuration, OpenAIApi } = require('openai');
const Container = require('../container');
const store = require('../store');
const recorder = require('../recorder');
const event = require('../event');
const output = require('../output');
const { methodsOfObject } = require('../utils');
const supportedHelpers = require('./standardActingHelpers');
const { interactiveHTML } = require('../html');

let openai;
let currentTest = null;
const enableHeal = false;
let healedSteps = 0;

const defaultConfig = {
  ignoredSteps: [],
  healLimit: 1,
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

module.exports = function (config = {}) {
  if (!process.env.OPENAI_API_KEY) return;

  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });

  openai = new OpenAIApi(configuration);

  config = Object.assign(defaultConfig, config);

  const when = (err) => {
    if (!enableHeal) return false;
    const store = require('../store');
    if (store.debugMode) return false;
    return true;
  };

  config.when = when;

  event.dispatcher.on(event.test.before, (test) => {
    currentTest = test;
    healedSteps = 0;
  });

  event.dispatcher.on(event.step.before, (step) => {
    // we can heal only actions, not assertions
    if (!config.healSteps.includes(step.name)) return;

    recorder.catchWithoutStop(async (err) => {
      const test = currentTest;

      if (healedSteps >= config.healLimit) {
        output.print(colors.bold.red(`Can't heal more than ${config.healLimit} steps in a test`));
        output.print('Entire flow can be broken, please check it manually');
        output.print('or increase healing limit in plugin config');

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

      await tryToHeal(step, err, html);
      recorder.session.restore();
    });
  });

  async function checkForErrors(html) {
    const minifiedHtml = interactiveHTML(html);

    debug(minifiedHtml);

    const messages = [
      { role: 'user', content: 'As a test automation engineer I am testing web application.' },
      { role: 'user', content: `I performed actions ${currentTest.steps.join(', ')} on a page` },
      { role: 'user', content: 'Could you check HTML if it contains errors or warning messages' },
      { role: 'user', content: `Here is html code of a page: \n\n${minifiedHtml}\n\n` },
      { role: 'user', content: 'If there is error messages on a page please print it' },
    ];

    try {
      const completion = await openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages,
      });

      const response = completion.data.choices[0].message.content;
      output.log(response);
    } catch (err) {
      console.log('OpenAI request failed', err.message);
      console.error(err.response.data.error);
    }
  }

  async function tryToHeal(failedStep, err, html) {
    output.debug(`Running OpenAPI to heal ${failedStep.toCode()} step`);

    const minifiedHtml = interactiveHTML(html);

    debug(minifiedHtml);

    const messages = [
      { role: 'user', content: 'As a test automation engineer I am testing web application using CodeceptJS.' },
      { role: 'user', content: `I want to heal a test that fails. Here is the list of executed steps: ${currentTest.steps.join(', ')}` },
      { role: 'user', content: `Here is the error message: ${err.message}` },
      { role: 'user', content: `Here is HTML code of a page where the failure has happened: \n\n${minifiedHtml}` },
      { role: 'user', content: `Propose how to adjust ${failedStep.toCode()} step to fix the test.` },
      { role: 'user', content: 'Use locators in order of preference: semantic locator by text, CSS, XPath. Use codeblocks marked with ```.' },
    ];

    const I = Container.support('I');

    try {
      const completion = await openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages,
      });

      const response = completion.data.choices[0].message.content;

      // Regular expression pattern to match code snippets
      const codeSnippetPattern = /```(?:javascript|js|typescript|ts)?\n([\s\S]+?)\n```/g;

      // Array to store extracted code snippets
      const codeSnippets = [];

      // Iterate over matches and extract code snippets
      let match;
      while ((match = codeSnippetPattern.exec(response)) !== null) {
        codeSnippets.push(match[1]);
      }

      // output.log(response);
      output.debug(`Received ${codeSnippets.length} proposals from OpenAI`);

      for (const codeSnippet of codeSnippets) {
        try {
          debug('Executing', codeSnippet);
          await eval(codeSnippet); // eslint-disable-line
          output.print(colors.bold.green('Code healed successfully'));
          output.print('Suggested to replace the failed code with:');
          output.print(colors.red(`- ${failedStep.toCode()}`));
          output.print(colors.green(`+ ${codeSnippet}`));
          output.print(failedStep.line());
          healedSteps++;
          break;
        } catch (err) {
          debug('Failed to execute code', err);
        }
      }
    } catch (err) {
      console.log('OpenAI request failed', err.message);
    }
  }
};
