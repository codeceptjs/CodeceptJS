const TestHelper = require('../support/TestHelper');
const GraphQL = require('../../lib/helper/Graphql');
const server = require('../data/graphql/index');

const api_url = TestHelper.graphQLServerPort();
const path = require('path');
const fs = require('fs');

let I;
require('co-mocha')(require('mocha'));

describe('GraphQL', () => {
  after((done) => {
    server.close();
    done();
  });

  beforeEach((done) => {
    I = new GraphQL({
      endpoint: 'http://localhost:8020/graphql',
      defaultHeaders: {
        'X-Test': 'test',
      },
    });
    done();
  });

  describe('basic queries', () => {
    it('should send a query: read', () =>
      I.sendQuery({
        query: 'query { user(id: 1) { id name email }}',
      }).then((response) => {
        const { user } = response.data.data;
        user.should.eql({
          id: '1',
          name: 'Renee Herman',
          email: 'reneeherman@qualitex.com',
        });
      }));
  });

  describe('basic mutations', () => {
    it('should send a mutation: create', () => {
      const operation = {
        query: `
          mutation CreateUser($input: UserInput!) {
            createUser(input: $input) {
              id
              name
              email
              age
            }
          }
        `,
        variables: {
          input: {
            id: 69,
            name: 'Sourab',
            email: 'sourab@mail.com',
            age: 23,
            friends: [2, 3],
          },
        },
      };
      I.sendMutation(operation).then((response) => {
        const { createUser } = response.data.data;
        createUser.should.eql({
          id: '69',
          name: 'Sourab',
          email: 'sourab@mail.com',
          age: 23,
        });
      });
    });

    it('should send a mutation: delete', () => {
      const operation = {
        query: `
          mutation deleteUser($id: ID) {
            deleteUser(id: $id)
          }
        `,
        variables: {
          id: 69,
        },
      };
      I.sendMutation(operation).then((response) => {
        const { deleteUser } = response.data.data;
        deleteUser.should.eql('69');
      });
    });
  });
});
