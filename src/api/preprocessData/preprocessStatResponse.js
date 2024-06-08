const preProcessConfig = require('../../db/preprocess/preProcessConfig');
const preprocessCommon = require('./preprocessCommon');
const commonUtils = require('../../utils/commonUtils');
const { buildQueryForSearchFilters } = require('../../db/elastic/elasticQueryBuilder');
const dateUtils = require('../../utils/dateUtils');

module.exports = {
    formatStatsSummaryResponse,
    formatPaidStatsResponse,
    formatBuyerListARSnapshot,
    formatReconBuyerSummary,
    formatMaricoCustomReport,
    formatForSummary,
    formatSellerOutstandingReport,
    formatForOpenInvoices,
    formatTransactionStatus,
    formateForPaymentMethod,
    formateForOverviewCreditNote,
    formatForMonthlyTransactionStatus,
    formatBuyerListPaymentDueSnapshot,
    formatForPaymentTrend,
    formateFor7DayDuesForecast,
    formatForAdvancePaymentStat,
    formatSellerListPaymentDueSnapshot,
    formatStatsSummaryResponseforSOA,
    formatStatsUserAccessedStats,
    formatStatsUserAccessedStats,
    formatStatsProcessedFilesCoffey,
    formatStatsAPStatusSummaryResponse
}

function formatStatsSummaryResponse(statusList, options) {
    const allStatus = { status: 'All', desc: 'Total', cnt: 0, amt: 0 };
    const descMap = options.isPayadvice ? preProcessConfig.reconStatusDesciptionMap : preProcessConfig.statusDescriptionMap;
    const totalStatus = Object.assign({}, allStatus);
    const statusMap = {};
    const nonCNStatuses = statusList.filter(stat => {
        return stat._id.docType !== 'CN';
    });
    const cnStatuses = statusList.filter(stat => {
        return stat._id.docType === 'CN';
    });
    const unUsedCNStatuses = cnStatuses.filter(stat => {
        return stat._id.status === 'UNUSED';
    });
    nonCNStatuses.forEach((stat) => {
        const docStatus = stat._id.status || stat._id;
        const statusConfig = descMap[docStatus] || {};
        if (!statusMap[docStatus]) {
            statusMap[docStatus] = {
                status: docStatus,
                desc: statusConfig.desc || docStatus,
                cnt: 0,
                amt: 0,
            }
        }
        let amt;
        if (options.isPayadvice || stat.isPayadvice) {
            amt = stat.amt;
        } else {
            amt = statusConfig.isPaid ? stat.docAmt : stat.dueAmt;
        }
        totalStatus.cnt += (stat.count || 0);
        totalStatus.amt += amt || 0;
        statusMap[docStatus].cnt += (stat.count || 0);
        statusMap[docStatus].amt += (amt || 0);
    });
    const dataList = Object.keys(statusMap).map(statusKey => {
        return statusMap[statusKey];
    })
    dataList.unshift(totalStatus);
    return { dataList, unUsedCNStatuses };
}

function formatStatsAPStatusSummaryResponse(statusList, options) {
    return (statusList);
}

async function formatBuyerListARSnapshot(buyerList, options) {
    const totalOutstandingAmt = buyerList.reduce((totalAmt, buyer) => {
        return totalAmt + buyer.dueAmt;
    }, 0);
    return buyerList.map(buyerStat => {
        let { buyerCode, buyerName } = buyerStat._id;
        return {
            buyerCode,
            buyerName: `${buyerName ? (buyerName + ' - ') : ''}${buyerCode}`,
            cnt: buyerStat.count || 0,
            amt: buyerStat.dueAmt || 0,
            perc: `${commonUtils.roundNoToTwoDecimal(((buyerStat.dueAmt || 0) / totalOutstandingAmt) * 100)} %`
        };
    });
}

