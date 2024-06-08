const express = require('express');
const router = express.Router();
const sniperController = require('../controllers/sniperController');

router.post('/snipe', sniperController.snipe);

module.exports = router