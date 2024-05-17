const sqlite3 = require('sqlite3').verbose();


const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const bookProtoPath = 'book.proto';
const bookProtoDefinition = protoLoader.loadSync(bookProtoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const bookProto = grpc.loadPackageDefinition(bookProtoDefinition).book;
const db = new sqlite3.Database('./database.db'); 

db.run(`
  CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY,
    title TEXT,
    description TEXT
  )
`);

const bookService = {
  getBook: (call, callback) => {
    const { book_id } = call.request;
    
    db.get('SELECT * FROM books WHERE id = ?', [book_id], (err, row) => {
      if (err) {
        callback(err);
      } else if (row) {
        const book = {
          id: row.id,
          title: row.title,
          description: row.description,
        };
        callback(null, { book });
      } else {
        callback(new Error('Booknot found'));
      }
    });
  },
  searchBooks: (call, callback) => {
    db.all('SELECT * FROM books', (err, rows) => {
      if (err) {
        callback(err);
      } else {
        const books = rows.map((row) => ({
          id: row.id,
          title: row.title,
          description: row.description,
        }));
        callback(null, { books });
      }
    });
  },
  CreateBook: (call, callback) => {
    const { book_id, title, description } = call.request;
    db.run(
      'INSERT INTO books (id, title, description) VALUES (?, ?, ?)',
      [book_id, title, description],
      function (err) {
        if (err) {
          callback(err);
        } else {
          const book = {
            id: book_id,
            title,
            description,
          };
          callback(null, { book });
        }
      }
    );
  },
};



const server = new grpc.Server();
server.addService(bookProto.BookService.service, bookService);
const port = 50051;
server.bindAsync(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure(), (err, port) => {
    if (err) {
      console.error('Failed to bind server:', err);
      return;
    }
  
    console.log(`Server is running on port ${port}`);
    server.start();
  });
console.log(`Book microservice running on port ${port}`);
