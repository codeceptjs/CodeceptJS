const { Factory } = require('rosie');
const { faker } = require('@faker-js/faker');

module.exports = new Factory(function (buildObject) {
  this.input = { ...buildObject };
})
  .attr('name', () => faker.name.findName())
  .attr('email', () => faker.internet.email());