async function formatBuyerListPaymentDueSnapshot(buyerList, options) {
    const totalOutstandingAmt = buyerList.reduce((totalAmt, buyer) => {
        return totalAmt + buyer.dueAmt;
    }, 0);
    return buyerList.map(buyerStat => {
        let { buyerCode, buyerName } = buyerStat._id;
        return {
            buyerCode,
            buyerName: `${buyerName ? (buyerName + ' - ') : ''}${buyerCode}`,
            cnt: buyerStat.count || 0,
            dueAmt: buyerStat.dueAmt || 0,
            overdue_payments: buyerStat.overdue_payments || 0,
            pendingWithDiscount: 0,
            perc: `${commonUtils.roundNoToTwoDecimal(((buyerStat.dueAmt || 0) / totalOutstandingAmt) * 100)} %`
        };
    });
}

async function formatSellerListPaymentDueSnapshot(buyerList, options) {
    const totalOutstandingAmt = buyerList.reduce((totalAmt, buyer) => {
        return totalAmt + buyer.dueAmt;
    }, 0);
    return buyerList.map(buyerStat => {
        let { buyerCode, buyerName } = buyerStat._id;
        return {
            buyerCode,
            // buyerName: `${buyerName ? (buyerName + ' - ') : ''}${buyerCode}`,
            sellerCode: options.sellerCode,
            cnt: buyerStat.count || 0,
            dueAmt: buyerStat.dueAmt || 0,
            overdue_payments: buyerStat.overdue_payments || 0,
            pendingWithDiscount: 0,
            perc: `${commonUtils.roundNoToTwoDecimal(((buyerStat.dueAmt || 0) / totalOutstandingAmt) * 100)} %`
        };
    });
}

async function formatForPaymentTrend(list, options) {
    const data = list.map(stat => {
        let { month, year } = stat._id;
        return {
            month,
            year,
            monthName: dateUtils.getMonthName(month),
            paidEarly: stat.paidEarly,
            paidOnTime: stat.paidOnTime,
            paidLate: stat.paidLate,
            cnt: stat.count || 0,
        };
    });

    data.sort((a, b) => a.month - b.month);
    data.sort((a, b) => a.year - b.year);

    return data;


}

function formatForSummary(data, options, buyersData, approvedData) {
    const { paidStats, unpaidStats, paidToday, monthlyPaid, approvedData1 } = data[0];
    const totalBuyersCounts = buyersData.count || 0;
    const totalStats = {
        allPaid: { cnt: 0, amt: 0, about: 'Total Paid invoices on Freepay' },
        allInvoices: { cnt: 0, amt: 0, about: 'Total Invoices on Freepay' },
        allPending: { cnt: 0, amt: 0, about: 'Total Pending Invoices On Freepay' },
        'Total customers active': totalBuyersCounts
    }

    const summeryStats = {
        'approvedData': { cnt: 0, amt: 0, about: 'Today Aprroved on freepay' },
        'paidToday': { cnt: 0, amt: 0, about: 'Invoices Paid Today' },
        'paidMonth': { cnt: 0, amt: 0, about: 'Invoices Paid in last 30 Today' },
        'activeCustomer': { cnt: totalBuyersCounts, about: 'Total customers active on freepay' },
        'pendingInvoices': totalStats.allPending,
        'paidInvoices': totalStats.allPaid,
        'overdueInvoice': { cnt: 0, amt: 0, about: 'Total Overdue Invoices on Freepay' },

        setStat: (key, stat) => {
            if (stat) {
                summeryStats[key].cnt += stat.cnt;
                summeryStats[key].amt += stat.amt;
            }
        }
    }

    const paidStatsMap = {};
    const unpaidStatsMap = {};
    const paidByDaysStatsMap = {};
    const paidAfterDueStat = { cnt: 0, amt: 0 };
    const overDueStat = { cnt: 0, amt: 0 };
    const paidDays = { cnt: 0, amt: 0 };
    paidStats.forEach(stat => {
        paidStatsMap[stat._id.toString()] = stat;
        if (['-99999', '0', 'Other'].indexOf(stat._id.toString()) === -1) {
            paidAfterDueStat.cnt += stat.cnt;
            paidAfterDueStat.amt += stat.amt;
        }
        if (stat._id !== 'Other') {
            totalStats.allPaid.cnt += stat.cnt;
            totalStats.allPaid.amt += stat.amt;
            totalStats.allInvoices.cnt += stat.cnt;
            totalStats.allInvoices.amt += stat.amt;
        }
    });

    unpaidStats.forEach(stat => {
        unpaidStatsMap[stat._id] = stat;
        if (['-99999', '0', 'Other'].indexOf(stat._id.toString()) === -1) {
            overDueStat.cnt += stat.cnt;
            overDueStat.amt += stat.amt;
        }
        if (stat._id !== 'Other') {
            totalStats.allPending.cnt += stat.cnt;
            totalStats.allPending.amt += stat.amt;
            totalStats.allInvoices.cnt += stat.cnt;
            totalStats.allInvoices.amt += stat.amt;
        }
    });

    paidToday.forEach(stat => {
        paidByDaysStatsMap[stat._id] = stat;
        if (['-99999', '0', 'Other'].indexOf(stat._id.toString()) === -1) {
            paidDays.cnt += stat.cnt;
            paidDays.amt += stat.amt;
        }
    });

    summeryStats.setStat('overdueInvoice', overDueStat);
    summeryStats.setStat('paidToday', paidByDaysStatsMap['0']);
    summeryStats.setStat('paidMonth', paidByDaysStatsMap['0']);

    summeryStats.paidMonth.cnt = monthlyPaid[0]?.count || 0;
    summeryStats.paidMonth.amt = monthlyPaid[0]?.sum || 0;

    summeryStats.approvedData.cnt = approvedData1[0]?.count || 0;
    summeryStats.approvedData.amt = approvedData1[0]?.sum || 0;

    return { summeryStats }

}

