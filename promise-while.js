/**
 * Created by Philip A Senger on 6/29/15.
 */
const Promise = require('bluebird');

module.exports = function promiseWhile (condition, action) {
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
};