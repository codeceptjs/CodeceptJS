import { gql } from 'apollo-server-express';
import { userModel } from './models';

export const typeDefs = gql`
  type User {
    id: ID
    name: String!
    age: Int
    email: String!
  }

  type Query {
    users: [User]
    user(id: ID): User
  }

  input UserInput {
    id: ID
    name: String!
    age: Int
    email: String!
  }

  type Mutation {
    createUser(input: UserInput!): User
    deleteUser(id: ID): ID
  }
`;

export const resolvers = {
  Query: {
    users() {
      return userModel.list();
    },
    user(source, args) {
      return userModel.find(args.id);
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
