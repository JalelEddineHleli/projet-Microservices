const sqlite3 = require('sqlite3').verbose();

const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');


const storyProtoPath = 'story.proto';
const storyProtoDefinition = protoLoader.loadSync(storyProtoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const storyProto = grpc.loadPackageDefinition(storyProtoDefinition).story;
const db = new sqlite3.Database('./database.db'); 

db.run(`
  CREATE TABLE IF NOT EXISTS storys (
    id INTEGER PRIMARY KEY,
    title TEXT,
    description TEXT
  )
`);


const storyService = {
  getStory: (call, callback) => {
    const { story_id } = call.request;
    
    db.get('SELECT * FROM storys WHERE id = ?', [story_id], (err, row) => {
      if (err) {
        callback(err);
      } else if (row) {
        const story = {
          id: row.id,
          title: row.title,
          description: row.description,
        };
        callback(null, { story });
      } else {
        callback(new Error('story not found'));
      }
    });
  },
  searchStorys: (call, callback) => {
    db.all('SELECT * FROM storys', (err, rows) => {
      if (err) {
        callback(err);
      } else {
        const storys = rows.map((row) => ({
          id: row.id,
          title: row.title,
          description: row.description,
        }));
        callback(null, { storys });
      }
    });
  },
  CreateStory: (call, callback) => {
    const { story_id, title, description } = call.request;
    db.run(
      'INSERT INTO storys (id, title, description) VALUES (?, ?, ?)',
      [story_id, title, description],
      function (err) {
        if (err) {
          callback(err);
        } else {
          const story = {
            id: story_id,
            title,
            description,
          };
          callback(null, { story });
        }
      }
    );
  },
};



const server = new grpc.Server();
server.addService(storyProto.StoryService.service, storyService);
const port = 50056;
server.bindAsync(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure(), (err, port) => {
    if (err) {
      console.error('Failed to bind server:', err);
      return;
    }
  
    console.log(`Server is running on port ${port}`);
    server.start();
  });
console.log(`story microservice running on port ${port}`);
