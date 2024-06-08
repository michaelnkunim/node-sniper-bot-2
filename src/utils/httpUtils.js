const axios = require('axios').default;
const https = require('https');

function getRequestConfig(options = {}) {
    return Object.assign({}, {
        httpsAgent: new https.Agent({
            rejectUnauthorized: false
        })
    }, options);
}

async function get(url, options = {}) {
    const response = await axios.get(url, getRequestConfig(options));
    return response.data;
}

function getSync(url, options = {}) {
    return axios.get(url, getRequestConfig(options));
}

async function post(url, req, options = {}) {
    return axios.post(url, req, getRequestConfig(options)).then((response) => {
        return response.data;
    }).catch(err => {
        //return err.response; 
        throw err.response;
    });
}

function postSync(url, req, options = {}) {
    return axios.post(url, req, getRequestConfig(options));
}

async function formPost(url, req) {
    const data = Object.keys(req).map((key) => `${key}=${encodeURIComponent(req[key])}`).join('&');
    const options = {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        data,
        url: url,
    };
    // console.log(data);
    const response = await axios(options);
    return response;
}

async function formGet(url, req) {
    const data = Object.keys(req).map((key) => `${key}=${encodeURIComponent(req[key])}`).join('&');
    const options = {
        method: 'GET',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        url: `${url}?${data}`,
    };
    const response = await axios(options);
    return response;
}

async function xmlPost(url, xmlString, headers = {}) {
    const options = {
        method: 'POST',
        headers: Object.assign({}, { 'Content-Type': 'text/xml; charset=utf-8', 'Content-Length': xmlString.length }, headers),
        data: xmlString,
        url: url,
    };
    const response = await axios(options);
    return response;
}

async function fileUpload(url, formData) {
    axios.post(url, formData, { headers: formData.getHeaders() })
}


module.exports = {
    get,
    getSync,
    post,
    postSync,
    fileUpload,
    formPost,
    formGet,
    xmlPost
}