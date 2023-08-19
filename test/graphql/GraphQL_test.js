const path = require('path');
const fs = require('fs');

const TestHelper = require('../support/TestHelper');
const GraphQL = require('../../lib/helper/GraphQL');
const Container = require('../../lib/container');
global.codeceptjs = require('../../lib');

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

describe('GraphQL', () => {
  before((done) => {
    try {
      fs.writeFileSync(dbFile, JSON.stringify(data));
    } catch (err) {
      console.error(err);
    }
    setTimeout(done, 1500);
  });

  beforeEach((done) => {
    I = new GraphQL({
      endpoint: graphql_url,
      defaultHeaders: {
        'X-Test': 'test',
      },
    });
    done();
  });

  describe('basic queries', () => {
    it('should send a query: read', async () => {
      const resp = await I.sendQuery('{ user(id: 0) { id name email }}');
      const { user } = resp.data.data;
      user.should.eql({
        id: '0',
        name: 'john doe',
        email: 'johnd@mutex.com',
      });
    });
  });

  describe('basic mutations', () => {
    it('should send a mutation: create', async () => {
      const mutation = `
        mutation CreateUser($input: UserInput!) {
          createUser(input: $input) {
            id
            name
            email
            age
          }
        }
      `;
      const variables = {
        input: {
          id: 111,
          name: 'Sourab',
          email: 'sourab@mail.com',
          age: 23,
        },
      };
      const resp = await I.sendMutation(mutation, variables);
      const { createUser } = resp.data.data;
      createUser.should.eql({
        id: '111',
        name: 'Sourab',
        email: 'sourab@mail.com',
        age: 23,
      });
    });

    it('should send a mutation: delete', async () => {
      const mutation = `
        mutation deleteUser($id: ID) {
          deleteUser(id: $id)
        }
      `;
      const variables = {
        id: 111,
      };
      const resp = await I.sendMutation(mutation, variables);
      const { deleteUser } = resp.data.data;
      deleteUser.should.eql('111');
    });
  });

  describe('JSONResponse integration', () => {
    let jsonResponse;

    beforeEach(() => {
      Container.create({
        helpers: {
          GraphQL: {
            endpoint: graphql_url,
          },
          JSONResponse: {
            requestHelper: 'GraphQL',
          },
        },
      });
      I = Container.helpers('GraphQL');
      jsonResponse = Container.helpers('JSONResponse');
      jsonResponse._beforeSuite();
    });

    afterEach(() => {
      Container.clear();
    });

    it('should be able to parse JSON responses', async () => {
      await I.sendQuery('{ user(id: 0) { id name email }}');
      await jsonResponse.seeResponseCodeIsSuccessful();
      await jsonResponse.seeResponseContainsKeys(['data']);
      await jsonResponse.seeResponseContainsJson({
        data: {
          user: {
            name: 'john doe',
            email: 'johnd@mutex.com',
          },
        },
      });
    });
  });

  describe('headers', () => {
    it('should set headers for all requests multiple times', async () => {
      I.haveRequestHeaders({ 'XY1-Test': 'xy1-first' });
      I.haveRequestHeaders({ 'XY1-Test': 'xy1-second' });
      I.haveRequestHeaders({ 'XY2-Test': 'xy2' });

      const response = await I.sendQuery('{ user(id: 0) { id name email }}');

      response.config.headers.should.have.property('XY1-Test');
      response.config.headers['XY1-Test'].should.eql('xy1-second');

      response.config.headers.should.have.property('XY2-Test');
      response.config.headers['XY2-Test'].should.eql('xy2');

      response.config.headers.should.have.property('X-Test');
      response.config.headers['X-Test'].should.eql('test');
    });

    it('should override the header set for all requests', async () => {
      I.haveRequestHeaders({ 'XY-Test': 'first' });

      const response = await I.sendQuery('{ user(id: 0) { id name email }}');

      response.config.headers.should.have.property('XY-Test');
      response.config.headers['XY-Test'].should.eql('first');

      response.config.headers.should.have.property('X-Test');
      response.config.headers['X-Test'].should.eql('test');
    });

    it('should set Bearer authorization', async () => {
      I.amBearerAuthenticated('token');
      const response = await I.sendQuery('{ user(id: 0) { id name email }}');

      response.config.headers.should.have.property('Authorization');
      response.config.headers.Authorization.should.eql('Bearer token');

      response.config.headers.should.have.property('X-Test');
      response.config.headers['X-Test'].should.eql('test');
    });

    it('should set Bearer authorization multiple times', async () => {
      I.amBearerAuthenticated('token1');
      I.amBearerAuthenticated('token2');
      const response = await I.sendQuery('{ user(id: 0) { id name email }}');

      response.config.headers.should.have.property('Authorization');
      response.config.headers.Authorization.should.eql('Bearer token2');

      response.config.headers.should.have.property('X-Test');
      response.config.headers['X-Test'].should.eql('test');
    });
  });
});
