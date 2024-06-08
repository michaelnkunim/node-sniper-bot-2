const tokenManager = require('../../utils/tokenManager');
const mongoCacheManager = require('../../db/mongo/mongoCacheManager');

module.exports = async function (req, res, next) {
    const token = req.header("token");
    if (!token) return res.status(401).send("Invalid token");
    try {
        // const userInfo = tokenManager.verifyToken(token);
        // // Check if data is stored in cache against this token
        // // If unique id is present in token then we need to query db
        // const cachedData = userInfo.uniqueUserUid ? ((await mongoCacheManager.getTokenCachedInfo(userInfo.uniqueUserUid)) || {}) : {};
        // const sellerWithConfig = Object.assign({}, (cachedData.data || {}), userInfo, (global.appConfig.sellerSpecificConfig[userInfo.sellerCode.toLowerCase()] || {}));
        // req.userInfo = sellerWithConfig;
        // req.sellerConfig = userInfo.sellerConfig || {};
        // if (req.userInfo.buyerCodes || ((userInfo.userRole || '').toLowerCase() === 'buyer')) {
        //     if (!req.body.filters) {
        //         req.body.filters = [];
        //     }
        //     if (req.body && req.body.filters) {
        //         const addBuyerCodesFilter = typeof req.body.filters.find(filter => filter.key === 'buyerCodesToRestrict') !== undefined;
        //         if (addBuyerCodesFilter) {
        //             // Added a dummy code to handle weird data where buyer is incorrectly configured, and does not have matched buyercodes
        //             // In that case adding empty array for buyerCodesToRestrict to filters just return all data
        //             req.body.filters.push({ key: 'buyerCodesToRestrict', value: (req.userInfo.buyerCodes || 'dummyBuyerCodeXYZ') });
        //         }
        //     }
        //     req.body.noCache = true;
        // }
        // if (req.body.filters && req.body.filters.findIndex(elem => elem.key === "currCode") !== -1) {
        //     req.body.noCache = true;
        // }

        next();
    } catch (err) {
        res.status(401).send({ error: err.message ? err.message : "Invalid token" });
    }
}