const dayjs = require('dayjs');
const dayjsutc = require('dayjs/plugin/utc');
const customParseFormat = require('dayjs/plugin/customParseFormat');

dayjs.extend(dayjsutc);

function getDateFromTimeStamp(timestamp, format = 'YYYYMMDD') {
    if (!timestamp || timestamp == '-1') {
        timestamp = 0
    };
    dayjs.extend(customParseFormat);
    return dayjs(parseInt(timestamp, 10)).format(format);
}

function getDateDiffInDays(d1, d2) {
    return (dayjs(d1).startOf('day')).diff(dayjs(d2).startOf('day'), 'days');
}

function getDateDiffInDaysFromTimestamp(d1, d2) {
    return dayjs(d1).startOf('day').diff(dayjs(d2).startOf('day'), 'day');
}

function getTimeStamp(dateStr, format) {
    dayjs.extend(customParseFormat);
    return dayjs(dateStr, format).valueOf();
}

function getTimeStampFromDate(date) {
    if (!date) {
        return undefined
    }
    return dayjs(date).valueOf();
}

function getTimeStampFromUnknownDate(dateStr, knownDateFormat = undefined) {
    if (knownDateFormat) {
        return dayjs(dateStr, knownDateFormat).valueOf();
    }
    if (dateStr.toString().length === 13) {
        // already timestamp
        return Math.round(dateStr / (1000));
    }
    const format = getDateFormat(dateStr);
    dayjs.extend(customParseFormat)
    return dayjs(dateStr, format).valueOf();
}

function getTodaysTimeStamp(daysToSubtract = 0) {
    return dayjs().startOf('day').subtract(daysToSubtract, 'day').valueOf();
}

function getDateFormat(dateToConvert) {
    let format = '';
    const indexOfSeparator = dateToConvert.indexOf('-');
    if (indexOfSeparator === 4) {
        //YYYY-
        if (dateToConvert.indexOf(':') !== -1) {
            format = 'YYYY-MM-DD hh:mm:ss';
        } else {
            format = 'YYYY-MM-DD';
        }
    } else if (indexOfSeparator === 2) {
        // MM-DD
        format = 'MM-DD-YYYY hh:mm:ss';
    } else if (dateToConvert.toString().length === 8) {    // ddMMYYYY
        format = 'DDMMYYYY';
    } else if (dateToConvert.indexOf('.') !== -1) {
        format = 'DD.MM.YYYY';
    }
    return format;
}

function getCurrentDateTime() {
    return dayjs().format('YYYY-MM-DD HH:mm:ss');
}

function getTodaysDate() {
    return dayjs().format('YYYY-MM-DD');
}

function getCurrentMonthAndYear() {
    return dayjs().format('YYYY-MM');
}

function substractMonths(dateString, monthToSubtract) {
    var month = dateString % 100;
    var year = dateString / 100;
    var d = new Date(year, month - (+monthToSubtract), 1, 0, 0, 0, 0)

    d.setDate(d.getDate() - 2);
    year = d.getFullYear().toString();
    month = ("0" + (d.getMonth() + 1).toString()).substr(-2);
    return year + '-' + month;
}

// Get date in YYYY-MM-DD format
function getDateInFormat(dateString, dateFormat, dateFormatToConvert = 'YYYY-MM-DD') {
    return dayjs(dateString, dateFormat).format(dateFormatToConvert);
}

// Get date in DD/MM/YYYY format
function getSlashFormattedDate(date) {
    let d = date.split("-");
    let dat = d[2] + '/' + d[1] + '/' + d[0];
    return dat;
}

function getMonthName(monthNumber) {
    const date = new Date();
    date.setMonth(monthNumber - 1);
    date.setMonth(monthNumber - 1);
    return date.toLocaleString('en-US', { month: 'short' });
}

function subTractDate(date, daysToSubtact) {
    if (!date) {
        date = getTodaysDate();
    }
    return dayjs(date).subtract(daysToSubtact, 'days');
}

function getTodaysDateObject() {
    return dayjs();
}

function getUTCISO8601Date() {
    return dayjs().utc().format('YYYY-MM-DDTHH:mm:ss');
}

function addDays(date, daysToAdd) {
    return dayjs(date).add(daysToAdd, 'days').format('YYYY-MM-DD');
}

function getStartOfMonth() {
    return dayjs().startOf('month').format('YYYY-MM-DD');
}

function getEndOfMonth() {
    return dayjs().endOf('month').format('YYYY-MM-DD');
}

function formatDate(date, dateFormat) {
    return dayjs(date).format(dateFormat);
}

module.exports = {
    getTimeStamp,
    getTimeStampFromDate,
    getTimeStampFromUnknownDate,
    getDateFromTimeStamp,
    getDateDiffInDays,
    getDateDiffInDaysFromTimestamp,
    getTodaysTimeStamp,
    getCurrentDateTime,
    getTodaysDate,
    getDateInFormat,
    getCurrentMonthAndYear,
    getSlashFormattedDate,
    substractMonths,
    getMonthName,
    subTractDate,
    getTodaysDateObject,
    getUTCISO8601Date,
    addDays,
    getStartOfMonth,
    getEndOfMonth,
    formatDate
}