const I = actor();

Given('I have products in my cart', (table) => {
  for (const id in table.rows) {
    if (id < 1) {
      continue;
    }
    const cells = table.rows[id].cells;
    I.addProduct(cells[0].value, parseInt(cells[2].value, 10));
  }
});

Given(/I have product described as/, (text) => {
  I.addItem(text.content.length);
});

Given(/I have simple product/, async () => {
  return new Promise((resolve) => {
    I.addItem(10);
    setTimeout(resolve, 0);
  });
});
