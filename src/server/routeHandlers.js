const express = require('express');
const querystring = require("querystring");
const indexing = require('../indexing/indexing');
global.app = undefined;
const globalIndexingConfig = require('../config/indexingOperationsConfig');

const routeConfig = {
    '/pauseindexing': (req, res) => {
        const indexingConfig = globalIndexingConfig.getIndexingConfig();
        indexingConfig.pauseIndexing();
        res.json(indexingConfig)
    },
    '/resumeindexing': (req, res) => {
        const indexingConfig = globalIndexingConfig.getIndexingConfig();
        indexingConfig.resumeIndexing();
        res.json(indexingConfig)
    },
    '/purge': (req, res) => {
        const indexname = req.query.name;
        if (indexname) {
            indexing.purgeIndex(indexname);
        }
        res.json({ res: 'trying' });
    }
}

function startServer(config) {
    if (!global.app) {
        global.app = express();
        global.app.get('/', (req, res) => {
            res.json(global.appConfig);
        });
        Object.keys(routeConfig).forEach(route => {
            global.app.get(route, (req, res) => {
                routeConfig[route](req, res);
            });
        })
        global.app.listen(config.server_port, () => {
        });
    }
}

module.exports = {
    startServer: startServer
}