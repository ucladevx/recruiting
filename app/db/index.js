const error = require('../error');
const config = require('../config');
const logger = require('../logger');
const mongoose = require('mongoose');
// mongoose.Promise = require('bluebird');

const setup = () => {
  logger.info("DB setup");
  mongoose.connect(config.database.mongo).catch(err => {
    logger.error(err);
    process.exit(1);
  });
}; 

const errorHandler = (err, req, res, next) => {
  console.log("got an error", err);
  if (err.name === 'MongoError')
    return next(new error.Unprocessable(err.message));
  return next(err);
};

module.exports = {
  User: require('./schema/user')(mongoose),
  errorHandler,
  setup,
};