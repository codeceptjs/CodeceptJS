const { Factory } = require('rosie');
const { faker } = require('@faker-js/faker');

module.exports = new Factory(function (buildObject) {
  this.input = { ...buildObject };
})
  .attr('name', () => faker.person.fullName())
  .attr('email', () => faker.internet.email());
