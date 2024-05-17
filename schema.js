const { gql } = require('@apollo/server');

const typeDefs = `#graphql
  type Book {
    id: String!
    title: String!
    description: String!
  }

  type Story {
    id: String!
    title: String!
    description: String!
  }

  type Query {
    book(id: String!): Book
    books: [Book]
    story(id: String!): Story
    storys: [Story]
  }
  type Mutation {
    addBook(id: String!, title: String!, description:String!): Book
    addStory(id: String!, title: String!, description:String!): Story
    
  }
`;

module.exports = typeDefs