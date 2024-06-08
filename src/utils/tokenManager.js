const jwt = require('jsonwebtoken');
const commonUtils = require('./commonUtils');

let tokenKey;

function init() {
    tokenKey = "GLOBALdexUpSECRETKEYPLEASEUSEWISELY"; //commonUtils.getRandomHexString();
    //tokenKey = commonUtils.getRandomHexString();
}

function createToken(data, options = { expiresIn: global.appConfig.tokenTimeout, }) {
    const token = jwt.sign(data, tokenKey, options);
    return token;
}

function verifyToken(token) {
    return jwt.verify(token, tokenKey);
}

function decodeToken(token) {
    return jwt.decode(token);
}


module.exports = {
    init,
    createToken,
    verifyToken,
    decodeToken
}