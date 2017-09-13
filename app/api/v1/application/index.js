const express = require('express');
const error = require('../../../error');
const auth = require('../auth');
const routes = require('./routes');
const router = express.Router();

router.route('/:id?')
.all((req, res, next) => {
  req.routes = req.user.isAdmin() ? routes.AdminRoutes : routes.UserRoutes;
  next();
})
.get((req, res, next) => req.routes.getApplications(req, res, next))
.put((req, res, next) => req.routes.updateApplication(req, res, next))
.delete((req, res, next) => req.routes.deleteApplication(req, res, next));

router.route('/create')
.all(auth.requireUser('Admins cannot create applications'))
.post(routes.UserRoutes.createApplication);

router.route('/:id/submit')
.all(auth.requireUser('Admins cannot submit applications'))
.post(routes.UserRoutes.submitApplication);

router.route('/:id/review')
.all(auth.requireAdmin())
.post(routes.AdminRoutes.reviewApplication);

module.exports = { router };