const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

var parseString = require('xml2js').parseString;

function roundNoToTwoDecimal(num) {
    return parseFloat((Math.round(num * 100) / 100).toFixed(2));
}

async function sleep(timeInMS) {
    await new Promise(r => setTimeout(r, timeInMS));
}

function hashString(strToHash, salt, algo = 'sha512') {
    const hash = crypto.createHmac(algo, salt); /** Hashing algorithm sha512 */
    hash.update(strToHash);
    const value = hash.digest('hex');
    return value;
}

function getHashStringBase64(strToHash, salt, algo = 'sha512') {
    const hash = crypto.createHmac(algo, salt); /** Hashing algorithm sha512 */
    hash.update(strToHash);
    const value = hash.digest('base64');
    return value;
}

function getRandomHexString() {
    return crypto.randomBytes(64).toString('hex')
}

function getDashboardUrl(dashboardLandingRoute, baseUrl = global.appConfig.dashboard_url) {
    const url = `${baseUrl || ''}#/landing/${dashboardLandingRoute}`
    return url;
}

function getDataForUrl(data) {
    return Buffer.from(JSON.stringify(data)).toString('base64');
}

function base64EncodeString(str) {
    return Buffer.from(str).toString('base64');
}
function base64DecodeString(str) {
    return Buffer(str, 'base64').toString("ascii");
}
function getDashboardUrlWithData(dashboardLandingRoute, data) {
    return `${getDashboardUrl(dashboardLandingRoute)}/${getDataForUrl(data)}`
}

function serverTransferWithDataToDashboard(res, dashboardLandingRoute, data, baseDashboardURL = global.appConfig.dashboard_url) {
    const transferUrl = `${getDashboardUrl(dashboardLandingRoute, baseDashboardURL)}`;
    console.log(transferUrl);
    serverTransferWithData(res, transferUrl, data);
}

function serverTransferWithData(res, url, data) {
    const urlToRedirectTo = `${url}/${getDataForUrl(data)}`;
    console.log(urlToRedirectTo);
    res.redirect(urlToRedirectTo);
}

function serverTransfer(res, url) {
    res.redirect(url);
}

function getParsedXML(xmlString) {
    return new Promise((resolve, reject) => {
        parseString(xmlString, function (err, result) {
            if (err) {
                reject(err);
            }
            resolve(result);
        });
    });
}

function sanitizeFileName(fileName) {
    let sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.]/g, '');
    sanitizedFileName = sanitizedFileName.replace(/ /g, '-');
    sanitizedFileName = sanitizedFileName.toLowerCase();
    const lastDotIndex = sanitizedFileName.lastIndexOf('.');
    if (lastDotIndex !== -1) {
        const extension = sanitizedFileName.substring(lastDotIndex);
        sanitizedFileName = sanitizedFileName.substring(0, lastDotIndex) + extension;
    }
    return sanitizedFileName;
}

function formatTimeStamp(timestamp) {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const formattedTimestamp = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    return formattedTimestamp;
}


function getRandomNo(minNo, maxNo) {
    return Math.max(minNo, Math.round(Math.random() * maxNo));
}

function getRandomFloat(minNo, maxNo) {
    return Math.random() * (maxNo - minNo) + minNo;
}

function generateRandomString(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

function hashStringWithoutSalt(strToHash, algo = 'sha512') {
    return crypto.createHash(algo).update(strToHash).digest('hex')
}


module.exports = {
    sleep,
    roundNoToTwoDecimal,
    hashString,
    getHashStringBase64,
    getRandomHexString,
    serverTransfer,
    serverTransferWithData,
    serverTransferWithDataToDashboard,
    getDashboardUrlWithData,
    base64EncodeString,
    base64DecodeString,
    getParsedXML,
    sanitizeFileName,
    formatTimeStamp,
    getRandomNo,
    getRandomFloat,
    generateRandomString,
    getUniqueID: () => { return uuidv4() },
    hashStringWithoutSalt
}