// TODO
// Technical debt 
// to get seller wise buckets added lots of conditions, can be achieved same result with db config against buckets configured
function formatPaidStatsResponse(data, options) {
    const bucketsForPaidStats = ((options.sellerConfig || {}).dashboardConfig || {}).paidStatsBuckets || [-99999, 0, 1, 31, 61, 91, 121, 151, 181, 99999];
    const { paidStats, unpaidStats } = data[0];
    const totalStats = {
        allPaid: { cnt: 0, amt: 0 },
        all: { cnt: 0, amt: 0 },
        allDue: { cnt: 0, amt: 0 }
    }
    const arHealthStats = {
        total: { cnt: 0, amt: 0 },
        overDue: { cnt: 0, amt: 0 },
        paidOnDue: { cnt: 0, amt: 0 },
        paidAfterDue: { cnt: 0, amt: 0 },
        paidBeforeDue: { cnt: 0, amt: 0 },
        setStat: (key, stat) => {
            if (stat) {
                arHealthStats[key].cnt += stat.cnt;
                arHealthStats[key].amt += stat.amt;
            }
        }
    }
    const collectionLiveHealthStats = {
        'Not yet past due': { cnt: 0, amt: 0, sort: 0, from: -1 },
        'Due Today': { cnt: 0, amt: 0, sort: 1, from: 0, to: 0 },
        '1-30 days past due': { cnt: 0, amt: 0, sort: 2, from: 1, to: 30 },
        '31-60 days past due': { cnt: 0, amt: 0, sort: 4, from: 31, to: 60 },
        '61-90 days past due': { cnt: 0, amt: 0, sort: 5, from: 61, to: 90 },
        '91-120 days past due': { cnt: 0, amt: 0, sort: 6, from: 91, to: 120 },
        '121-150 days past due': { cnt: 0, amt: 0, sort: 7, from: 121, to: 150 },
        '151-180 days past due': { cnt: 0, amt: 0, sort: 8, from: 151, to: 180 },
        '> 180 days past due': { cnt: 0, amt: 0, sort: 9, from: 181 },
        'Total Dues': { cnt: 0, amt: 0, sort: 10 },
        setStat: (key, stat) => {
            if (stat) {
                collectionLiveHealthStats[key].cnt += stat.cnt;
                collectionLiveHealthStats[key].amt += stat.amt;
            }
        }
    };
    if (bucketsForPaidStats.indexOf(9) !== -1) {
        delete collectionLiveHealthStats['1-30 days past due'];
        collectionLiveHealthStats['1-8 days past due'] = { cnt: 0, amt: 0, sort: 2, from: 1, to: 8 };
        collectionLiveHealthStats['9-30 days past due'] = { cnt: 0, amt: 0, sort: 3, from: 9, to: 30 };
    }
    const ytdPaidHealthStats = {
        'Paid Early': { cnt: 0, amt: 0, sort: 0 },
        'Paid on due date': { cnt: 0, amt: 0, sort: 1 },
        'Paid within 1-30 days past due': { cnt: 0, amt: 0, sort: 2 },
        'Paid within 31-60 days past due': { cnt: 0, amt: 0, sort: 4 },
        'Paid within 61-90 days past due': { cnt: 0, amt: 0, sort: 5 },
        'Paid within 91-120 days past due': { cnt: 0, amt: 0, sort: 6 },
        'Paid within 121-150 days past due': { cnt: 0, amt: 0, sort: 7 },
        'Paid within 151-180 days past due': { cnt: 0, amt: 0, sort: 8 },
        'Paid after 180 days past due': { cnt: 0, amt: 0, sort: 9 },
        setStat: (key, stat) => {
            if (stat) {
                ytdPaidHealthStats[key].cnt += stat.cnt;
                ytdPaidHealthStats[key].amt += stat.amt;
            }
        }
    };
    if (bucketsForPaidStats.indexOf(9) !== -1) {
        delete ytdPaidHealthStats['Paid within 1-30 days past due'];
        ytdPaidHealthStats['Paid within 1-8 days past due'] = { cnt: 0, amt: 0, sort: 2 };
        ytdPaidHealthStats['Paid within 9-30 days past due'] = { cnt: 0, amt: 0, sort: 3 };
    }
    const paidStatsMap = {};
    const unpaidStatsMap = {};
    const paidAfterDueStat = { cnt: 0, amt: 0 };
    const overDueStat = { cnt: 0, amt: 0 };
    paidStats.forEach(stat => {
        paidStatsMap[stat._id.toString()] = stat;

        if (['-99999', '0', 'Other'].indexOf(stat._id.toString()) === -1) {
            paidAfterDueStat.cnt += stat.cnt;
            paidAfterDueStat.amt += stat.amt;
        }
        if (stat._id !== 'Other') {
            totalStats.allPaid.cnt += stat.cnt;
            totalStats.allPaid.amt += stat.amt;
            totalStats.all.cnt += stat.cnt;
            totalStats.all.amt += stat.amt;
        }
    });
    unpaidStats.forEach(stat => {
        unpaidStatsMap[stat._id] = stat;
        if (['-99999', '0', 'Other'].indexOf(stat._id.toString()) === -1) {
            overDueStat.cnt += stat.cnt;
            overDueStat.amt += stat.amt;
        }
        if (stat._id !== 'Other') {
            totalStats.allDue.cnt += stat.cnt;
            totalStats.allDue.amt += stat.amt;
            totalStats.all.cnt += stat.cnt;
            totalStats.all.amt += stat.amt;
        }
    });
    // AR Health
    arHealthStats.setStat('paidBeforeDue', paidStatsMap['-99999']);
    arHealthStats.setStat('paidOnDue', paidStatsMap['0']);
    arHealthStats.setStat('paidAfterDue', paidAfterDueStat);
    arHealthStats.setStat('overDue', overDueStat);
    arHealthStats.setStat('total', totalStats.all);
    // Collection Live Health
    collectionLiveHealthStats.setStat('Not yet past due', unpaidStatsMap['-99999']);
    collectionLiveHealthStats.setStat('Due Today', unpaidStatsMap['0']);
    if (bucketsForPaidStats.indexOf(9) !== -1) {
        collectionLiveHealthStats.setStat('1-8 days past due', unpaidStatsMap['1']);
        collectionLiveHealthStats.setStat('9-30 days past due', unpaidStatsMap['9']);
    } else {
        collectionLiveHealthStats.setStat('1-30 days past due', unpaidStatsMap['1']);
    }
    collectionLiveHealthStats.setStat('31-60 days past due', unpaidStatsMap['31']);
    collectionLiveHealthStats.setStat('61-90 days past due', unpaidStatsMap['61']);
    collectionLiveHealthStats.setStat('91-120 days past due', unpaidStatsMap['91']);
    collectionLiveHealthStats.setStat('121-150 days past due', unpaidStatsMap['121']);
    collectionLiveHealthStats.setStat('151-180 days past due', unpaidStatsMap['151']);
    collectionLiveHealthStats.setStat('> 180 days past due', unpaidStatsMap['181']);
    collectionLiveHealthStats.setStat('Total Dues', totalStats.allDue);
    // YTD Paid Health Stat
    ytdPaidHealthStats.setStat('Paid Early', paidStatsMap['-99999']);
    ytdPaidHealthStats.setStat('Paid on due date', paidStatsMap['0']);
    if (bucketsForPaidStats.indexOf(9) !== -1) {
        ytdPaidHealthStats.setStat('Paid within 1-8 days past due', paidStatsMap['1']);
        ytdPaidHealthStats.setStat('Paid within 9-30 days past due', paidStatsMap['9']);
    } else {
        ytdPaidHealthStats.setStat('Paid within 1-30 days past due', paidStatsMap['1']);
    }
    ytdPaidHealthStats.setStat('Paid within 31-60 days past due', paidStatsMap['31']);
    ytdPaidHealthStats.setStat('Paid within 61-90 days past due', paidStatsMap['61']);
    ytdPaidHealthStats.setStat('Paid within 91-120 days past due', paidStatsMap['91']);
    ytdPaidHealthStats.setStat('Paid within 121-150 days past due', paidStatsMap['121']);
    ytdPaidHealthStats.setStat('Paid within 151-180 days past due', paidStatsMap['151']);
    ytdPaidHealthStats.setStat('Paid after 180 days past due', paidStatsMap['181']);
    return {
        arHealthStats,
        collectionLiveHealthStats: Object.keys(collectionLiveHealthStats)
            .map(key => Object.assign({ status: key }, collectionLiveHealthStats[key]))
            .filter(a => typeof a.sort !== 'undefined')
            .sort((a, b) => {
                if (a.sort > b.sort) {
                    return 1;
                } else if (a.sort < b.sort) {
                    return -1
                } else {
                    return 0;
                }
            }),
        ytdPaidHealthStats: Object.keys(ytdPaidHealthStats)
            .map(key => Object.assign({ status: key }, ytdPaidHealthStats[key]))
            .filter(a => typeof a.sort !== 'undefined')
            .sort((a, b) => {
                if (a.sort > b.sort) {
                    return 1;
                } else if (a.sort < b.sort) {
                    return -1
                } else {
                    return 0;
                }
            }),
    };
}

