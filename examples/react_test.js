Feature('React Apps');

Data([{ a: 1, toString: () => 'a' }, { b: 2, toString: () => 'b' }]).Scenario('try react app', ({ I }) => {
  I.amOnPage('https://codecept.io/test-react-calculator/');
  I.click('7');
  I.seeElement({ react: 't', props: { name: '5' } });
  I.click('button', { react: 't', props: { name: '2' } });
  I.click('button', { react: 't', props: { name: '+' } });
  I.click('button', { react: 't', props: { name: '9' } });
  I.click('button', { react: 't', props: { name: '=' } });
  I.seeElement({ react: 't', props: { value: '81' } });
});
