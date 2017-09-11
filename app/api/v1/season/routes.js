const error = require('../../../error');
const { Season } = require('../../../db');

/**
 * Routes for recruitment season operations
 */
class SeasonRoutes {
  /**
   * Execute a GET request.
   * 
   * Gets all recruitment seasons.
   * 
   * @param {*} req 
   * @param {*} res 
   * @param {*} next 
   */
  static getSeasons(req, res, next) {
    Season.findAll()
      .then(seasons => 
        res.json({
          seasons: seasons.map(season => season.getPublic())
        })
      )
      .catch(next);
  }

  /**
   * Execute a POST request.
   * 
   * Adds a recruitment season. Checks that dates are valid
   * and don't overlap with an existing recruitment season.
   * 
   * @param {*} req 
   * @param {*} res 
   * @param {*} next 
   */
  static addSeason(req, res, next) {
    if (!req.body || !req.body.season)
      return next(new error.BadRequest());

    const season = Season.sanitize(req.body.season);
    if (season.startDate && season.endDate) {
      if (new Date(season.startDate) >= new Date(season.endDate)) {
        return next(new error.BadRequest('Start date must be before end date'));
      }
    }

    Season.findForDates(season.startDate, season.endDate)
      .then(seasons => {
        if (seasons && seasons.length > 0)
          throw new error.BadRequest('A recruiting season overlaps with that date range');
        return Season.create(season);
      })
      .then(season => res.json({ season: season.getPublic() }))
      .catch(next);
  }

  /**
   * Execute a DELETE request
   * 
   * Deletes a recruitment season given a season ID
   * 
   * @param {*} req 
   * @param {*} res 
   * @param {*} next 
   */
  static deleteSeason(req, res, next) {
    if (!req.params.id)
      return next(new error.BadRequest('Season ID must be specified'));
    Season.destroyById(req.params.id)
      .then(numDeleted => res.json({ numDeleted }))
      .catch(next);
  }
}

module.exports = { SeasonRoutes };