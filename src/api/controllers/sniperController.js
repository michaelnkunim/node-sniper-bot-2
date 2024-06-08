const sniperService = require('../services/sniperService');
const responsePreprocessor = require('../middlewares/responseProcessor');


async function snipe(req, res, serviceFn) {
    try {
        const data =  await sniperService.snipe(req);
       
        responsePreprocessor.sendSuccessResult(res, data, req);
    } catch (err) {
        responsePreprocessor.sendError(res, err, req);
    }
}

module.exports = {
    snipe
};