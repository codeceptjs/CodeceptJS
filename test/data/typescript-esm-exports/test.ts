import { container } from "codeceptjs";
import { expect } from "chai";

Feature("Import container as named export");

Scenario("container should be importable as named export", () => {
  expect(container).to.exist;
  expect(container.helpers).to.be.a("function");

  const helpers = container.helpers();
  console.log("Available helpers:", Object.keys(helpers));
});
