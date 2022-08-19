Feature('PageObject');

Scenario('@ClassPageObject', async ({ classpage }) => {
  await classpage.type('Class Page Type');
  await classpage.purgeDomains();
});

Scenario('@NestedClassPageObject', async ({ classnestedpage, I }) => {
  await classnestedpage.type('Nested Class Page Type');
  classnestedpage.purgeDomains();
});
