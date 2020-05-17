const graphql = require('graphql');
const knex = require('../db');
const {rateBook, deleteRating} = require('./models');

const UserType = new graphql.GraphQLObjectType({
    name: 'User',
    description: 'A user in the system',
    fields: () => {
        return {
            id: {
                type: graphql.GraphQLID,
                resolve(user) {
                    return user.id;
                }
            },
            username: {
                type: graphql.GraphQLString,
                resolve(user) {
                    return user.username;
                }
            },
            isAdmin: {
                type: graphql.GraphQLBoolean,
                resolve(user) {
                    return user.role === 'admin';
                }
            },
            booksRead: {
                type: graphql.GraphQLList(HasReadType),
                resolve(user) {
                    return knex('hasRead').where('userId', user.id);
                }
            },
            averageRating: {
                type: graphql.GraphQLFloat,
                async resolve(user) {
                    let query = await knex('hasRead')
                    .where('userId', user.id)
                    .avg('rating as avg_rating')
                    .first();

                    return query['avg_rating'];
                }
            }
        }
    }
});

const BookType = new graphql.GraphQLObjectType({
    name: 'Book',
    fields: () => {
        return {
            id: {
                type: graphql.GraphQLID,
                resolve(book) {
                    return book.id;
                }
            },
            title: {
                type: graphql.GraphQLString,
                resolve(book) {
                    return book.title;
                }
            },
            author: {
                type: graphql.GraphQLString,
                resolve(book) {
                    return book.author;
                }
            },
            publishedYear: {
                type: graphql.GraphQLInt,
                resolve(book) {
                    return book.publishedYear;
                }
            },
            fiction: {
                type: graphql.GraphQLBoolean,
                resolve(book) {
                    return book.fiction;
                }
            },
            readBy: {
                type: graphql.GraphQLList(HasReadType),
                resolve(book) {
                    return knex('hasRead').where('bookId', book.id);
                }
            }
        }
    }
});

const HasReadType = new graphql.GraphQLObjectType({
    name: 'HasRead',
    fields: {
        book: {
            type: BookType,
            resolve(hasRead) {
                return knex('book').where('id', hasRead.bookId).first();
            }
        },
        rating: {
            type: graphql.GraphQLInt,
            resolve(hasRead) {
                return hasRead.rating;
            }
        },
        user: {
            type: UserType,
            resolve(hasRead) {
                return knex('user').where('id', hasRead.userId).first();
            }
        }
    }
});

const paginationArgs = {
    first: {
        type: graphql.GraphQLInt,
        defaultValue: 10
    },
    offset: {
        type: graphql.GraphQLInt
    }
};

const QueryType = new graphql.GraphQLObjectType({
    name: 'Query',
    fields: {
        users: {
            type: graphql.GraphQLList(UserType),
            args: paginationArgs,
            resolve(root, args) {
                let query = knex('user');

                const limit = args.first;
                const offset = args.offset;

                if (limit) {
                    query = query.limit(limit);
                }

                if (offset) {
                    query = query.offset(offset);
                }

                return query;
            }
        },
        user: {
            type: UserType,
            args: {
                id: {
                    type: graphql.GraphQLNonNull(graphql.GraphQLID)
                }
            },
            resolve(root, args) {
                return knex('user').where('id', args.id).first();
            }
        },
        books: {
            type: graphql.GraphQLList(BookType),
            args: {
                fiction: {
                    type: graphql.GraphQLBoolean
                }, ...paginationArgs
            },
            resolve(root, args) {
                let query = knex('book');
                console.log(args);
                if (args.fiction != null) {
                    query = query.where('fiction', args.fiction);
                }

                const limit = args.first;
                const offset = args.offset;

                if (limit) {
                    query = query.limit(limit);
                }

                if (offset) {
                    query = query.offset(offset);
                }
                return query;
            }
        }
    }
});

const MutationType = new graphql.GraphQLObjectType({
    name: 'Mutation',
    fields: () => {
        return {
            rateBook: {
                type: HasReadType,
                description: 'Rate a book or update a rating',
                args: {
                    user: {
                        type: graphql.GraphQLNonNull(graphql.GraphQLID)
                    },
                    book: {
                        type: graphql.GraphQLNonNull(graphql.GraphQLID)
                    },
                    rating: {
                        type: graphql.GraphQLID
                    },
                },
                resolve(source, args) {
                    const userId = args.user;
                    const bookId = args.book;
                    const rating = args.rating;

                    return rateBook(bookId, userId, rating);
                }
            },
            deleteRating: {
                type: QueryType,
                description: 'Delete a book rating',
                args: {
                    user: {
                        type: graphql.GraphQLNonNull(graphql.GraphQLID)
                    },
                    book: {
                        type: graphql.GraphQLNonNull(graphql.GraphQLID)
                    }
                },
                resolve(source, args) {
                    const userId = args.user;
                    const bookId = args.book;

                    deleteRating(bookId, userId);
                    return QueryType;
                }
            }
        }
    }
});

const schema = new graphql.GraphQLSchema({query: QueryType, mutation: MutationType});
module.exports = schema;