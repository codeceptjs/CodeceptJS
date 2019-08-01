const { gql } = require('apollo-server-express');

const { userModel } = require('./models');

exports.typeDefs = gql`
  type User {
    id: ID
    name: String
    age: Int
    email: String
    friends: [User]
  }

  type Query {
    users: [User]
  }
`;

exports.resolvers = {
  Query: {
    users() {
      return userModel.list();
    },
  },
  User: {
    friends(source) {
      if (source.friends && source.friends.length > 0) {
        return Promise.all(source.friends.map(({ id }) => userModel.find(id)));
      }
    },
  },
};
