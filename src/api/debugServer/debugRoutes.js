const express = require('express');
const router = express.Router();
const debugMode = global.appConfig.debugMode;
const healthCheckService = require('../services/healthCheckService');

router.get('/', async (req, res) => {
    const healthRes = await healthCheckService.getHealth();
    console.log(healthRes);
    res.json(healthRes);
});

module.exports = router