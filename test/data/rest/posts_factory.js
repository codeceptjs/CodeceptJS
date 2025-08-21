import { Factory  } from 'rosie'
import { faker  } from '@faker-js/faker'

export default new Factory()
  .attr('author', () => faker.person.fullName())
  .attr('title', () => faker.lorem.sentence())
  .attr('body', () => faker.lorem.paragraph());
