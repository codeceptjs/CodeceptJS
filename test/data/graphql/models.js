import TestHelper from '../../support/TestHelper.js';

class User {
  constructor() {
    this.baseURL = `http://localhost:${TestHelper.graphQLServerPort()}`;
  }

  async list() {
    const res = await fetch(`${this.baseURL}/users`);
    return res.json();
  }

  async find(id) {
    const res = await fetch(`${this.baseURL}/users/${id}`);
    return res.json();
  }

  async create(data) {
    const res = await fetch(`${this.baseURL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  }

  async delete(id) {
    await fetch(`${this.baseURL}/users/${id}`, { method: 'DELETE' });
    return id;
  }
}

export const userModel = new User();
