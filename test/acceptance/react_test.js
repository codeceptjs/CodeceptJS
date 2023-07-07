Feature('React Selectors');

Scenario('props @WebDriver @Puppeteer @Playwright', ({ I }) => {
  I.amOnPage('https://codecept.io/test-react-calculator/');
  I.click('7');
  I.click({ react: 't', props: { name: '=' } });
  I.seeElement({ react: 't', props: { value: '7' } });
  I.click({ react: 't', props: { name: '+' } });
  I.click({ react: 't', props: { name: '3' } });
  I.click({ react: 't', props: { name: '=' } });
  I.seeElement({ react: 't', props: { value: '10' } });
});

Scenario('component name @Puppeteer @Playwright', ({ I }) => {
  I.amOnPage('http://negomi.github.io/react-burger-menu/');
  I.click({ react: 'BurgerIcon' });
  I.waitForVisible('#slide', 10);
  I.click('Alerts');
  I.seeElement({ react: 'Demo' });
});
