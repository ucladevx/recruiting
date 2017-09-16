const _ = require('underscore');
const uuid = require('uuid');

module.exports = (Sequelize, db) => {
  /*********************************
   * SCHEMA
   *********************************/

	const Application = db.define('application', {
		id: {
			type: Sequelize.STRING,
			primaryKey: true,
			defaultValue: () => uuid.v4().split('-').pop(),
		},

		// user that the application belongs to
		user: {
			type: Sequelize.STRING,
			allowNull: false,
		},

		// season that the application was created in
		season: {
			type: Sequelize.STRING,
			allowNull: false,
		},
	
		// season name for dispay purposes
		seasonName: {
			type: Sequelize.STRING,
			allowNull: false,
		},

		// application status
		status: {
			type: Sequelize.ENUM('IN_PROGRESS','SUBMITTED','REJECTED','ACCEPTED'),
			defaultValue: 'IN_PROGRESS'
		},

		// any notes given on this application
		notes: {
			type: Sequelize.STRING,
		},

		// a rating for this application
		rating: {
			type: Sequelize.INTEGER,
			defaultValue: 0,
		},

		// user inputed profile associated with this application
		profile: {
			type: Sequelize.JSONB,
			defaultValue: {},
		},

		// end date+time of recruiting season
		lastUpdated: {
			type: Sequelize.DATE,
			defaultValue: Sequelize.NOW,
		},

		// date that the application was submitted
		dateSubmitted: {
			type: Sequelize.DATE,
		},
	}, {
		// creating indices on frequently accessed fields improves efficiency
		indexes: [
			// a hash index on the id makes lookup by id O(1)
			{
				unique: true,
				fields: ['id']
			},

			// a btree index on user makes getting user apps O(logn)
			{
					name: 'application_user_btree_index',
					method: 'BTREE',
					fields: ['user', { attribute: 'user', order: 'ASC' }]
			},
		]
  });
  
	/*********************************
	 * STATICS
	 *********************************/

	Application.findById = function(id) {
		return this.findOne({ where : { id } });
	};

	Application.findByUser = function(user) {
		return this.findAll({ where: { user } });
	};

	Application.userCreatedForSeason = function(user, season) {
		return this.findOne({ where: { user, season } });
	}

	Application.findBySeason = function(season) {
		return this.findAll({ where: { season } });
	};

	Application.latestForUser = function(user) {
		return this.findOne({
			where: { user },
			order: [['createdAt', 'DESC']],
		});
	}

	Application.destroyById = function(id) {
		return this.destroy({ where: { id }});
	}

	Application.sanitizeProfile = function(profile) {
		return profile; // for now don't sanitize
	};

	Application.sanitizeAdminReview = function(review) {
		return _.pick(review, ['notes', 'rating', 'status']);
	};
  
	/*********************************
	 * METHODS
	 *********************************/

	Application.prototype.getMetaData = function(admin) {
		const keys = ['id', 'user', 'season', 'seasonName', 'status'];
		if (admin)
			keys.push('notes', 'rating', 'dateSubmitted');
		
		const obj = _.object(keys, keys.map(key => this.getDataValue(key)));

		if (admin && this.getDataValue('profile')) {
			const profileKeys = ['firstName', 'lastName', 'gender', 'year', 'rolePreference'];
			const profile = this.getDataValue('profile');
			obj.profile = _.object(profileKeys, profileKeys.map(key => profile[key]));
		}

		return obj;
	};

	Application.prototype.getPublic = function(admin) {
		const keys = ['id', 'user', 'season', 'seasonName', 'status', 'profile'];
		if (admin)
			keys.push('notes', 'rating', 'dateSubmitted');
		if (!admin && (this.rejected() || this.accepted()))
			keys.push('notes');
		return _.object(keys, keys.map(key => this.getDataValue(key)));
	};

	Application.prototype.inProgress = function() {
		return this.getDataValue('status') === 'IN_PROGRESS';
	};

	Application.prototype.rejected = function() {
		return this.getDataValue('status') === 'REJECTED';
	};

	Application.prototype.accepted = function() {
		return this.getDataValue('status') === 'ACCEPTED';
	};

	return Application;
};