function formatReconBuyerSummary(data) {
    const buyerReconSummaryMap = {};
    const { reconStats, unreconStats } = data[0];
    const processList = (list, key) => {
        list.forEach(stat => {
            const { buyerNm, buyerCode } = stat._id;
            if (buyerNm) {
                if (!buyerReconSummaryMap[buyerNm]) {
                    buyerReconSummaryMap[buyerNm] = { reconAmt: 0, unReconAmt: 0, totalAmt: 0 };
                }
                buyerReconSummaryMap[buyerNm][key] += stat.amt;
                buyerReconSummaryMap[buyerNm]['totalAmt'] += stat.amt;
            }
        });
    }
    processList(reconStats, 'reconAmt');
    processList(unreconStats, 'unReconAmt');
    const list = Object.keys(buyerReconSummaryMap).map(key => {
        return Object.assign({ buyerName: key }, buyerReconSummaryMap[key]);
    }).sort((a, b) => a.totalAmt - b.totalAmt).filter((stat, nIndex) => nIndex < 20);
    return list;
}

function formatMaricoCustomReport(data, options) {
    const retItem = {}
    Object.keys(data).forEach(dataKey => {
        // console.log(dataKey);
        if (dataKey !== '_id') {
            const grpStat = data[dataKey];
            const grpItem = {};
            grpStat.forEach(stat => {
                grpItem[stat._id] = {
                    cnt: stat.count,
                    amt: stat.dueAmt,
                }
                if (!grpItem.TOT) {
                    grpItem['TOT'] = {
                        cnt: 0,
                        amt: 0
                    }
                }
                grpItem['TOT'].cnt += stat.count;
                grpItem['TOT'].amt += stat.dueAmt;
            });

            retItem[dataKey] = grpItem;
        }
    });
    return retItem;
}

