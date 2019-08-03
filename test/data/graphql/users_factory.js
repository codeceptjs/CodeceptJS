const Factory = require('rosie').Factory;
const faker = require('faker');

module.exports = new Factory()
  .attr('name', () => faker.name.findName())
  .attr('email', () => faker.internet.email());
