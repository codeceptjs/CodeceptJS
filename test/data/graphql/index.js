import path from 'path';
import jsonServer from 'json-server';
import { ApolloServer } from 'apollo-server-express';
import { resolvers, typeDefs } from './schema';
import TestHelper from '../../support/TestHelper';

const PORT = TestHelper.graphQLServerPort();
const __dirname = path.resolve();

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
export default app.listen(PORT, () => console.log(`test graphQL server listening on port ${PORT}...`));