function formatSellerOutstandingReport(docs) {
    const overallOutstanding = docs[0].dueGrp || docs;
    const overdueDues = docs[0].overDue || [];
    console.log(overdueDues);
    const docTypeMap = {};
    const totalDues = {
        cnt: 0,
        amt: 0
    };
    const totalCredits = {
        cnt: 0,
        amt: 0
    };
    const totalOutstanding = {
        type: 'outstanding',
        amt: 0
    };

    overallOutstanding.forEach(doc => {
        const docType = doc._id.docType;
        const status = doc._id.status;
        if (!(docType === 'CN' && status === 'UNPAID')) {
            if (!docTypeMap[docType]) {
                docTypeMap[docType] = {
                    type: docType,
                    count: 0,
                    amt: 0
                };
            }
            docTypeMap[docType].count += doc.count;
            docTypeMap[docType].amt += doc.dueAmt;
            if (docType === 'CN') {
                totalCredits.cnt += doc.count;
                totalCredits.amt += doc.dueAmt;
            } else {
                totalDues.cnt += doc.count;
                totalDues.amt += doc.dueAmt;
            }
        }
    });
    if (!docTypeMap.hasOwnProperty("DN")) {
        docTypeMap["DN"] = { type: "DN", count: 0, amt: 0 }
    }
    if (!docTypeMap.hasOwnProperty("CN")) {
        docTypeMap["CN"] = { type: "CN", count: 0, amt: 0 }
    }
    if (overdueDues.length) {
        const overDueStats = overdueDues[0];
        docTypeMap['Overdue'] = { type: 'Overdue', count: overDueStats.count, amt: overDueStats.dueAmt };
    }
    totalOutstanding.amt = totalDues.amt - totalCredits.amt;
    docTypeMap[totalOutstanding.type] = totalOutstanding;
    return docTypeMap;
}

