Feature('Filesystem');

Scenario('Print correct arg message', ({ I, LogsPage }) => {
  I.getHumanizeArgs(LogsPage);
});

Scenario('Error print correct arg message', ({ I, LogsPage }) => {
  I.errorMethodHumanizeArgs(LogsPage);
});
