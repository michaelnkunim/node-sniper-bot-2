const encryptionUtil = require('../../utils/encryptionUtils');

function decryptionMiddleWare(req, res, next) {
    const isEncryptedRequest = req.body && req.body.check && req.body.result;
    if (isEncryptedRequest) {
        const decryptedData = Object.assign({ isEncryptedRequest: true }, encryptionUtil.getDecryptedRequestData(req.body));
        req.body = decryptedData;
    }
    next();
}

module.exports = decryptionMiddleWare;