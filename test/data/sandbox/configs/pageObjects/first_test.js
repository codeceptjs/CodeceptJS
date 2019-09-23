Feature('PageObject');

Scenario('@ClassPageObject', async (I, classpage) => {
  await classpage.type('Class Page Type');
});


Scenario('@NestedClassPageObject', async (I, classnestedpage) => {
  await classnestedpage.type('Nested Class Page Type');
});
