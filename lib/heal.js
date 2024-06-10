const debug = require('debug')('codeceptjs:heal');
const colors = require('chalk');
const Container = require('./container');
const recorder = require('./recorder');
const output = require('./output');
const event = require('./event');

/**
 * @class
 */
class Heal {
  constructor() {
    this.recipes = {};
    this.fixes = [];
    this.prepareFns = [];
    this.contextName = null;
    this.numHealed = 0;
  }

  clear() {
    this.recipes = {};
    this.fixes = [];
    this.prepareFns = [];
    this.contextName = null;
    this.numHealed = 0;
  }

  addRecipe(name, opts = {}) {
    if (!opts.priority) opts.priority = 0;

    if (!opts.fn) throw new Error(`Recipe ${name} should have a function 'fn' to execute`);

    this.recipes[name] = opts;
  }

  connectToEvents() {
    event.dispatcher.on(event.suite.before, (suite) => {
      this.contextName = suite.title;
    });

    event.dispatcher.on(event.test.started, (test) => {
      this.contextName = test.fullTitle();
    });

    event.dispatcher.on(event.test.finished, () => {
      this.contextName = null;
    });
  }

  hasCorrespondingRecipes(step) {
    return matchRecipes(this.recipes, this.contextName)
      .filter(r => !r.steps || r.steps.includes(step.name))
      .length > 0;
  }

  async getCodeSuggestions(context) {
    const suggestions = [];
    const recipes = matchRecipes(this.recipes, this.contextName);

    debug('Recipes', recipes);

    const currentOutputLevel = output.level();
    output.level(0);

    for (const [property, prepareFn] of Object.entries(recipes.map(r => r.prepare).filter(p => !!p).reduce((acc, obj) => ({ ...acc, ...obj }), {}))) {
      if (!prepareFn) continue;

      if (context[property]) continue;
      context[property] = await prepareFn(Container.support());
    }

    output.level(currentOutputLevel);

    for (const recipe of recipes) {
      let snippets = await recipe.fn(context);
      if (!Array.isArray(snippets)) snippets = [snippets];

      suggestions.push({
        name: recipe.name,
        snippets,
      });
    }

    return suggestions.filter(s => !isBlank(s.snippets));
  }

  async healStep(failedStep, error, failureContext = {}) {
    output.debug(`Trying to heal ${failedStep.toCode()} step`);

    Object.assign(failureContext, {
      error,
      step: failedStep,
      prevSteps: failureContext?.test?.steps?.slice(0, -1) || [],
    });

    const suggestions = await this.getCodeSuggestions(failureContext);

    if (suggestions.length === 0) {
      debug('No healing suggestions found');
      throw error;
    }

    output.debug(`Received ${suggestions.length} suggestion${suggestions.length === 1 ? '' : 's'}`);

    debug(suggestions);

    for (const suggestion of suggestions) {
      for (const codeSnippet of suggestion.snippets) {
        try {
          debug('Executing', codeSnippet);
          recorder.catch((e) => {
            debug(e);
          });

          if (typeof codeSnippet === 'string') {
            const I = Container.support('I'); // eslint-disable-line
            await eval(codeSnippet); // eslint-disable-line
          } else if (typeof codeSnippet === 'function') {
            await codeSnippet(Container.support());
          }

          this.fixes.push({
            recipe: suggestion.name,
            test: failureContext?.test,
            step: failedStep,
            snippet: codeSnippet,
          });

          recorder.add('healed', () => output.print(colors.bold.green(`  Code healed successfully by ${suggestion.name}`), colors.gray('(no errors thrown)')));
          this.numHealed++;
          // recorder.session.restore();
          return;
        } catch (err) {
          debug('Failed to execute code', err);
          recorder.ignoreErr(err); // healing did not help
          recorder.catchWithoutStop(err);
          await recorder.promise(); // wait for all promises to resolve
        }
      }
    }
    output.debug(`Couldn't heal the code for ${failedStep.toCode()}`);
    recorder.throw(error);
  }

  static setDefaultHealers() {
    require('./template/heal');
  }
}

const heal = new Heal();

module.exports = heal;

function matchRecipes(recipes, contextName) {
  return Object.entries(recipes)
    .filter(([, recipe]) => !contextName || !recipe.grep || new RegExp(recipe.grep).test(contextName))
    .sort(([, a], [, b]) => a.priority - b.priority)
    .map(([name, recipe]) => {
      recipe.name = name;
      return recipe;
    })
    .filter(r => !!r.fn);
}

function isBlank(value) {
  return (
    value == null
      || (Array.isArray(value) && value.length === 0)
      || (typeof value === 'object' && Object.keys(value).length === 0)
      || (typeof value === 'string' && value.trim() === '')
  );
}