function formatForOpenInvoices(data, options) {
    const { paidStats, unpaidStats } = data[0];
    const totalStats = {
        allPaid: { cnt: 0, amt: 0, about: 'Total Paid invoices on Freepay' },
        allInvoices: { cnt: 0, amt: 0, about: 'Total Invoices on Freepay' },
        allPending: { cnt: 0, amt: 0, about: 'Total Pending Invoices On Freepay' }
    }

    const openInvoicesStats = {
        'pendingInvoices': totalStats.allPending,
        'overdueInvoice': { cnt: 0, amt: 0, about: 'Total Overdue Invoices on Freepay' },
        'pendingWithDiscount': { cnt: 0, amt: 0, about: 'Total Pending Invoices on Freepay' },

        setStat: (key, stat) => {
            if (stat) {
                openInvoicesStats[key].cnt += stat.cnt;
                openInvoicesStats[key].amt += stat.amt;
            }
        }
    }

    const paidStatsMap = {};
    const unpaidStatsMap = {};
    const paidAfterDueStat = { cnt: 0, amt: 0 };
    const overDueStat = { cnt: 0, amt: 0 };
    paidStats.forEach(stat => {
        paidStatsMap[stat._id.toString()] = stat;
        if (['-99999', '0', 'Other'].indexOf(stat._id.toString()) === -1) {
            paidAfterDueStat.cnt += stat.cnt;
            paidAfterDueStat.amt += stat.amt;
        }
        if (stat._id !== 'Other' && ['-99999', '0', 'Other'].indexOf(stat._id.toString()) !== -1) {
            totalStats.allPaid.cnt += stat.cnt;
            totalStats.allPaid.amt += stat.amt;
            totalStats.allInvoices.cnt += stat.cnt;
            totalStats.allInvoices.amt += stat.amt;
        }
    });

    unpaidStats.forEach(stat => {
        unpaidStatsMap[stat._id] = stat;
        if (['-99999', '0', 'Other'].indexOf(stat._id.toString()) === -1) {
            overDueStat.cnt += stat.cnt;
            overDueStat.amt += stat.amt;
        }
        if (['-99999', '-1', '0'].indexOf(stat._id.toString()) !== -1) {
            totalStats.allPending.cnt += stat.cnt;
            totalStats.allPending.amt += stat.amt;
            totalStats.allInvoices.cnt += stat.cnt;
            totalStats.allInvoices.amt += stat.amt;
        }
    });


    openInvoicesStats.setStat('overdueInvoice', overDueStat);
    openInvoicesStats.setStat('total', totalStats.all);
    return { openInvoicesStats }

}


