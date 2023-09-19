const express = require('express');
const path = require('path');
const db = require('./config/connection');
const routes = require('./routes');
const { ApolloServer } = require('apollo-server-express');
const { makeExecutableSchema } = require('@graphql-tools/schema'); // Change this line
const { authMiddleware } = require('./utils/auth');
const { typeDefs, resolvers } = require('./schemas'); 

const app = express();
const PORT = process.env.PORT || 3001;

const schema = makeExecutableSchema({ // Change this line
  typeDefs,
  resolvers,
});

const server = new ApolloServer({
  schema, 
  context: authMiddleware,
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
}

// starts Apollo Server
const startApolloServer = async () => {
  await server.start();
  server.applyMiddleware({ app });
};

app.use(routes);

db.once('open', () => {
  // starts Express server and logs GraphQL
  app.listen(PORT, () => {
    console.log(`API server running on port ${PORT}!`);
    console.log(`Use GraphQL at http://localhost:${PORT}${server.graphqlPath}`);
  });
});

startApolloServer();
