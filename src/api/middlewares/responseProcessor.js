const encryptionUtil = require('../../utils/encryptionUtils');
const encryptionEnabled = global.appConfig.ENABLE_ENCRYPTION;

function sendSuccessResult(res, data, req) {
    const responseData = {
        code: 200,
        data,
        message: 'SUCCESS',
        success: true
    }
    return res.status(200).json((req.body && req.body.isEncryptedRequest) ? encryptionUtil.getEncryptedResponseData(responseData) : responseData)
}

function sendInvalidResult(res, data, req) {
    const responseData = {
        code: 200,
        message: data.message,
        msgCode: data.msgCode || '',
        success: false
    }
    return res.status(200).json((req.body && req.body.isEncryptedRequest) ? encryptionUtil.getEncryptedResponseData(responseData) : responseData)
}

function sendError(res, err, req) {
    let responseData = {
        code: 200,
        message: JSON.stringify(err, replacerFunc()),
        success: false
    }
    return res.status(500).json((req.body && req.body.isEncryptedRequest) ? encryptionUtil.getEncryptedResponseData(responseData) : responseData)
}

const replacerFunc = () => {
    const visited = new WeakSet();
    return (key, value) => {
      if (typeof value === "object" && value !== null) {
        if (visited.has(value)) {
          return;
        }
        visited.add(value);
      }
      return value;
    };
  };

module.exports = {
    sendSuccessResult,
    sendInvalidResult,
    sendError
}