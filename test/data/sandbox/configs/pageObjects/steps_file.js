const { I } = inject();

export default function() {
  return actor({
    saySomethingElse() {
      I.say('Say called from custom step');
    },
  });
}
