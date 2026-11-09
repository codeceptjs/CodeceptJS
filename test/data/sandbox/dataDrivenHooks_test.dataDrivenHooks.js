Feature('Data-driven Before/After hooks');

import { dataTable as DataTable } from 'codeceptjs';

const hookCalls = [];

const credentials = new DataTable(['username', 'password']);
credentials.add(['alice', 'pass123']);
credentials.add(['bob', 'pass456']);

Data(credentials).Before(({ current }) => {
  hookCalls.push(`Before: ${current.username}`);
});

Data(credentials).After(({ current }) => {
  hookCalls.push(`After: ${current.username}`);
});

Scenario('test 1', () => {
  // Just ensure test runs
});

Scenario('test 2', () => {
  // Just ensure test runs
});
