const axios = require('axios');

const TestHelper = require('../../support/TestHelper');

class User {
  constructor() {
    const url = `http://localhost:${TestHelper.graphQLServerPort()}`;
    this.api = axios.create({
      baseURL: url,
    });
  }

  list() {
    return this.api.get('/users').then(res => res.data);
  }

  find(id) {
    return this.api.get(`/users/${id}`).then(res => res.data);
  }

  create(data) {
    return this.api.post('/users', data).then(res => res.data);
  }

  delete(id) {
    return this.api.delete(`/users/${id}`).then(() => id);
  }
}

exports.userModel = new User();
