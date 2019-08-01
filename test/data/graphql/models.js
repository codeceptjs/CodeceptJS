const axios = require('axios');

const TestHelper = require('../../support/TestHelper');

class User {
  constructor() {
    this.api = axios.create({
      baseURL: TestHelper.jsonServerUrl(),
    });
  }

  list() {
    return this.api.get('/users').then(res => res.data);
  }

  find(id) {
    return this.api.get(`/users/${id}`).then(res => res.data);
  }

  create(data) {
    data.friends = data.friends
      ? data.friends.map(id => ({ id }))
      : [];

    return this.api.post('/users', data).then(res => res.data);
  }

  delete(id) {
    return this.api.delete(`/users/${id}`).then(() => id);
  }
}

exports.userModel = new User();
