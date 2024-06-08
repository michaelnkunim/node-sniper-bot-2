const preProcessConfig = require('../../db/preprocess/preProcessConfig');
const preprocessCommon = require('./preprocessCommon');
const commonUtils = require('../../utils/commonUtils');

module.exports = {
    formatListWithBuyerCode,
    formateGenericList,
    formatStatsConsolidate,
    formateForActiveBuyer,
    formatPreprocessApprovalQueue,
    formateForGroupByDeductionApproval
}

async function formatListWithBuyerCode(sellerCode, listData, listConfig, otherData) {
    const list = listData.data;
    const noOfRecords = listData.metadata && listData.metadata[0] && listData.metadata[0].total;
    await preprocessCommon.enhanceListForBuyerName(sellerCode, list);
    return { noOfRecords, list, otherData };
}

function formateGenericList(sellerCode, listData, listconfig, otherData = null) {
    const list = listData.data;
    if(listData.uniqueStatus){
        listData?.uniqueStatus?.forEach( elem => {
            if(!otherData.statusList.includes(elem._id.status)){
                otherData.statusList.push(elem._id.status)
            }    
        })
    }
    list.forEach(item => {
        if (item.buyerCode && !Array.isArray(item.buyerCode) && item.buyerCode.toLowerCase() === 'not available') {
            item.buyerName = 'N/A';
        }
    })
    const noOfRecords = listData.metadata && listData.metadata[0] && listData.metadata[0].total;
     const returnData =  { noOfRecords, list };
     if(otherData) { Object.assign(returnData,{otherData});}
     return returnData
}

function formateForGroupByDeductionApproval(sellerCode, listData, listconfig, otherData = null) {
    listData.data.map(elem => {
        if(elem._id){
            Object.assign(elem, elem._id);
           delete elem._id;
        }
    })

    const list = listData.data;
    const noOfRecords = listData.metadata && listData.metadata[0] && listData.metadata[0].count;
     const returnData =  { noOfRecords, list };
     if(otherData) { Object.assign(returnData,{otherData});}
     return returnData
}

function formateForActiveBuyer(sellerCode, data) {
    const count = data.sum
    return { count }
}

function formatStatsConsolidate(sellerCode, listData) {
    const noOfRecords = (listData.metadata && listData.metadata[0] && listData.metadata[0].total) || 0;
    listData.data.forEach(buyerObj => {
        const { buyerCode, buyerName } = buyerObj._id;
        buyerObj.buyerCode = buyerCode;
        buyerObj.buyerName = buyerName;
        // buyerObj.netOutstanding = ((buyerObj.invAmount || 0) + (buyerObj.dnAmount || 0)) - (buyerObj.cnAmount || 0);
        buyerObj.netOutstanding = ((buyerObj.invDueAmount || 0) + (buyerObj.dnDueAmount || 0)) - (buyerObj.cnDueAmount || 0);
    })
    return { noOfRecords, list: listData.data }
}

