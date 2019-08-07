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
      name: 'Peck Montoya',
      email: 'peckmontoya@qualitex.com',
    },
    {
      id: 1,
      age: 36,
      name: 'Renee Herman',
      email: 'reneeherman@qualitex.com',
    },
  ],
};

const getDataFromFile = () => JSON.parse(fs.readFileSync(dbFile));

describe('GraphQLDataFactory', function () {
  this.timeout(20000);

  before(() => {
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
    server.close();
    console.log('closed server');
    done();
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

  describe('create and cleanup records', function () {
    this.retries(2);

    it('should create a new user', async () => {
      await I.mutate('createUser');
      const resp = await I.graphqlHelper.sendMutation('query { users { id name } }');
      const { users } = resp.data.data;
      users.length.should.eql(3);
    });
  });
});
