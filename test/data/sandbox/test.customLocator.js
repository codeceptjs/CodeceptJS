const { I } = inject();
Feature('Custom Locator');

Scenario('no error with dry-mode', () => {
  I.seeElement(locate('$COURSE').find('a'));
});
