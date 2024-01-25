const path = require('path');
const { expect } = require('chai');
const { like } = require('pactum-matchers');
const MockServer = require('../../lib/helper/MockServer');
const REST = require('../../lib/helper/REST');

global.codeceptjs = require('../../lib');

let I;
let restClient;
const port = parseInt(Date.now().toString().slice(3, 8), 10);
const api_url = `http://0.0.0.0:${port}`;

describe('MockServer Helper', function () {
  this.timeout(3000);
  this.retries(1);

  before(() => {
    global.codecept_dir = path.join(__dirname, '/../data');

    I = new MockServer({ port });
    restClient = new REST({
      endpoint: api_url,
      defaultHeaders: {
        'X-Test': 'test',
      },
    });
  });

  beforeEach(async () => {
    await I.startMockServer();
  });

  afterEach(async () => {
    await I.stopMockServer();
  });

  describe('#startMockServer', () => {
    it('should start the mock server with custom port', async () => {
      global.debugMode = true;
      await I.startMockServer(6789);
      await I.stopMockServer();
      global.debugMode = undefined;
    });
  });

  describe('#addInteractionToMockServer', () => {
    it('should return the correct response', async () => {
      await I.addInteractionToMockServer({
        request: {
          method: 'GET',
          path: '/api/hello',
        },
        response: {
          status: 200,
          body: {
            say: 'hello to mock server',
          },
        },
      });
      const res = await restClient.sendGetRequest('/api/hello');
      expect(res.data).to.eql({ say: 'hello to mock server' });
    });

    it('should return 404 when not found route', async () => {
      const res = await restClient.sendGetRequest('/api/notfound');
      expect(res.status).to.eql(404);
    });

    it('should return the strong Match on Query Params', async () => {
      await I.addInteractionToMockServer({
        request: {
          method: 'GET',
          path: '/api/users',
          queryParams: {
            id: 1,
          },
        },
        response: {
          status: 200,
          body: {
            user: 1,
          },
        },
      });

      await I.addInteractionToMockServer({
        request: {
          method: 'GET',
          path: '/api/users',
          queryParams: {
            id: 2,
          },
        },
        response: {
          status: 200,
          body: {
            user: 2,
          },
        },
      });
      let res = await restClient.sendGetRequest('/api/users?id=1');
      expect(res.data).to.eql({ user: 1 });
      res = await restClient.sendGetRequest('/api/users?id=2');
      expect(res.data).to.eql({ user: 2 });
    });

    it('should check the stateful behavior', async () => {
      await I.addInteractionToMockServer({
        request: {
          method: 'GET',
          path: '/api/projects/{id}',
          pathParams: {
            id: like('random-id'),
          },
        },
        stores: {
          ProjectId: 'req.pathParams.id',
        },
        response: {
          status: 200,
          body: {
            id: '$S{ProjectId}',
          },
        },
      });
      const res = await restClient.sendGetRequest('/api/projects/10');
      expect(res.data).to.eql({ id: '10' });
    });
  });
});
