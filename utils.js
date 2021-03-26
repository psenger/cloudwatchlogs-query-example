const path = require('path'),
    fs = require('fs'),
    Promise = require('bluebird');

module.exports = {
    buildLogGroupDir: (logGroupName) => {
        const dir = path.join(__dirname, 'logs', logGroupName.replace('/', '-').replace(/[^a-z0-9\-]/ig, ''))
        console.debug(`output directory = ${dir}`);
        // Create directories if they doesnt exist.
        if (!fs.existsSync(path.join(__dirname, 'logs'))) {
            fs.mkdirSync(path.join(__dirname, 'logs'));
        }
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        return dir;
    },
    stamp: t => `${("000" + t.year()).slice(-4)}-${("00" + (t.month() + 1)).slice(-2)}-${("00" + (t.date())).slice(-2)}-${("00" + (t.hour())).slice(-2)}:${("00" + (t.minute())).slice(-2)}:${("00" + (t.second())).slice(-2)}`,
    buildRangedFileName: (startTimeStamp, endTimeStamp, extension = 'json') => `${startTimeStamp.replace(/[^a-z0-9\-]/g, '')}_to_${endTimeStamp.replace(/[^a-z0-9\-]/g, '')}.${extension}`,
    extractTime: timestamp => new Date(timestamp.value).getTime(),
    extractMessage: m = message => message.value,
    compareTimeStamps: (a, b) => {
        if (a.timestamp < b.timestamp) { // a is less than b by some ordering criterion
            return -1;
        }
        if (a.timestamp > b.timestamp) { // a is greater than b by the ordering criterion
            return 1;
        }
        // a must be equal to b
        return 0;
    },
    promiseWhile: async function promiseWhile(condition, action) {
        return new Promise(function (resolve, reject) {
            const loop = function () {
                if (!condition()) {
                    return resolve();
                }
                return Promise.cast(action()) // A way of casting incoming thenables or promise subclasses to promises of the exact class specified, so that the resulting object's then is ensured to have the behavior of the constructor you are calling cast on.
                    .then(loop)
                    .catch(function (e) {
                        reject(e);
                    });
            };
            process.nextTick(loop);
        });
    }
}
