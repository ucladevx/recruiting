const express = require('express');
const jwt = require('jsonwebtoken');
const config = require('../../../config');
const error = require('../../../error');
const { User } = require('../../../db');
const { AuthRoutes } = require('./routes');
const router = express.Router();

/**
 * Middleware to require a user token
 * 
 * @param {String} message 
 */
const requireUser = message => {
	return (req, res, next) => {
		if (req.user.isAdmin())
			return next(new error.Forbidden(message));
		return next();
	}
}

/**
 * Middleware to require an admin token
 * 
 * @param {String} message 
 */
const requireAdmin = message => {
	return (req, res, next) => {
		if (!req.user.isAdmin())
			return next(new error.Forbidden(message));
		return next();
	}
}

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


router.post("/login", AuthRoutes.login);
router.post("/register", AuthRoutes.register);

module.exports = { 
	router, 
	authenticated,
	requireUser,
	requireAdmin,
};
