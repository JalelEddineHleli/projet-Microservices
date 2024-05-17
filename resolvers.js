const sqlite3 = require('sqlite3').verbose();
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const bookProtoPath = 'book.proto';
const storyProtoPath = 'story.proto';
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

const resolvers = {
  Query: {
    story: (_, { id }) => {
      // Example of making gRPC call using clientStorys
      return new Promise((resolve, reject) => {
        clientStorys.getStory({ id }, (err, response) => {
          if (err) {
            reject(err);
          } else {
            resolve(response);
          }
        });
      });
    },
    storys: () => {
      // Example of making gRPC call using clientStorys
      return new Promise((resolve, reject) => {
        clientStorys.getAllStories({}, (err, response) => {
          if (err) {
            reject(err);
          } else {
            resolve(response.storiesList);
          }
        });
      });
    },
    books: () => {
      // Example of making gRPC call using clientBooks
      return new Promise((resolve, reject) => {
        clientBooks.getAllBooks({}, (err, response) => {
          if (err) {
            reject(err);
          } else {
            resolve(response.booksList);
          }
        });
      });
    },
    book: (_, { id }) => {
      // Example of making gRPC call using clientBooks
      return new Promise((resolve, reject) => {
        clientBooks.getBook({ id }, (err, response) => {
          if (err) {
            reject(err);
          } else {
            resolve(response);
          }
        });
      });
    },
  },
  Mutation: {
    addStory: (_, { id, title, description }) => {
      // Example of making gRPC call using clientStorys
      return new Promise((resolve, reject) => {
        clientStorys.addStory(
          { id, title, description },
          (err, response) => {
            if (err) {
              reject(err);
            } else {
              resolve(response);
            }
          }
        );
      });
    },
    addBook: (_, { id, title, description }) => {
      // Example of making gRPC call using clientBooks
      return new Promise((resolve, reject) => {
        clientBooks.addBook(
          { id, title, description },
          (err, response) => {
            if (err) {
              reject(err);
            } else {
              resolve(response);
            }
          }
        );
      });
    },
  },
};

module.exports = resolvers;
