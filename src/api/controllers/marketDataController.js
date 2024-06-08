const marketDataService = require('../services/marketDataService');
const responsePreprocessor = require('../middlewares/responseProcessor');


async function getGainersAndLosers(req, res, serviceFn) {
    try {
        const data =  await marketDataService.getGainersAndLosers(req);
       
        responsePreprocessor.sendSuccessResult(res, data, req);
    } catch (err) {
        responsePreprocessor.sendError(res, err, req);
    }
}

module.exports = {
    getGainersAndLosers
};