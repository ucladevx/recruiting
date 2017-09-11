const express = require('express');
const auth = require('../auth');
const { SeasonRoutes } = require('./routes');
const router = express.Router();

router.route('/:id?')
.all(auth.requireAdmin())
.get(SeasonRoutes.getSeasons)
.post(SeasonRoutes.addSeason)
.delete(SeasonRoutes.deleteSeason);

module.exports = { router };