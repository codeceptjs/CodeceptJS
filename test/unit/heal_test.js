const expect = require('chai').expect;
const heal = require('../../lib/heal');
const recorder = require('../../lib/recorder');
const Step = require('../../lib/step');

describe('heal', () => {
  beforeEach(() => {
    heal.clear();
    recorder.reset();
  });

  it('should collect recipes', () => {
    heal.addRecipe('reload', {
      priority: 10,
      steps: ['click'],
      fn: async () => {
        return ({ I }) => {
          I.refreshPage();
        };
      },
    });

    expect(heal.hasCorrespondingRecipes({ name: 'click' })).to.be.true;
  });

  it('should have corresponding recipes', () => {
    heal.recipes = { test: { steps: ['step1', 'step2'], fn: () => {} } };
    heal.contextName = 'TestSuite';
    const result = heal.hasCorrespondingRecipes({ name: 'step1' });
    expect(result).to.be.true;
  });

  it('should get code suggestions', async () => {
    heal.recipes = { test: { prepare: { prop: () => 'value' }, fn: () => 'snippet' } };
    heal.contextName = 'TestSuite';
    const suggestions = await heal.getCodeSuggestions({});
    expect(suggestions).to.deep.equal([{ name: 'test', snippets: ['snippet'] }]);
  });

  it('should heal failed steps', async () => {
    let isHealed = false;
    heal.addRecipe('reload', {
      priority: 10,
      steps: ['click'],
      fn: async () => {
        return () => {
          isHealed = true;
        };
      },
    });

    await heal.healStep(new Step(null, 'click'));

    expect(isHealed).to.be.true;
  });
});
