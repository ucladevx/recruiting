const jwt = require('jsonwebtoken');
const config = require('../../../config');
const error = require('../../../error');
const log = require('../../../logger');
const { User } = require('../../../db');

const TOKEN_EXPIRES = 86400; // 1 day in seconds

/**
 * Routes for authentication
 */
class AuthRoutes {
  /**
   * Execute a POST to the login route.
   *
   * Takes two properties in the body: email and password, validates them,
   * and returns a token valid for 1 day if correct.
   *
   * Returns 400 if request is malformed.
   * Returns 401 if credentials are incorrect.
   * Returns 403 if account is blocked.
   *
   * @param {*} req
   * @param {*} res
   * @param {*} next
   */
  static login(req, res, next) {
    if (!req.body.email || req.body.email.length < 1)
      return next(new error.BadRequest('Email must be provided'));

    if (!req.body.password || req.body.password.length < 1)
      return next(new error.BadRequest('Password must be provided'));

    User.findByEmail(req.body.email.toLowerCase()).then(user => {
      if (!user)
        throw new error.Unauthorized('Invalid email or password');

      return user.verifyPassword(req.body.password).then(verified => {
        if (!verified)
          throw new error.Unauthorized('Invalid email or password');
        return user;
      }).then(() => new Promise((resolve, reject) => {
        // create a token with the user's ID and privilege level
        jwt.sign({
          id    : user.id,
          email : user.email,
          admin : user.isAdmin(),
        }, config.session.secret, { expiresIn: TOKEN_EXPIRES }, (err, token) => err ? reject(err) : resolve(token));
      }));
    }).then(token => {
      // respond with the token upon successful login
      res.json({ token });
    }).catch(next);
  }

  /**
   * Execute a POST to the register route
   *
   * Takes a `user` object in the body (req.body), which must have `email` and
   * `password fields. Password must be at least 10 characters long. If the email
   * is not registered, this route creates a user.
   *
   * @param {*} req
   * @param {*} res
   * @param {*} next
   */
  static register(req, res, next) {
    if (!req.body.user)
      return next(new error.BadRequest('User must be provided'));
    if (!req.body.user.password)
      return next(new error.BadRequest('Password must be provided'));
    if (req.body.user.password.length < 10)
      return next(new error.BadRequest('Password should be at least 10 characters long'));
    if (req.body.user.password !== req.body.user.confPassword)
      return next(new error.BadRequest('Passwords do not match'));

    const email = req.body.user.email.toLowerCase();
    const password = req.body.user.password;

    User.generateHash(password).then(hash => {
      return User.create({
        email, hash
      });
    }).then(() => res.json({})).catch(next);
  }
}

module.exports = { AuthRoutes }
