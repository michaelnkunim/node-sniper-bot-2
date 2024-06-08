// Config must be included to preset environment
const config = require('./src/config/config');
process.env.NODE_ENV = 'qa_algoriq';
const restService = require('./src/api/restServer');
const tokenManager = require('./src/utils/tokenManager');
// Pass following param when starting indexing
//  --forceIndex, reindex all collections irrespective of last update time
// Any debug code you wish to execute can be added in app_debug module
const debug_app = require('./debug_app');

(async () => {
    tokenManager.init();
   //  dexscreenerScraper();
    await restService.startServer(global.appConfig);
    await debug_app.run();
})();

process.on('uncaughtException', (error, source) => {
    console.error(error, source);
});