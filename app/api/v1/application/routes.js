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
			.then(application => {
				if (!application)
					throw new error.NotFound('Application not found');
				return application;
			})
			.then(application => res.json({ application: application.getPublic(true) }))
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

	// /**
	//  * Execute a PUT request.
	//  * 
	//  * PUT update scheduled time of interview
	//  * 
	//  * @param {*} req
	//  * @param {*} res
	//  * @param {*} next
	//  */
	// static updateAvailability(req, res, next) {
	// 	if (!req.params.id)
	// 		return next(new error.BadRequest('Application ID must be specified'));
	// 	if (!req.body.profile)
	// 		return next(new error.BadRequest('Profile must be specified'));

	// 	Application.findById(req.params.id)
	// 		.then(application => {
	// 			if (!application)
	// 				throw new error.NotFound('Application not found');
	// 			if (application.user !== req.user.id)
	// 				throw new error.Forbidden('You cannot update this application');
	// 			if (!application.interviewing())
	// 				throw new error.Forbidden('Candidate cannot be scheduled for interview');

	// 			if (interviewTime === undefined) {
	// 				return next(new error.BadRequest('interviewTime field required'));
	// 			}
				
	// 			// check to see that interviewTime is not already booked
	// 			let currSeason;
	// 			Season.findForDate(application.dateSubmitted)
	// 				.then(season => {
	// 					if (!season)
	// 						throw new error.BadRequest('No recruiting seasons open right now');
	// 					if (season.alreadyScheduled(req.body.interviewTime)) {
	// 						throw new error.BadRequest('Interview time is already scheduled, please choose a different time');
	// 					}
	// 				});
				
	// 			// update the interviewTime of applicant
	// 			return application.update({
	// 				interviewTime: req.body.interviewTime,	// no sanitization required
	// 				lastUpdated: new Date(),
	// 			});
	// 		})
	// 		.then(application => res.json({ application: application.getPublic() }))
	// 		.catch(next);
	// }

	// /**
	//  * Execute a GET request.
	//  * 
	//  * GET update available interview times
	//  * 
	//  * @param {*} req
	//  * @param {*} res
	//  * @param {*} next
	//  */
	// static getAvailability(req, res, next) {
	// 	if (!req.params.id)
	// 		return next(new error.BadRequest('Application ID must be specified'));

	// 	Application.findById(req.params.id)
	// 		.then(application => {
	// 			if (!application)
	// 				throw new error.NotFound('Application not found');
	// 			if (application.user !== req.user.id)
	// 				throw new error.Forbidden('You cannot get availability for this application');
	// 			if (!application.interviewing())
	// 				throw new error.Forbidden('Candidate is not interviewing: no availability available');

	// 			return {
	// 				availability: application.availability
	// 			};
	// 		})
	// 		.then(application => res.json({ application: application.getPublic() }))
	// 		.catch(next);
	// }

	/**
	 * Review an application by ID.
	 *
	 * An admin can add notes and a rating and change its status 
	 * SUBMITTED 	-> (REJECTED, SCHEDULE_INTERVIEW)
	 * SCHEDULE_INTERVIEW -> (REJECTED, PENDING_INTERVIEW)
	 * PENDING_INTERVIEW -> (REJECTED, COMPLETED_INTERVIEW)
	 * COMPLETED_INTERVIEW -> (REJECTED, ACCEPTED)
	 * REJECTED		-> (INTERVIEWING, ACCEPTED [after interview > -1])  * if accidentally rejected someone
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

				/* FSM State change code */
				if (req.body.application.status == null)
				{
					//this is when they press save and only when they press save
					//grab the stuff from req.body.application and package it into a variable, add to the array
					var temp = {
						graderName: req.body.application.graderName,
						notes: req.body.application.notes,
						technicalExperience: req.body.application.technicalExperience,
						potentialToCollab: req.body.application.potentialToCollab,
						execution: req.body.application.execution,
						teNotes: req.body.application.teNotes,
						ptcNotes: req.body.application.ptcNotes,
						execNotes: req.body.application.execNotes,
					}; 

					var tempArr = [];
					if (application.graderReview != null) {
						tempArr = application.graderReviews; //if not an empty array, get the old stuff
					}
					tempArr.push(temp); //push the grader review object 

					//return application.update(Application.sanitizeAdminAppReview(req.body.application));
					return application.update({
						notes: req.body.application.notes, //public notes
						//graderReview: application.graderReview.push(temp),
						graderReviews: tempArr,
					});
				}
				else if (application.submitted() && (req.body.application.status === 'SCHEDULE_INTERVIEW' || 
				req.body.application.status === 'REJECTED')) {
					// SUBMITTED -> (REJECTED, SCHEDULE_INTERVIEW)
					return application.update(Application.sanitizeAdminAppReview(req.body.application));
				}
				else if (application.scheduling_interview() && (req.body.application.status === 'PENDING_INTERVIEW' || 
				req.body.application.status === 'REJECTED')) {
					// SCHEDULE_INTERVIEW -> (REJECTED, PENDING_INTERVIEW)
					return application.update(Application.sanitizeAdminScheduleInterview(req.body.application));
				}
				/*else if (application.interview_pending() && (req.body.application.status === 'COMPLETED_INTERVIEW' || 
				req.body.application.status === 'REJECTED')) {
					// PENDING_INTERVIEW -> (REJECTED, COMPLETED_INTERVIEW)
					return application.update(Application.sanitizeAdminInterviewReview(req.body.application));
				}*/
				else if (application.interview_pending() && (req.body.application.status === 'ACCEPTED' || 
				req.body.application.status === 'REJECTED')) {
					// PENDING_INTERVIEW -> (REJECTED, COMPLETED_INTERVIEW)
					return application.update({
						status: req.body.application.status,
						lastUpdated: new Date(),
					});
				}
				/*else if (application.interviewed() && (req.body.application.status === 'ACCEPTED' || 
				req.body.application.status === 'REJECTED')) {
					// COMPLETED_INTERVIEW -> (REJECTED, ACCEPTED)
					return application.update({
						status: req.body.application.status,
						lastUpdated: new Date(),
					});
				}*/

				else if (application.rejected() && req.body.application.status === 'SCHEDULE_INTERVIEW') {
					// REJECTED -> SCHEDULE_INTERVIEW
					return application.update(Application.sanitizeAdminAppReview(req.body.application));
				}
				else if (application.rejected() && req.body.application.status === 'PENDING_INTERVIEW') {
					// REJECTED -> PENDING_INTERVIEW
					return application.update(Application.sanitizeAdminScheduleInterview(req.body.application));
				}
		/*		else if (application.rejected() && req.body.application.status === 'COMPLETED_INTERVIEW') {
					// REJECTED -> COMPLETED_INTERVIEW
					return application.update(Application.sanitizeAdminInterviewReview(req.body.application));
				} */
				else if (application.rejected() && req.body.application.status === 'ACCEPTED' && application.interviewed()) {
					// REJECTED -> ACCEPTED
					return application.update({
						status: req.body.application.status,
						lastUpdated: new Date(),
					});
				}

				/* Invalid datapath */
				return next(new error.BadRequest('Application data invalid: status change unsupported'));
			})
			.then(application => res.json({ application: application.getPublic(true) }))
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
			.then(application => res.json({ application: application.getPublic() }))
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
			.then(application => res.json({ application: application.getPublic() }))
			.catch(next);
	}

	/**
	 * Execute a PUT request.
	 * 
	 * PUT update availability for interview
	 * 
	 * @param {*} req
	 * @param {*} res
	 * @param {*} next
	 */
	static updateAvailability(req, res, next) {
		if (!req.params.id)
			return next(new error.BadRequest('Application ID must be specified'));
		if (!req.body.availability || req.body.availability.length == 0)
			return next(new error.BadRequest('Availability field required'));

		Application.findById(req.params.id)
			.then(application => {
				if (!application)
					throw new error.NotFound('Application not found');
				if (application.user !== req.user.id)
					throw new error.Forbidden('You cannot update this application');
				if (!application.scheduling_interview())
					throw new error.Forbidden('You have not yet moved to the interview stage, or you are past this stage');

				// if (availability === undefined) {
				// 	return next(new error.BadRequest('availability field required'));
				// }
				return application.update({
					availability: Application.sanitizeAvailability(req.body.availability),
					lastUpdated: new Date(),
				});
			})
			.then(application => {
				return application.update({
						status: 'PENDING_INTERVIEW', //change status to pending interview
						lastUpdated: new Date(),
					});
			})
			.then(application => res.json({ application: application.getPublic() }))
			.catch(next);
	}

	// /**
	//  * Execute a GET request.
	//  * 
	//  * GET update available interview times
	//  * 
	//  * @param {*} req
	//  * @param {*} res
	//  * @param {*} next
	//  */
	// static getAvailability(req, res, next) {
	// 	if (!req.params.id)
	// 		return next(new error.BadRequest('Application ID must be specified'));

	// 	Application.findById(req.params.id)
	// 		.then(application => {
	// 			if (!application)
	// 				throw new error.NotFound('Application not found');
	// 			if (application.user !== req.user.id)
	// 				throw new error.Forbidden('You cannot get availability for this application');
	// 			if (!application.interviewing())
	// 				throw new error.Forbidden('Candidate is not interviewing: no availability available');

	// 			return {
	// 				availability: application.availability
	// 			};
	// 		})
	// 		.then(application => res.json({ application: application.getPublic() }))
	// 		.catch(next);
	// }

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
			.then(application => res.json({ application: application.getPublic() }))
			.catch(next);
	}

	static submitApplication(req, res, next) {
		Application.findById(req.params.id)
			.then(application => {
				if (!application)
					throw new error.NotFound('Application not found');
				if (!application.inProgress())
					throw new error.BadRequest('You can only submit in-progress applications.');
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