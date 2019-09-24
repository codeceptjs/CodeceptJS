Feature('PageObject');

Scenario('@ClassPageObject', async (I, classpage) => {
  await classpage.type('Class Page Type');
  await classpage.purgeDomains();
});


Scenario('@NestedClassPageObject', (I, classnestedpage) => {
  classnestedpage.type('Nested Class Page Type');
  classnestedpage.purgeDomains();
});
