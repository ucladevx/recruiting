const _ = require('underscore');
const uuid = require('uuid');

module.exports = (Sequelize, db) => {
  /*********************************
   * SCHEMA
   *********************************/

	const Application = db.define('season', {
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

		// application status
		status: {
			type: Sequelize.ENUM('IN_PROGRESS','SUBMITTED','REJECTED', 'ACCEPTED'),
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
	}, {
		// creating indices on frequently accessed fields improves efficiency
		indexes: [
			// a hash index on the id makes lookup by id O(1)
			{
				unique: true,
				fields: ['id']
			},

			// a hash index on the user makes lookup by user O(1)
			{
				unique: true,
				fields: ['user']
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
		return this.findAll({ where: { user, season } });
	}

	Application.findBySeason = function(season) {
		return this.findAll({ where: { season } });
	};
  
	/*********************************
	 * METHODS
	 *********************************/

	Application.prototype.getPublic = function(admin) {
		const keys = ['id', 'user', 'season', 'status', 'profile'];
		if (admin)
			keys.push('notes', 'rating');
		return _.object(keys, keys.map(key => this.getDataValue(key)));
	}

	return User;
};
