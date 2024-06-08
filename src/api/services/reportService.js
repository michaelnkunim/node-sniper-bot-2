const indexDefinations = require('../../config/indexDefinations');
const elasticProcess = require('../../db/elastic/elasticProcess');
const elasticQueryBuilder = require('../../db/elastic/elasticQueryBuilder');

async function getReport(req, queryFn) {
    const reqData = req.body;
    console.log(req.userInfo);
    const indexConfig = indexDefinations.getInvoicesConfig(req.userInfo.sellerCode);
    if (indexConfig) {
        const data = await elasticProcess.getDocuments(indexConfig, 0, 0, queryFn(reqData.filters));
        return data;
    }
}

async function getMonthlyPayments(req) {
    const data = await getReport(req, elasticQueryBuilder.buildQueryMonthlyPayments)
    return data;
}

async function getMonthlyDues(req) {
    const data = await getReport(req, elasticQueryBuilder.buildQueryMonthlyDues)
    return data;
}



module.exports = {
    getMonthlyPayments,
    getMonthlyDues
}