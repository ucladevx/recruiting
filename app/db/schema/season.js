const _ = require('underscore');
const uuid = require('uuid');

module.exports = (Sequelize, db) => {
  /*********************************
   * SCHEMA
   *********************************/

	const Season = db.define('season', {
		id: {
			type: Sequelize.STRING,
			primaryKey: true,
			defaultValue: () => uuid.v4().split('-').pop(),
		},

		// email address of the user
		title: {
			type: Sequelize.STRING,
			allowNull: false,
			validate: {
				notEmpty: {
					msg: "The recruiting season title is a required field"
				}
			}
		},

		// start date+time of recruiting season
		startDate: {
			type: Sequelize.DATE,
			allowNull: false,
		},
		
		// end date+time of recruiting season
		endDate: {
			type: Sequelize.DATE,
			allowNull: false,
		},
	}, {
		// creating indices on frequently accessed fields improves efficiency
		indexes: [
			// a hash index on the id makes lookup by id O(1)
			{
				unique: true,
				fields: ['id']
			},

			// a btree index on start date make lookup by date O(log(n))
			{
					name: 'season_start_date_btree_index',
					method: 'BTREE',
					fields: ['startDate', { attribute: 'startDate', order: 'ASC' }]
			},

			// a btree index on end date make lookup by date O(log(n))
			{
					name: 'season_end_date_btree_index',
					method: 'BTREE',
					fields: ['endDate', { attribute: 'endDate', order: 'ASC' }]
			},
		]
  });
  
	/*********************************
	 * STATICS
	 *********************************/

	Season.findById = function(id) {
		return this.findOne({ where : { id } });
	};

	Season.findForDate = function(date) {
		return this.findOne({
			where: {
				startDate : { $lt : now },
				endDate   : { $gt : now },
			}
		});
	};
  
	/*********************************
	 * METHODS
	 *********************************/

	Season.prototype.getPublic = function() {
		const keys = ['id', 'title', 'startDate', 'endDate'];
		return _.object(keys, keys.map(key => this.getDataValue(key)));
	}

	return Season;
};
