const chalk = require('chalk');

function clearConsole() {
    try {
        process.stdout.clearLine();  // clear current text
        process.stdout.cursorTo(0);
    } catch (err) {
    }
}

function writeToConsole(msg, clearBeforePrint = true) {
    try {
        clearConsole();
        process.stdout.write(msg);
        if (!clearBeforePrint) {
            console.log('');
        }
    } catch (err) {
    }
}


module.exports = {
    success: (msg, value) => {
        writeToConsole(chalk.green(msg, chalk.blue.underline.bold(value)));
    },
    log: (msg) => {
        writeToConsole(msg);
    },
    report: (...args) => {
        console.trace();
        writeToConsole(chalk.red(...args), false);
    },
    consolelog: (...args) => {
        clearConsole();
        console.log(...args);
    }
}