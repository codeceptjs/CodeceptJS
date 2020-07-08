const fs = require('fs');
const path = require('path');

Feature('Filesystem');

Scenario('Print correct arg message', ({ I, LogsPage }) => {
  I.getHumanizeArgs(LogsPage);
});
