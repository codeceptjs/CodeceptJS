import { Factory } from 'rosie';
import { faker } from '@faker-js/faker';

export default new Factory(function (buildObject) {
  this.input = { ...buildObject };
})
  .attr('name', () => faker.name.fullName())
  .attr('email', () => faker.internet.email());
