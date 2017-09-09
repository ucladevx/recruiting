const _ = require('underscore');
const uuid = require('uuid');
const bcrypt = require('bcryptjs');

const HASH_ROUNDS = 8;

module.exports = (Sequelize, db) => {
  /*********************************
   * SCHEMA
   *********************************/

	const User = db.define('user', {
		id: {
			type: Sequelize.STRING,
			primaryKey: true,
			defaultValue: () => uuid.v4().split('-').pop(),
		},

		// email address of the user
		email: {
			type: Sequelize.STRING,
			allowNull: false,
			unique: true,
			validate: {
				isEmail: {
					msg: "The email you entered is not valid"
				},
				notEmpty: {
					msg: "The email is a required field"
				}
			}
		},

		// type of account
		//   RESTRICTED - not used currently
		//   STANDARD   - a regular member
		//   ADMIN      - admin type user
		accessType: {
			type: Sequelize.ENUM('RESTRICTED','STANDARD','ADMIN'),
			defaultValue: 'STANDARD'
		},

		// account state
		//   PENDING        - account pending activation (newly created)
		//   ACTIVE         - account activated and in good standing
		//   BLOCKED        - account is blocked, login is denied
		//   PASSWORD_RESET - account has requested password reset
		state: {
			type: Sequelize.ENUM('PENDING', 'ACTIVE', 'BLOCKED', 'PASSWORD_RESET'),
			defaultValue: 'PENDING'
		},

		// user's password hash
		hash: {
			type: Sequelize.STRING,
			allowNull: false,
			validate: {
				notEmpty: {
					msg: "The password cannot be empty"
				}
			}
		},

		// date account created
		accountCreated: {
			type: Sequelize.DATE,
			defaultValue: Sequelize.NOW
		},
	
		// date of last login
		lastLogin: {
			type: Sequelize.DATE,
			defaultValue: Sequelize.NOW
		},
	}, {
		// creating indices on frequently accessed fields improves efficiency
		indexes: [
			// a hash index on the id makes lookup by id O(1)
			{
				unique: true,
				fields: ['id']
			},

			// a hash index on the email makes lookup by email O(1)
			{
				unique: true,
				fields: ['email']
			},
		]
  });
  
	/*********************************
	 * STATICS
	 *********************************/

	User.findById = function(id) {
		return this.findOne({ where : { id } });
	};

	User.findByEmail = function(email) {
		return this.findOne({ where : { email } });
	};

	User.generateHash = function(password) {
		return bcrypt.hash(password, HASH_ROUNDS);
	};
  
	/*********************************
	 * METHODS
	 *********************************/

	User.prototype.verifyPassword = function(password) {
		return bcrypt.compare(password, this.getDataValue('hash'));
	};

	User.prototype.isAdmin = function() {
		return this.getDataValue('accessType') === 'ADMIN';
	};

	User.prototype.isStandard = function() {
		return this.getDataValue('accessType') === 'STANDARD';
	};

	User.prototype.isActive = function() {
		return this.getDataValue('state') === 'ACTIVE';
	};

	User.prototype.isPending = function() {
		return this.getDataValue('state') === 'PENDING';
	};

	User.prototype.isBlocked = function() {
		return this.getDataValue('state') === 'BLOCKED';
	};

	return User;
};
