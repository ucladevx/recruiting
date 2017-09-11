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

		// name of recruiting season (e.g. Fall 2017)
		name: {
			type: Sequelize.STRING,
			allowNull: false,
			validate: {
				notEmpty: {
					msg: "The recruiting season name is a required field"
				}
			}
		},

		// start date+time of recruiting season
		startDate: {
			type: Sequelize.DATE,
			allowNull: false,
			validate: {
				notEmpty: {
					msg: "The recruiting season start date is a required field"
				}
			}
		},
		
		// end date+time of recruiting season
		endDate: {
			type: Sequelize.DATE,
			allowNull: false,
			validate: {
				notEmpty: {
					msg: "The recruiting season end date is a required field"
				}
			}
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
				startDate : { $lt : date },
				endDate   : { $gt : date },
			}
		});
	};

	Season.getLatest = function() {
		return this.findOne({
			order: [['startDate', 'DESC']]
		});
	};

	Season.findForDates = function(start, end) {
		// not:
		//  - dbStart---------------dbEnd   start----------------end
		//    or
		//  -  start---------------end    dbStart----------------dbEnd
		return this.findAll({
			where: {
				$not: {
					$or: {
						startDate : { $gt: end },
						endDate   : { $lt: start },
					}
				}
			}
		});
	}

	Season.destroyById = function(id) {
		return this.destroy({ where: { id } });
	}

	Season.sanitize = function(season) {
		const obj = _.pick(season, ['name', 'startDate', 'endDate']);
		if (obj.startDate) {
			obj.startDate = new Date(obj.startDate);
			if (isNaN(obj.startDate))
				delete obj.startDate;
		}
		if (obj.endDate) {
			obj.endDate = new Date(obj.endDate);
			if (isNaN(obj.endDate))
				delete obj.endDate;
		}
		return obj;
	}
  
	/*********************************
	 * METHODS
	 *********************************/

	Season.prototype.getPublic = function() {
		const keys = ['id', 'name', 'startDate', 'endDate'];
		return _.object(keys, keys.map(key => this.getDataValue(key)));
	}

	return Season;
};
