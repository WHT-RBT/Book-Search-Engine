const { User, Book } = require('../models');
const { AuthenticationError } = require('apollo-server-express');
const { signToken } = require('../utils/auth');

const resolvers = {
    Query: {
        me: async (parent, args, context) => {
            if (context.user) {
                const data = await User.findOne({ _id: context.user._id }).select('-__v -password');
                return data;
            } else {
                return console.log("error! Not logged in!")
            }

        },
    },
    Mutation: {
        login: async (parent, { email, password }) => {
            const user = await User.findOne({ email });
            if (!user) {
                throw new AuthenticationError('No user found with this email address');
            }
            const correctPw = await user.isCorrectPassword(password);
            if (!correctPw) {
                throw new AuthenticationError('Incorrect credentials');
            }
            const token = signToken(user);
            return { token, user };
        },
        addUser: async (parent, args) => {
            const user = await User.create(args);
            const token = signToken(user);
            return { token, user };
        },
        saveBook: async (parent, { authors, description, bookId, image, link, title }, context) => {
            if (!context.user) {
                throw new AuthenticationError('You need to be logged in to save a book.');
            }
            const book = await Book.create({
                authors, description, bookId, image, link, title
            });
        
            await User.findOneAndUpdate(
                { _id: context.user._id },
                { $addToSet: { savedBooks: book._id } }
            );
        
            return User.findOne({ _id: context.user._id }).populate('savedBooks');
        },
        

        removeBook: async (parent, { bookId }) => {
            return Book.findOneAndDelete({ _id: bookId });
        },
    },
};

module.exports = resolvers;