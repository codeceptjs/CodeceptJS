Feature('PageObject');

Scenario('@ClassPageObject', async ({ classpage }) => {
  await classpage.type('Class Page Type');
  await classpage.purgeDomains();
});

Scenario('@NestedClassPageObject', ({ classnestedpage }) => {
  classnestedpage.type('Nested Class Page Type');
  classnestedpage.purgeDomains();
});
