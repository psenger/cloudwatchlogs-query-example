/**
 * Philip A Senger - 2019-08-23
 */
const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const Promise = require('bluebird');
const moment = require('moment-timezone');
const promiseWhile = require('./promise-while');
const cloudwatchlogs = new AWS.CloudWatchLogs({region: 'ap-southeast-2'});

const fileName = 'outfile.json';
const logGroupName = 'fill this in';
const queryString = `
fields @timestamp 
| sort @timestamp desc
`;
/**
 * The end of the time range to query. The range is inclusive, so the specified
 * end time is included in the query. Specified as epoch time, the number of
 * seconds since January 1, 1970, 00:00:00 UTC.
 */
const endTime = moment().tz('Australia/Sydney');
const startTime = endTime.clone();
startTime.subtract(10, 'days');

const params = {
    endTime: endTime.valueOf(),
    queryString,
    startTime: startTime.valueOf(),
    limit: '1000',
    logGroupName,
};
cloudwatchlogs.startQuery(params, function (err, {queryId} = {}) {

    if (err) {
        console.log(err, err.stack); // an error occurred
    } else {

        const work = {
            params: {queryId},
            continue: true,
            pause: 2000,
            count: 0,
        };

        const condition = (work) => () => {
            if (work.count >= 5) { // nothing should take 5 x 2000 seconds to complete
                return false;
            }
            return (work.continue)
        };

        const action = (work) => () => {
            return Promise
                .delay(work.pause)
                .then(() => cloudwatchlogs.getQueryResults(work.params).promise())
                .then(({results, statistics, status} = {}) => {
                    console.log('statistics=', statistics);
                    console.log('count=', work.count++);
                    if (status === 'Running') {
                        return;
                    }
                    fs.writeFileSync(path.join(__dirname, fileName), JSON.stringify(results));
                    work.continue = false;
                })
        };

        promiseWhile(condition(work), action(work))
            .then(() => {
                console.log('done');
            })
    }
});