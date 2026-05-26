import {
  container,
  codecept,
  output,
  event,
  recorder,
  config,
  actor,
  helper,
  pause,
  within,
  dataTable,
  dataTableArgument,
  store,
  locator,
  // Secret,
  // secret,
} from "codeceptjs";
import { expect } from "chai";

Feature("Import all exports from codeceptjs");

Scenario("container should be importable as named export", () => {
  expect(container).to.exist;
  expect(container.helpers).to.be.a("function");

  const helpers = container.helpers();
  console.log("Available helpers:", Object.keys(helpers));
});

Scenario("codecept should be importable", () => {
  expect(codecept).to.exist;
});

Scenario("output should be importable", () => {
  expect(output).to.exist;
  expect(output.print).to.be.a("function");
  output.print("Testing output.print");
});

Scenario("event should be importable", () => {
  expect(event).to.exist;
  expect(event).to.be.an("object");
  expect(event.dispatcher).to.exist;
});

Scenario("recorder should be importable", () => {
  expect(recorder).to.exist;
  expect(recorder).to.be.an("object");
  expect(recorder.start).to.be.a("function");
});

Scenario("config should be importable", () => {
  expect(config).to.exist;
  expect(config.get).to.be.a("function");
});

Scenario("actor should be importable", () => {
  expect(actor).to.exist;
  expect(actor).to.be.a("function");
});

Scenario("helper should be importable", () => {
  expect(helper).to.exist;
});

Scenario("pause should be importable", () => {
  expect(pause).to.exist;
});

Scenario("within should be importable", () => {
  expect(within).to.exist;
  expect(within).to.be.a("function");
});

Scenario("dataTable should be importable", () => {
  expect(dataTable).to.exist;
});

Scenario("dataTableArgument should be importable", () => {
  expect(dataTableArgument).to.exist;
});

Scenario("store should be importable", () => {
  expect(store).to.exist;
  expect(store).to.be.an("object");
  expect(store.debugMode).to.exist;
});

Scenario("locator should be importable", () => {
  expect(locator).to.exist;
  expect(locator.build).to.be.a("function");
});

// Secret and secret are not exported from lib/index.js in older versions, so skip them
// Scenario("Secret should be importable", () => {
//   expect(Secret).to.exist;
//   expect(Secret.secret).to.be.a("function");
// });

// Scenario("secret should be importable", () => {
//   expect(secret).to.exist;
//   expect(secret).to.be.a("function");
//
//   const mySecret = secret("my-password");
//   expect(mySecret.toString()).to.equal("my-password");
// });
