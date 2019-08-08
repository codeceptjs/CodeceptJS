require('../support/setup');
const TestHelper = require('../support/TestHelper');

const GraphQLDataFactory = require('../../lib/helper/GraphQLDataFactory');
const server = require('../data/graphql/index');

const graphql_url = TestHelper.graphQLServerUrl();
const path = require('path');
const fs = require('fs');

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

const getDataFromFile = () => JSON.parse(fs.readFileSync(dbFile));

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

  after(() => {
    server.close();
    console.log('closed server');
  });

  beforeEach((done) => {
    try {
      fs.writeFileSync(dbFile, JSON.stringify(data));
    } catch (err) {
      console.error(err);
      // continue regardless of error
    }
    setTimeout(done, 1000);
  });

  afterEach(() => {
    return I._after();
  });

  // eslint-disable-next-line prefer-arrow-callback
  describe('create and cleanup records', function () {
    // this.retries(2);

    it('should create a new user', async () => {
      await I.mutate('createUser');
      const resp = await I.graphqlHelper.sendQuery('query { users { id name } }');
      const { users } = resp.data.data;
      users.length.should.eql(2);
    });

    it('should create a new user with predefined field', async () => {
      const user = await I.mutate('createUser', { name: 'radhey' });

      user.name.should.eql('radhey');
      user.id.should.eql('1');
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
      const user = await I.mutate('createUser');
      user.name.should.eql('Dante');
    });

    it('should cleanup created data', async () => {
      const user = await I.mutate('createUser', { name: 'Dante' });
      user.name.should.eql('Dante');
      user.id.should.eql('1');
      await I._after();
      const resp = await I.graphqlHelper.sendQuery('query { users { id } }');
      console.log(resp.data.data);
      resp.data.data.users.length.should.eql(1);
    });
  });
});
