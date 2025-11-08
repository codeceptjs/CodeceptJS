import path from 'path'
import jsonServer from 'json-server'
import { ApolloServer } from '@apollo/server'
import { startStandaloneServer } from '@apollo/server/standalone'
import { resolvers, typeDefs } from './schema.js'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

import TestHelper from '../../support/TestHelper.js'

const PORT = TestHelper.graphQLServerPort()

// Note: json-server components below are not actually used in this GraphQL server
// They are imported but not connected to the Apollo server
const app = jsonServer.create()
const router = jsonServer.router(path.join(__dirname, 'db.json'))
const middleware = jsonServer.defaults()

const server = new ApolloServer({
  typeDefs,
  resolvers,
  playground: true,
})

const res = startStandaloneServer(server, { listen: { port: PORT } })
res.then(({ url }) => {
  console.log(`test graphQL server listening on ${url}...`)
})

export default res
