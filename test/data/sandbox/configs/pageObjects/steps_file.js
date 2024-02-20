const { I } = inject();

export default () => {
  return actor({
    saySomethingElse() {
      I.say('Say called from custom step');
    },
  });
};
