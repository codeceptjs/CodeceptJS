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
    user(id: ID): User
  }

  input UserInput {
    id: Int
    name: String
    age: Int
    email: String
    friends: [Int]
  }

  type Mutation {
    createUser(input: UserInput!): User
    deleteUser(id: ID): ID
  }
`;

exports.resolvers = {
  Query: {
    users() {
      return userModel.list();
    },
    user(source, args) {
      return userModel.find(args.id);
    },
  },
  User: {
    friends(source) {
      if (source.friends && source.friends.length > 0) {
        return Promise.all(source.friends.map(({ id }) => userModel.find(id)));
      }
    },
  },
  Mutation: {
    createUser(source, args) {
      return userModel.create(args.input);
    },
    deleteUser(source, args) {
      return userModel.delete(args.id);
    },
  },
};
