import path from 'path'
import { fileURLToPath } from 'url'

import path from 'path'
import jsonServer from 'json-server'
import { ApolloServer  } from '@apollo/server'
import { startStandaloneServer  } from '@apollo/server/standalone'
import { resolvers, typeDefs  } from './schema.js'

import TestHelper from '../../support/TestHelper.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = TestHelper.graphQLServerPort();

const app = jsonServer.create();
const router = jsonServer.router(path.join(__dirname, 'db.json'));
const middleware = jsonServer.defaults();

const server = new ApolloServer({
  typeDefs,
  resolvers,
  playground: true,
});

const res = startStandaloneServer(server, { listen: { port: PORT } });
res.then(({ url }) => {
  console.log(`test graphQL server listening on ${url}...`);
});

export default res;
