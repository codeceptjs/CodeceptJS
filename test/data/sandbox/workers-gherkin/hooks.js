let beforeCounter = 0;
let afterCounter = 0;
GherkinBefore((test) => {
  test.addNote('before', `beforeCounter=${++beforeCounter}`);
});
GherkinAfter((test) => {
  test.addNote('after', `afterCounter=${++afterCounter}`);
});
