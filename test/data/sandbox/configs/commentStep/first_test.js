const given = when = then = global.codeceptjs.container.plugins('commentStep');
const { I } = inject();

Feature('CommentStep');

const pageObject = {
  metaPrint: (data) => {
    I.print('meta value');
    I.print(data);
  },
};

Scenario('global var', (I) => {
  __`Prepare user base`;
  I.print('other thins');

  __`Update data`;
  I.print('do some things');

  __`Check the result`;
  I.print('see everything works');
});

Scenario('local vars', (I) => {
  given`Prepare project`;
  I.print('other thins');

  when`Update project`;
  I.print('do some things');

  then`Check project`;
  I.print('see everything works');
});

Scenario('from page object', (I) => {
  __`Prepare project`;
  I.print('other thins');
  pageObject.metaPrint('login user');

  __`Update project`;
  I.print('do some things');
});
