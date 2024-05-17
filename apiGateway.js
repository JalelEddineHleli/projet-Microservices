const sqlite3 = require('sqlite3').verbose();
const express = require('express');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const bodyParser = require('body-parser');
const cors = require('cors');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const bookProtoPath = 'book.proto';
const storyProtoPath = 'story.proto';

const resolvers = require('./resolvers');
const typeDefs = require('./schema');

const db = new sqlite3.Database('./database.db');

db.run(`
  CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY,
    title TEXT,
    description TEXT
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS storys (
    id INTEGER PRIMARY KEY,
    title TEXT,
    description TEXT
  )
`);

const app = express();
app.use(bodyParser.json());

const bookProtoDefinition = protoLoader.loadSync(bookProtoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const storyProtoDefinition = protoLoader.loadSync(storyProtoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const bookProto = grpc.loadPackageDefinition(bookProtoDefinition).book;
const storyProto = grpc.loadPackageDefinition(storyProtoDefinition).story;
const clientBooks = new bookProto.BookService(
  'localhost:50051',
  grpc.credentials.createInsecure()
);
const clientStorys = new storyProto.StoryService(
  'localhost:50056',
  grpc.credentials.createInsecure()
);

const server = new ApolloServer({ typeDefs, resolvers });

// Add a context object to Apollo Server to pass gRPC clients to resolvers
server.context = ({ req }) => ({
  clientBooks,
  clientStorys,
});

server.start().then(() => {
  app.use(cors(), bodyParser.json(), expressMiddleware(server));
});

app.get('/books', (req, res) => {
  db.all('SELECT * FROM books', (err, rows) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json(rows);
    }
  });
});

app.post('/book', (req, res) => {
  const { id, title, description } = req.body;
  db.run(
    'INSERT INTO books (id, title, description) VALUES (?, ?, ?)',
    [id, title, description],
    function (err) {
      if (err) {
        res.status(500).send(err);
      } else {
        res.json({ id, title, description });
      }
    }
  );
});

app.get('/books/:id', (req, res) => {
  const id = req.params.id;
  db.get('SELECT * FROM books WHERE id = ?', [id], (err, row) => {
    if (err) {
      res.status(500).send(err);
    } else if (row) {
      res.json(row);
    } else {
      res.status(404).send('book not found.');
    }
  });
});

app.post('/story', (req, res) => {
  const { id, title, description } = req.body;
  db.run(
    'INSERT INTO storys (id, title, description) VALUES (?, ?, ?)',
    [id, title, description],
    function (err) {
      if (err) {
        res.status(500).send(err);
      } else {
        res.json({ id, title, description });
      }
    }
  );
});

app.get('/storys', (req, res) => {
  db.all('SELECT * FROM storys', (err, rows) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json(rows);
    }
  });
});

app.get('/storys/:id', (req, res) => {
  const id = req.params.id;
  db.get('SELECT * FROM storys WHERE id = ?', [id], (err, row) => {
    if (err) {
      res.status(500).send(err);
    } else if (row) {
      res.json(row);
    } else {
      res.status(404).send('Story not found.');
    }
  });
});

const port = 3000;
app.listen(port, () => {
  console.log(`API Gateway running on port ${port}`);
});
