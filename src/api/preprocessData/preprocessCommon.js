const mongoSellerService = require('../mongoservices/sellerService');
const userDataService = require('../mongoservices/userDataService');

module.exports = {
    getBuyerMapByBuyerCode,
    enhanceListForBuyerName,
    getUserInfoByUserIds
}

const inMemoryBuyerMap = {};

async function getBuyerMapByBuyerCode(sellerCode, forceRefresh) {
    if (!inMemoryBuyerMap[sellerCode] || forceRefresh) {
        const sellerDetails = await mongoSellerService.getSellerDetailsBySellerCode(sellerCode, { projection: { 'buyer.buyerCode': 1, 'buyer.buyerNm': 1 } });
        const buyerMap = {};
        if (sellerDetails && sellerDetails[0] && sellerDetails[0].buyer) {
            sellerDetails[0].buyer.forEach(buyer => {
                if (Array.isArray(buyer.buyerCode)) {
                    buyer.buyerCode.forEach(buyerCd => {
                        buyerMap[buyerCd] = buyer.buyerNm;
                    });
                } else {
                    buyerMap[buyer.buyerCode] = buyer.buyerNm;
                }
            });
        }
        inMemoryBuyerMap[sellerCode] = buyerMap;
        return buyerMap;
    } else {
        return inMemoryBuyerMap[sellerCode];
    }
}

async function enhanceListForBuyerName(sellerCode, list) {
    const buyerMap = await getBuyerMapByBuyerCode(sellerCode, false);
    list.forEach(item => {
        if (!item.buyerName) {
            item.buyerName = buyerMap[item.buyerCode];
        }
    });
}

async function getUserInfoByUserIds(userIds) {
    return await userDataService.getUsersByUserIds(userIds, { projection: { 'username': 1, 'displayNm': 1, 'orgNm': 1 } });
}