const express = require('express');
const cors = require('cors');
const fileUpload = require("express-fileupload");
const hbsEngine = require("express-handlebars");
const proxy = require('express-http-proxy');

const marketDataRoutes = require('./routes/marketDataRoutes');
const decryptMiddleWare = require('./middlewares/decryptData');

const unless = function (middleware, ...paths) {
    return function (req, res, next) {
        const pathCheck = paths.some(path => path === req.path);
        pathCheck ? next() : middleware(req, res, next);
    };
};

async function startServer(config) {
    const app = express();
    if (!global.appConfig.disableCors) {
        app.use(cors());
    }
    app.disable('x-powered-by');
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    app.use(express.json({
        verify: (req, res, buf, encoding) => {
            try {
                JSON.parse(buf);
            } catch (e) {
                res.status(400).send('Bad Request');
                throw Error('invalid JSON');
            }
        }
    }));
    app.use(decryptMiddleWare)
    // prevent fileUpload middleware from affecting language routes
    app.use(unless(fileUpload(), '/languages/upload/flag', '/languages/upload/lang'));
    app.get('/', (req, res) => {
        res.json('Dashboard Service v23.11.17');
    });

    app.use('/market-data', marketDataRoutes);
    // View Engine
    app.engine("handlebars", hbsEngine.engine());
    app.set("view engine", "handlebars");
    // Final Port
    app.listen(config.server_port, () => {
        console.log('Server Listening on ', config.server_port)
    });
   
    
}

module.exports = {
    startServer
}
