const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const { resolvers, typeDefs } = require('./schema');

const TestHelper = require('../../support/TestHelper');

const PORT = TestHelper.graphQLServerPort();
const app = express();

const server = new ApolloServer({
  typeDefs,
  resolvers,
  playground: true,
});

server.applyMiddleware({ app });

app.get('/', (req, res) => {
  res.send('hello world!');
});

app.listen(PORT, () => console.log(`test graphQL server listening on port ${PORT}...`));
