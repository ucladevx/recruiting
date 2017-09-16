const error = require('../error');
const config = require('../config');
const logger = require('../logger');
const devsetup = require('./devsetup');
const Sequelize = require('sequelize');

const db = new Sequelize(config.database.db, config.database.user, config.database.pass, {
  dialect: 'postgres',
  host: config.database.host,
  logging: false,
});

/**
 * Create models from schemas
 */
const User = require('./schema/user')(Sequelize, db);
const Season = require('./schema/season')(Sequelize, db);
const Application = require('./schema/application')(Sequelize, db);

/**
 * DB setup function to sync tables and add admin if doesn't exist
 */
const setup = (force) => {
  const p = db.sync({ force }).catch(err => {
    logger.error(err);
    process.exit(1);
  });

  if (config.database.devSetup && config.isDevelopment)
    return p.then(() => devsetup(User, Season, Application));
  return p;
};

/**
 * Handles database errors (separate from the general error handler and the 404 error handler)
 *
 * Specifically, it intercepts validation errors and presents them to the user in a readable
 * manner. All other errors it lets fall through to the general error handler middleware.
 */
const errorHandler = (err, req, res, next) => {
  if (!err || !(err instanceof Sequelize.Error))
    return next(err);
  if (err instanceof Sequelize.ValidationError) {
    const message = `Validation Error: ${err.errors.map(e => e.message).join('; ')}`;
    return next(new error.HTTPError(err.name, 422, message))
  }
  return next(new error.HTTPError(err.name, 500, err.message));
};

module.exports = {
  User,
  Season,
  Application,
  errorHandler,
  setup,
};