const given = when = then = global.codeceptjs.container.plugins('commentStep');
const { I } = inject();

Feature('Steps');

Scenario('Default command timeout was expired', ({ I }) => {
  I.exceededByTimeout(1000);
});
