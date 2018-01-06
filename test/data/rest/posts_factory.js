const Factory = require('rosie').Factory;
const faker = require('faker');

module.exports = new Factory()
  .attr('author', () => faker.name.findName())
  .attr('title', () => faker.lorem.sentence())
  .attr('body', () => faker.lorem.paragraph());