function formatTransactionStatus(data) {
    const TransactionStatus = [];
    const list = data;
    if (list) {
        list.forEach(stat => {
            TransactionStatus.push({
                status: stat._id.status,
                count: stat.count
            })
        })
    }
    return TransactionStatus;
}

function formatForMonthlyTransactionStatus(list) {
    const data = list.map(stat => {
        let { month, year } = stat._id;
        return {
            month,
            year,
            monthName: dateUtils.getMonthName(month),
            status: stat.dataList[0].status,
            cnt: stat.dataList[0].count || 0,
            payAmt: stat.dataList[0].payAmt || 0
        };
    });

    data.sort((a, b) => a.month - b.month);
    data.sort((a, b) => a.year - b.year);

    return data;
}

function formateForPaymentMethod(list) {
    const data = list.map(stat => {
        let { month, year } = stat._id;
        return {
            month,
            year,
            payMode: stat.dataList[0].payMode,
            cnt: stat.dataList[0].count || 0,
            approvedAmount: stat.dataList[0].approvedAmount || 0
        };
    });

    data.sort((a, b) => a.month - b.month);
    data.sort((a, b) => a.year - b.year);

    return data;
}

function formateForOverviewCreditNote(data) {
    const list = data;
    const dataList = [];
    if (list) {
        list.forEach(stat => {
            dataList.push({
                status: stat._id.status,
                cnt: stat?.count,
                docAmt: stat?.docAmt,
                dueAmt: stat?.dueAmt
            })
        })
    }
    return dataList;
}

