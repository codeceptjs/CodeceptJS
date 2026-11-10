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

Data(credentials).Scenario('test with data', ({ I, current }) => {
  if (!current) {
    throw new Error('Test should receive current data from Data().Scenario()');
  }
  if (!current.username || !current.password) {
    throw new Error(`Test data incomplete: ${JSON.stringify(current)}`);
  }
});

Scenario('test without data', () => {
  console.log('hookCalls:', hookCalls);
  if (hookCalls.length > 0) {
    // Verify that hooks ran correctly for data-driven scenarios
    const expectedCallsPerScenario = 2; // Before + After for each data row
    const dataRowCount = 2;
    const expectedTotalCalls = expectedCallsPerScenario * dataRowCount;
    if (hookCalls.length !== expectedTotalCalls) {
      throw new Error(`Expected ${expectedTotalCalls} hook calls, but got ${hookCalls.length}: ${hookCalls.join(', ')}`);
    }
  }
});
