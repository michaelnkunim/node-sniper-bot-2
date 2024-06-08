const config = require('./config.json');
const environment = require('../../environment');
const passedArgs = require('minimist')(process.argv.slice(2));
const appConfig = Object.assign({
    indexInterval: 60000,
}, config.developement, config[process.env.NODE_ENV || 'developement'], environment, passedArgs);
// Convetion to use global variables with global. syntax
global.appConfig = appConfig;
