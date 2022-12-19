require('../support/setup');
const path = require('path');
const fs = require('fs');

const TestHelper = require('../support/TestHelper');

const GraphQLDataFactory = require('../../lib/helper/GraphQLDataFactory');

const graphql_url = TestHelper.graphQLServerUrl();

let I;
const dbFile = path.join(__dirname, '/../data/graphql/db.json');

const data = {
  users: [
    {
      id: 0,
      age: 31,
      name: 'john doe',
      email: 'johnd@mutex.com',
    },
  ],
};

const creatUserQuery = `
      mutation createUser($input: UserInput!) {
        createUser(input: $input) {
          id
          name
          email
        }
      }
    `;

const deleteOperationQuery = `
  mutation deleteUser($id: ID!) {
    deleteUser(id: $id)
  }
`;

describe('GraphQLDataFactory', function () {
  this.timeout(20000);

  before(() => {
    I = new GraphQLDataFactory({
      endpoint: graphql_url,
      factories: {
        createUser: {
          factory: path.join(__dirname, '/../data/graphql/users_factory.js'),
          query: creatUserQuery,
          revert: (data) => {
            return {
              query: deleteOperationQuery,
              variables: { id: data.id },
            };
          },
        },
      },
    });
  });

  after((done) => {
    // Prepare db.json for the next test run
    try {
      fs.writeFileSync(dbFile, JSON.stringify(data));
    } catch (err) {
      console.error(err);
    }
    setTimeout(done, 1000);
  });

  beforeEach((done) => {
    try {
      fs.writeFileSync(dbFile, JSON.stringify(data));
    } catch (err) {
      console.error(err);
    }
    setTimeout(done, 1000);
  });

  afterEach(() => {
    return I._after();
  });

  describe('create and cleanup records', function () {
    this.retries(2);

    it('should create a new user', async () => {
      await I.mutateData('createUser');
      const resp = await I.graphqlHelper.sendQuery('query { users { id name } }');
      const { users } = resp.data.data;
      users.length.toEqual(2);
    });

    it('should create a new user with predefined field', async () => {
      const user = await I.mutateData('createUser', { name: 'radhey' });

      user.name.toEqual('radhey');
      user.id.toEqual('1');
    });

    it('should update request with onRequest', async () => {
      I = new GraphQLDataFactory({
        endpoint: graphql_url,
        onRequest: (request) => {
          if (request.data.variables && request.data.variables.input) {
            request.data.variables.input.name = 'Dante';
          }
        },
        factories: {
          createUser: {
            factory: path.join(__dirname, '/../data/graphql/users_factory.js'),
            query: creatUserQuery,
            revert: (data) => {
              return {
                query: deleteOperationQuery,
                variables: { id: data.id },
              };
            },
          },
        },
      });
      const user = await I.mutateData('createUser');
      user.name.toEqual('Dante');
    });

    it('should cleanup created data', async () => {
      const user = await I.mutateData('createUser', { name: 'Dante' });
      user.name.toEqual('Dante');
      user.id.toEqual('1');
      await I._after();
      const resp = await I.graphqlHelper.sendQuery('query { users { id } }');
      resp.data.data.users.length.toEqual(1);
    });

    it('should create multiple users and cleanup after', async () => {
      let resp = await I.graphqlHelper.sendQuery('query { users { id } }');
      resp.data.data.users.length.toEqual(1);

      await I.mutateMultiple('createUser', 3);
      resp = await I.graphqlHelper.sendQuery('query { users { id } }');
      resp.data.data.users.length.toEqual(4);

      await I._after();
      resp = await I.graphqlHelper.sendQuery('query { users { id } }');
      resp.data.data.users.length.toEqual(1);
    });

    it('should not remove records if cleanup:false', async () => {
      I = new GraphQLDataFactory({
        endpoint: graphql_url,
        cleanup: false,
        factories: {
          createUser: {
            factory: path.join(__dirname, '/../data/graphql/users_factory.js'),
            query: creatUserQuery,
            revert: (data) => {
              return {
                query: deleteOperationQuery,
                variables: { id: data.id },
              };
            },
          },
        },
      });
      await I.mutateData('createUser');
      let resp = await I.graphqlHelper.sendQuery('query { users { id } }');
      resp.data.data.users.length.toEqual(2);
      await I._after();
      resp = await I.graphqlHelper.sendQuery('query { users { id } }');
      resp.data.data.users.length.toEqual(2);
    });
  });
});