function formateFor7DayDuesForecast(data) {

    const { unpaidStats } = data[0];

    const totalStats = {
        days_0_7: { cnt: 0, amt: 0 }
    }

    const collectionDuesForecastStats = {
        'day 0': { cnt: 0, amt: 0 },
        'day 1': { cnt: 0, amt: 0 },
        'day 2': { cnt: 0, amt: 0 },
        'day 3': { cnt: 0, amt: 0 },
        'day 4': { cnt: 0, amt: 0 },
        'day 5': { cnt: 0, amt: 0 },
        'day 6': { cnt: 0, amt: 0 },
        'day 7': { cnt: 0, amt: 0 },
        'Due 0-7 days': { cnt: 0, amt: 0 },
        'Due 8-15 days': { cnt: 0, amt: 0 },
        setStat: (key, stat) => {
            if (stat) {
                collectionDuesForecastStats[key].cnt += stat.cnt;
                collectionDuesForecastStats[key].amt += stat.amt;
            }
        }
    };

    const unpaidStatsMap = {};

    unpaidStats.forEach(stat => {
        unpaidStatsMap[stat._id] = stat;
        if (stat._id == '0' || stat._id == '-1' || stat._id == '-2' || stat._id == '-3' || stat._id == '-4' || stat._id == '-5' || stat._id == '-6' || stat._id == '-7') {
            totalStats.days_0_7.cnt += stat.cnt;
            totalStats.days_0_7.amt += stat.amt;
        }
    });

    collectionDuesForecastStats.setStat('day 0', unpaidStatsMap['0']);
    collectionDuesForecastStats.setStat('day 1', unpaidStatsMap['-1']);
    collectionDuesForecastStats.setStat('day 2', unpaidStatsMap['-2']);
    collectionDuesForecastStats.setStat('day 3', unpaidStatsMap['-3']);
    collectionDuesForecastStats.setStat('day 4', unpaidStatsMap['-4']);
    collectionDuesForecastStats.setStat('day 5', unpaidStatsMap['-5']);
    collectionDuesForecastStats.setStat('day 6', unpaidStatsMap['-6']);
    collectionDuesForecastStats.setStat('day 7', unpaidStatsMap['-7']);
    collectionDuesForecastStats.setStat('Due 0-7 days', totalStats.days_0_7);
    collectionDuesForecastStats.setStat('Due 8-15 days', unpaidStatsMap['-15']);


    return collectionDuesForecastStats;
}

function formatForAdvancePaymentStat(list) {
    const data = list.map(stat => {
        return {
            title: stat._id,
            cnt: stat.count || 0,
            amount: stat.approvedAmount || 0
        };
    });
    return data;
}

function formatStatsSummaryResponseforSOA(statusList, options) {
    const allStatus = { status: 'All', desc: 'Total', cnt: 0, amt: 0 };
    const descMap = options.isPayadvice ? preProcessConfig.reconStatusDesciptionMap : preProcessConfig.statusDescriptionMap;
    const totalStatus = Object.assign({}, allStatus);
    const statusMap = {};
    const nonCNStatuses = statusList.filter(stat => {
        return stat._id.docType;
    });
    const cnStatuses = statusList.filter(stat => {
        return stat._id.docType === 'CN';
    });
    const unUsedCNStatuses = cnStatuses.filter(stat => {
        return stat._id.status === 'UNUSED' || stat._id.status === 'USED';
    });
    nonCNStatuses.forEach((stat) => {
        const docStatus = stat._id.status || stat._id;
        const statusConfig = descMap[docStatus] || {};
        if (!statusMap[docStatus]) {
            statusMap[docStatus] = {
                status: docStatus,
                desc: statusConfig.desc || docStatus,
                cnt: 0,
                amt: 0,
            }
        }
        let amt;
        if (options.isPayadvice || stat.isPayadvice) {
            amt = stat.amt;
        } else {
            amt = statusConfig.isPaid ? stat.docAmt : stat.dueAmt;
        }
        totalStatus.cnt += (stat.count || 0);
        totalStatus.amt += amt || 0;
        statusMap[docStatus].cnt += (stat.count || 0);
        statusMap[docStatus].amt += (amt || 0);
    });
    const dataList = Object.keys(statusMap).map(statusKey => {
        return statusMap[statusKey];
    })
    dataList.unshift(totalStatus);
    return { dataList, unUsedCNStatuses };
}

function formatStatsUserAccessedStats(data, options) {
    const list = data;
    return list;;
}

function formatStatsProcessedFilesCoffey(data, options) {
    const retData = {};
    data.forEach(doc => {
        const {docType, status} = doc._id;
        if(!retData[docType]) {
            retData[docType] = {
                success: 0,
                failed: 0
            };
        }
        retData[docType][status] = doc.count;
    })
    return retData;
}

function formatStatsUserAccessedStats(data, options) {
    const list = data;
    return list;;
}

