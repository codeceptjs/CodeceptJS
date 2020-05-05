const { notpage, arraypage } = inject();

module.exports = {
  type: (s) => {
    console.log('type => ', s);
    console.log('strategy', arraypage);
    notpage.domainIds.push('newdomain');
    return notpage.domainIds;
  },

  purgeDomains: (s) => {
    console.log('purgeDomains');
    console.log(s);
  },
};
