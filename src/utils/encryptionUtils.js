const CryptoJS = require("crypto-js");

const _fnTransformUI = CryptoJS.AES.encrypt;
const _fnTransformService = CryptoJS.AES.decrypt;
const _transformEnc = CryptoJS.enc.Base64;
const _transformDec = CryptoJS.enc.Utf8;


function getEncParams() {
  const _finalParam = CryptoJS.PBKDF2(global.appConfig.ENC_32BIT_PASS, global.appConfig.ENC_KEY, {
    keySize: 256 / 32,
    iterations: 65536 / 32,
  });
  const transformOptions = {
    iv: toWordArray(global.appConfig.INITIALIZATION_VECTOR),
    padding: CryptoJS.pad.Pkcs7,
    mode: CryptoJS.mode.CBC,
  };
  return {_finalParam, transformOptions};
}

function toWordArray(str) {
  return CryptoJS.enc.Utf8.parse(str);
}

function encoder(str) {
  let encoder = new TextEncoder();
  let byteArray = encoder.encode(str);
  return CryptoJS.enc.Utf8.parse(str);
}

function transformUI(value) {
  const {_finalParam, transformOptions} = getEncParams();
  var transformed = _fnTransformUI(
    encoder(value),
    _finalParam,
    transformOptions
  );
  return transformed.ciphertext.toString(_transformEnc);
}

function transformService(value) {
  const {_finalParam, transformOptions} = getEncParams();
  var transformed = _fnTransformService(value, _finalParam, transformOptions);
  return transformed.toString(_transformDec);
}

function hmacKeySHA(value) {
  var hash = CryptoJS.HmacSHA256(value, global.appConfig.HMAC_KEY);
  var hashInBase64 = CryptoJS.enc.Base64.stringify(hash);
  return hashInBase64;
}

function getEncryptedResponseData(obj) {
  const req = Object.assign(
    {},
    {
      result: transformUI(JSON.stringify(obj)),
      check: hmacKeySHA(JSON.stringify(obj)),
    }
  );
  return req;
}

function getDecryptedRequestData(obj) {
  const decryptedData = transformService(obj.result);
  try {
	const hash = hmacKeySHA(decryptedData);
	if(obj.check === hash) {
		return JSON.parse(decryptedData);
	  }else{
		throw(new Error("Hash mismatch",));
	  }
  } catch (error) {
	return console.log("Error in getting Response", error);
  }
}

module.exports = {
  getEncryptedResponseData,
  getDecryptedRequestData,
};
