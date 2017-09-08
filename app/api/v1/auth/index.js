const express = require('express');
const jwt = require('jsonwebtoken');
const config = require('../../../config');
const error = require('../../../error');
const log = require('../../../logger');
const { User } = require('../../../db');
const router = express.Router();

const TOKEN_EXPIRES = 86400; // 1 day in seconds

/**
 * Middleware function that determines whether or not a user is authenticated
 * and assigns the req.user object to their user info from the db
 * 
 * @param req The request object
 * @param res The response object
 * @param next The next-middleware function
 */
const authenticated = (req, res, next) => {
	// We're looking for a header in the form of:
	//   Authorization: Bearer <TOKEN>
	const authHeader = req.get('Authorization');
	if (!authHeader)
		return next(new error.Unauthorized());

	// authHead should be in the form of ['Bearer', '<TOKEN>']
	const authHead = authHeader.split(' ');
	if(authHead.length != 2 || authHead[0] !== 'Bearer' || authHead[1].length < 1)
		return next(new error.Unauthorized());

	const token = authHead[1];
	jwt.verify(token, config.session.secret, (err, decoded) => {
		if (err)
			return next(new error.Unauthorized());

		// if the user provided a valid token, use it to deserialize the UUID to
		// an actual user object
		User.findById(decoded.id).then(user => {
			if (!user)
				throw new error.Unauthorized();
			req.user = user;
		}).then(next).catch(next);
	});
};

/**
 * Login route.
 * 
 * POST body should be in the format of { email, password }
 * On success, this route will return a token
 */
router.post("/login", (req, res, next) => {
	if(!req.body.email || req.body.email.length < 1)
		return next(new error.BadRequest('Email must be provided'));

	if(!req.body.password || req.body.password.length < 1)
		return next(new error.BadRequest('Password must be provided'));

  let userInfo = null;
	User.findByEmail(req.body.email.toLowerCase()).then(user => {
		if (!user)
			throw new error.UserError('Invalid email or password');

		return user.verifyPassword(req.body.password).then(verified => {
			if (!verified)
				throw new error.UserError('Invalid email or password');
			userInfo = user;
		}).then(() => new Promise((resolve, reject) => {
			// create a token with the user's ID and privilege level
			jwt.sign({
				id    : user.id,
				admin : user.isAdmin(),
			}, config.session.secret, { expiresIn: TOKEN_EXPIRES }, (err, token) => err ? reject(err) : resolve(token));
		}));
	}).then(token => {
		// respond with the token upon successful login
		res.json({ error: null, token: token });
	}).catch(next);
});

/**
 * Registration route.
 * 
 * POST body accepts a user object (see DB schema for user, sanitize function)
 * Returns the created user on success
 */
router.post("/register", (req, res, next) => {
	if (!req.body.user)
		return next(new error.BadRequest('User must be provided'));
	if (!req.body.user.password)
		return next(new error.BadRequest('Password must be provided'));
	if (req.body.user.password.length < 10)
		return next(new error.BadRequest('Password should be at least 10 characters long'));

  const email = req.body.user.email;
  const password = req.body.user.password;
  // create the password hash
	User.generateHash(password).then(hash => {
		userModel.hash = hash;
		// add the user to the DB
		return User.create({
      email, hash
    });
	}).then(user => {
		// responsd with the newly created user
		res.json({ error: null });
	}).catch(next);
});

module.exports = { router, authenticated };
