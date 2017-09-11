const express = require('express');
const {authenticated} = require('./auth');
const router = express.Router();

router.use('/auth', require('./auth').router);
router.use('/season', authenticated, require('./season').router);
router.use('/application', authenticated, require('./application').router);

module.exports = { router };