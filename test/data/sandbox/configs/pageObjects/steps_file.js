const { I } = inject();

module.exports = () => {
  return actor({
    saySomethingElse() {
      I.say('Say called from custom step');
    },
  });
};
