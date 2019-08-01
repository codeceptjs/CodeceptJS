const path = require('path');
const jsonServer = require('json-server');
const { ApolloServer } = require('apollo-server-express');
const { resolvers, typeDefs } = require('./schema');

const TestHelper = require('../../support/TestHelper');

const PORT = TestHelper.graphQLServerPort();

const app = jsonServer.create();
const router = jsonServer.router(path.join(__dirname, 'db.json'));
const middleware = jsonServer.defaults();

const server = new ApolloServer({
  typeDefs,
  resolvers,
  playground: true,
});

server.applyMiddleware({ app });

app.use(middleware);
app.use(router);
module.exports = app.listen(PORT, () => console.log(`test graphQL server listening on port ${PORT}...`));
