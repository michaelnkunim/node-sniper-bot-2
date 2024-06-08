const express = require('express');
const router = express.Router();
const marketController = require('../controllers/marketDataController');

router.post('/get-gainers-and-losers', marketController.getGainersAndLosers);

module.exports = router