// Function too big, needs refactoring
async function formatPreprocessApprovalQueue(sellerCode, listData, listconfig) {

    const buyerCodeObjs = [
        'rawInvoicesLinked',
        'srcDocs',
        'destDocs'
    ];


    // listData.forEach( list => {
    //     buyerCodeObjs.forEach( objKey => {
    //         if(list[objKey]){
    //             if(list[objKey].length){ 
    //                 list[objKey].forEach( item => {
    //                     const buyerCode1 = item?.buyerCode;
    //                     item.buyerName = list['buyerObj'][buyerCode1]?.buyerNm || "";
    //                     item.circle = list['buyerObj'][buyerCode1]?.circle || "";
    //                 })
    //             }
    //         }

    //     } )
    // })

    const userIdsListMap = {};
    listData.forEach(item => {
        //temperory fix
        if(item && item?.adjustment){
            item?.adjustment.forEach( elem => {
                elem.refId = elem.refId.toString();
            })
        }

        //this below condition use for payment transfer in uac buyercode push in dest buyercode array
        if(item.type === 'TRANSFER_ASSIGNMENT' && item.zeroInvoices && item.zeroInvoices !== null){
            item.destDocs.push({buyerCode: item.zeroInvoices.buyerCode, amt: item.zeroInvoices.payAmt})
            item.destbuyerCodeLinked.push(item.zeroInvoices.buyerCode);
            item.destbuyerCode.push(item.zeroInvoices.buyerCode);
        }

        //adding buyername and circle 
        //start
        buyerCodeObjs.forEach( objKey => {
            if(item[objKey]){
                if(item[objKey].length){ 
                    item[objKey].forEach( elem => {
                        const buyerCode1 = elem?.buyerCode;
                        if(item['buyerObj']){
                            elem.buyerName = item['buyerObj'][buyerCode1]?.buyerNm || "";
                            elem.circle = item['buyerObj'][buyerCode1]?.circle || "";
                        } 
                    })
                }
            }
             
        } )
        //end

        if (!userIdsListMap[item.makerUserId]) {
            if (Array.isArray(item.makerUserId)) {
                item.makerUserId.forEach(userid => {
                    if (userid) {
                        userIdsListMap[userid] = { displayNm: '', orgNm: [] };
                    }
                });
            } else {
                if (item.makerUserId) {
                    userIdsListMap[item.makerUserId] = { displayNm: '', orgNm: [] };
                }
            }
        }
        if (!userIdsListMap[item.checkerUserId]) {
            if (Array.isArray(item.checkerUserId)) {
                item.checkerUserId.forEach(userid => {
                    if (userid) {
                        userIdsListMap[userid] = { displayNm: '', orgNm: [] };
                    }
                });
            } else {
                if (item.checkerUserId) {
                    userIdsListMap[item.checkerUserId] = { displayNm: '', orgNm: [] };
                }
            }
        }
        if (item.approval && item.approval.length) {
            item.approval.forEach(approvalItem => {
                if (approvalItem.makerUserId) {
                    userIdsListMap[approvalItem.makerUserId] = { displayNm: '', orgNm: [] };
                }
                if (approvalItem.checkerUserId) {
                    userIdsListMap[approvalItem.checkerUserId] = { displayNm: '', orgNm: [] };
                }
            })
        }
    });
    const userIdsList = Object.keys(userIdsListMap).map(id => id);
    const listUserInfoWithOrgHierarchy = await preprocessCommon.getUserInfoByUserIds(userIdsList);
    const orgUserIdsMap = {};
    listUserInfoWithOrgHierarchy.forEach(userInfo => {
        if (userIdsListMap[userInfo._id]) {
            userIdsListMap[userInfo._id].displayNm = userInfo.displayNm;
            userIdsListMap[userInfo._id].orgNm = userInfo.orgNm;
            (userInfo.orgNm || []).forEach(orgUserId => {
                if (!orgUserIdsMap[orgUserId]) {
                    orgUserIdsMap[orgUserId] = { displayNm: '' };
                }
            })
        }
    });
    const infoForOrgUserIds = await preprocessCommon.getUserInfoByUserIds(Object.keys(orgUserIdsMap).map(id => id));
    const userInfoMap = {};
    (infoForOrgUserIds || []).forEach(userItem => {
        if (!userInfoMap[userItem._id]) {
            userInfoMap[userItem._id] = {
                displayNm: userItem.displayNm || userItem._id
            }
        }
    });
    listUserInfoWithOrgHierarchy.forEach(userInfo => {
        if (userIdsListMap[userInfo._id]) {
            userIdsListMap[userInfo._id].enhancedOrgNm = (userInfo.orgNm || []).map(orgUserId => {
                return {
                    userId: orgUserId,
                    displayNm: (userInfoMap[orgUserId] || {}).displayNm || orgUserId
                }
            });
        }
    });
    listData.forEach(item => {
        if (userIdsListMap[item.makerUserId]) {
            item.makerDisplyNm = userIdsListMap[item.makerUserId].displayNm;
            item.approvers = userIdsListMap[item.makerUserId].enhancedOrgNm;
        }
        if (userIdsListMap[item.checkerUserId]) {
            item.checkerDisplyNm = userIdsListMap[item.checkerUserId].displayNm;
        }
        if (item.approval && item.approval.length) {
            item.approval.forEach(approvalItem => {
                approvalItem.makerDisplayNm = (userIdsListMap[approvalItem.makerUserId] || {}).displayNm;
                approvalItem.checkerDisplayNm = (userIdsListMap[approvalItem.checkerUserId] || {}).displayNm;
            });
        }
    });
}