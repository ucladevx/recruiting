const error = require('../../../error');
const { Application, Season } = require('../../../db');

/**
 * Admin routes for application operations
 */
class AdminRoutes {
	/**
	 * Execute a GET request (bulk). 
	 * 
	 * If the season query is specified, return all applications in that season.
	 * Otherwise, get all applications
	 * 
	 * @param {*} req 
	 * @param {*} res 
	 * @param {*} next 
	 */
	static getApplications(req, res, next) {
		if (req.params.id)
			return AdminRoutes.getApplication(req, res, next);
		
		const getApplications = req.query.season ? Application.findBySeason(req.query.season) : Application.findAll();
		getApplications
			.then(applications => 
				res.json({
					applications: applications.map(application => 
						req.query.extended ? application.getPublic(true) : application.getMetaData(true)
					)
				})
			)
			.catch(next);
	}

	/**
	 * Execute a GET request (single). 
	 * 
	 * Get an application matching an ID
	 * 
	 * @param {*} req 
	 * @param {*} res 
	 * @param {*} next 
	 */
	static getApplication(req, res, next) {
		if (!req.params.id)
			return AdminRoutes.getApplications(req, res, next);
		
		Application.findById(req.params.id)
			.then(application => 
				res.json({
					application: application.getPublic(true)
				})
			)
			.catch(next);
	}

	/**
	 * Execute a PUT request.
	 * 
	 * Admins cannot PUT applications.
	 * 
	 * @param {*} req 
	 * @param {*} res 
	 * @param {*} next 
	 */
	static updateApplication(req, res, next) {
		next(new error.MethodNotAllowed());
	}

	/**
	 * Execute a DELETE request.
	 * 
	 * Deletes an application by ID. An admin can delete any application.
	 * 
	 * @param {*} req 
	 * @param {*} res 
	 * @param {*} next 
	 */
	static deleteApplication(req, res, next) {
		if (!req.params.id)
			return next(new error.BadRequest('Application ID must be specified'));
		Application.destroyById(req.params.id)
			.then(numDeleted => res.json({ numDeleted }))
			.catch(next);
	}

	/**
	 * Review an application by ID.
	 * 
	 * An admin can add notes and a rating and change its status (REJECTED, ACCEPTED)
	 * 
	 * @param {*} req 
	 * @param {*} res 
	 * @param {*} next 
	 */
	static reviewApplication(req, res, next) {
		if (!req.body.application)
			return next(new error.BadRequest('Application data must be specified'));
		Application.findById(req.params.id)
			.then(application => {
				if (!application)
					throw new error.NotFound('Application not found');
				return application.update(Application.sanitizeAdminReview(req.body.application));
			})
			.then(() => res.json({}))
			.catch(next);
	}
}

/**
 * User routes for application operations
 */
class UserRoutes {
	/**
	 * Execute a GET request (bulk).
	 * 
	 * Returns all applications created by the user
	 * 
	 * @param {*} req 
	 * @param {*} res 
	 * @param {*} next 
	 */
	static getApplications(req, res, next) {
		if (req.params.id)
			return UserRoutes.getApplication(req, res, next);

		Application.findByUser(req.user.id)
			.then(applications =>
				res.json({
					applications: applications.map(appliation => 
						req.query.extended ? application.getPublic() : appliation.getMetaData()
					)
				})
			)
			.catch(next);
	}

	/**
	 * Execute a GET request (single). 
	 * 
	 * Get an application matching an ID, making sure the user has permission to access
	 * 
	 * @param {*} req 
	 * @param {*} res 
	 * @param {*} next 
	 */
	static getApplication(req, res, next) {
		if (!req.params.id)
			return UserRoutes.getApplications(req, res, next);
		
		Application.findById(req.params.id)
			.then(application => {
				if (!application)
					throw new error.NotFound('Application not found.');
				if (application.user !== req.user.id)
					throw new error.Forbidden('You cannot view this application');
				return application;
			})
			.then(application => 
				res.json({
					application: application.getPublic(true)
				})
			)
			.catch(next);
	}

	/**
	 * Execute a PUT request.
	 * @param {*} req 
	 * @param {*} res 
	 * @param {*} next 
	 */
	static updateApplication(req, res, next) {
		if (!req.params.id)
			return next(new error.BadRequest('Application ID must be specified'));
		if (!req.body.profile)
			return next(new error.BadRequest('Profile must be speficied'));
		
		Application.findById(req.params.id)
			.then(application => {
				if (!application)
					throw new error.NotFound('Application not found');
				if (application.user !== req.user.id)
					throw new error.Forbidden('You cannot update this application');
				if (!application.inProgress())
					throw new error.Forbidden('You cannot update a submitted application');
				return application.update({
					profile: Application.sanitizeProfile(req.body.profile),
					lastUpdated: new Date(),
				});
			})
			.then(application => res.json({ application: application.getPublic(req.user.isAdmin()) }))
			.catch(next);
	}

	/**
	 * Execute a DELETE request.
	 * 
	 * Users cannot delete applications.
	 * 
	 * @param {*} req 
	 * @param {*} res 
	 * @param {*} next 
	 */
	static deleteApplication(req, res, next) {
		next(new error.MethodNotAllowed());
	}

	/**
	 * Create an application
	 * 
	 * A user can create an application. 
	 * The route will check the following conditions:
	 *  - Check if an application exists for the current user and season
	 *  - Check if the user has any previous applications
	 *    - if so, use profile to populate new application
	 *    - else create new application
	 * 
	 * 
	 * @param {*} req 
	 * @param {*} res 
	 * @param {*} next 
	 */
	static createApplication(req, res, next) {
		let currSeason;
		Season.findForDate(new Date())
			.then(season => {
				if (!season)
					throw new error.BadRequest('No recruiting seasons open right now');
				currSeason = season;
				return Application.latestForUser(req.user.id);
			})
			.then(application => {
				if (application && application.season === currSeason.id)
					throw new error.BadRequest('You have already created an application for this recruiting season');
				return Application.create({
					user: req.user.id,
					season: currSeason.id,
					seasonName: currSeason.name,
					profile: application ? application.profile : {},
				});
			})
			.then(application => res.json({ application: application.getPublic(false) }))
			.catch(next);
	}

	static submitApplication(req, res, next) {
		Application.findById(req.params.id)
			.then(application => {
				if (!application)
					throw new errors.NotFound('Application not found');
				if (!application.inProgress())
					throw new errors.BadRequest('You can only submit in-progress applications.');
				return application.update({
					status: 'SUBMITTED',
					dateSubmitted: new Date(),
				});
			})
			.then(application => res.json({ application: application.getPublic() }))
			.catch(next);
	}
}

module.exports = {
	AdminRoutes,
	UserRoutes,
};