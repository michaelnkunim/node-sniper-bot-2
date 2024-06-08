function replaceAll(val, charToReplace, replaceChar) {
    return val.replace(new RegExp(charToReplace, 'g'), replaceChar);
}

function replaceSpecialChars(val) {
    return val.replace(/[^a-zA-Z0-9 ]/g, '');
}

function rightStr(str, length) {
    return str.toString().substring(str.length - length, length);
}

module.exports = {
    replaceAll,
    replaceSpecialChars,
    rightStr
}