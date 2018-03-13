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
			type: Sequelize.ENUM('IN_PROGRESS','SUBMITTED','REJECTED','SCHEDULE_INTERVIEW','PENDING_INTERVIEW','COMPLETED_INTERVIEW','ACCEPTED'),
			defaultValue: 'IN_PROGRESS'
		},

		/* Regarding initial review */

		// any notes given on this application
		notes: {
			type: Sequelize.STRING,
		},

		// a rating for this application
		// Frontend should deal with guaranteeing rating values to be in range [1,5]
		rating: {
			type: Sequelize.INTEGER,
			defaultValue: 0,
		},

		/* Regarding interview review */

		// available times and dates for interview
		availability: {
			type: Sequelize.ARRAY(Sequelize.DATE),
		},

		// date and time for interview
		interviewTime: {
			type: Sequelize.DATE,
		},

		// notes pertaining to interview
		interviewNotes: {
			type: Sequelize.STRING,
		},

		// rating pertaining to interview
		interviewRating: {
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

	Application.sanitizeAvailability = function(availability) {
		return availability; // for now don't sanitize: later need to guarantee no bad times/dates given
	};

	// sanitize relevant fields for app review
	Application.sanitizeAdminAppReview = function(review) {
		return _.pick(review, ['notes', 'rating', 'status']);
	};

	// sanitize relevant fields for interview
	Application.sanitizeAdminInterviewReview = function(review) {
		return _.pick(review, ['interviewNotes', 'interviewRating', 'status']);
	};

	// sanitize relevant fields for interview
	Application.sanitizeAdminScheduleInterview = function(review) {
		return _.pick(review, ['interviewTime']);
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
		const keys = ['id', 'user', 'season', 'seasonName', 'status', 'interviewTime', 'availability', 'profile', 'dateSubmitted'];
		if (admin)
			keys.push('notes', 'rating');
		if (!admin && (this.rejected() || this.accepted()))
			keys.push('notes');
		return _.object(keys, keys.map(key => this.getDataValue(key)));
	};

	Application.prototype.inProgress = function() {
		return this.getDataValue('status') === 'IN_PROGRESS';
	};

	Application.prototype.submitted = function() {
		return this.getDataValue('status') === 'SUBMITTED';
	};

	Application.prototype.rejected = function() {
		return this.getDataValue('status') === 'REJECTED';
	};

	Application.prototype.scheduling_interview = function() {
		return this.getDataValue('status') === 'SCHEDULE_INTERVIEW';
	};

	Application.prototype.interview_pending = function() {
		return this.getDataValue('status') === 'PENDING_INTERVIEW';
	};

	Application.prototype.accepted = function() {
		return this.getDataValue('status') === 'ACCEPTED';
	};

	Application.prototype.interviewed = function() {
		return this.getDataValue('status') === 'COMPLETED_INTERVIEW';
	}

	return Application;
};
