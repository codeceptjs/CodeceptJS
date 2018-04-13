Feature('Session');

Scenario('basic session', (I) => {
  I.do('writing');
  session('davert', (I) => {
    I.do('reading');
  });
  I.do('playing');
  session('john', (I) => {
    I.do('crying');
  });
  session('davert', (I) => {
    I.do('smiling');
  });
  I.do('laughing');
  session('mike', (I) => {
    I.do('spying');
  });
  session('john', (I) => {
    I.do('lying');
  });
  I.do('waving');
});

Scenario('session defined not used', (I) => {
  session('davert');
  I.do('writing');
  I.do('playing');
  session('john', (I) => {
    I.do('crying');
  });
  session('davert', (I) => {
    I.do('smiling');
  });
  I.do('laughing');
  session('davert', (I) => {
    I.do('singing');
  });
  I.do('waving');
});
