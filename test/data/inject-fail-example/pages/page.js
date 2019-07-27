const { I, notpage } = inject();

module.exports = {
  type: (s) => {
    console.log(s);
    notpage.domainIds.push('asdasd');
    return notpage.domainIds;
  },

  purgeDomains: (s) => {
    console.log('purgeDomains');
    console.log(s);
  },
};
