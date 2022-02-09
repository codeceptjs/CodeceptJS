const { Factory } = require('rosie');
const faker = require('@faker-js/faker');

module.exports = new Factory()
  .attr('author', () => faker.name.findName())
  .attr('title', () => faker.lorem.sentence())
  .attr('body', () => faker.lorem.paragraph());
