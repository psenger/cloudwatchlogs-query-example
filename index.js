/**
 * Philip A Senger - 2019-08-23
 */
const AWS = require('aws-sdk');
const { open, writeFile, readdir, readFile } = require("fs").promises;
const path = require('path');
const Promise = require('bluebird');
const moment = require('moment-timezone');

const {
    buildLogGroupDir,
    stamp,
    buildRangedFileName,
    extractTime,
    extractMessage,
    compareTimeStamps,
    promiseWhile
} = require('./utils');

const {
    region,
    profile,
    logGroupName,
    startDate,
    timeZone,
    hours,
    queryString,
} = require('./config');

AWS.config.setPromisesDependency(Promise);
const credentials = new AWS.SharedIniFileCredentials({profile});
AWS.config.credentials = credentials;
const cloudwatchlogs = new AWS.CloudWatchLogs({region});

const dir = buildLogGroupDir(logGroupName);

const options = {encoding: 'utf-8', flag: 'r'};

(async () => {
    for await (let hour of hours) {
        console.log(`Run for Hour: #${hour}`);

        /**
         * The end of the time range to query. The range is inclusive, so the specified
         * end time is included in the query. Specified as epoch time, the number of
         * seconds since January 1, 1970, 00:00:00 UTC.
         */
        const startTime = moment.tz(`${startDate} ${("00" + hour).slice(-2)}:00`, timeZone);
        let endTime = startTime.clone();
        endTime.hour(hour + 1);

        if (endTime.valueOf() <= startTime.valueOf()) {
            console.error(`Time range end is before time range start endTime:${endTime.valueOf()} startTime:${startTime.valueOf()}`);
            process.exit(1)
        }

        const startTimeStamp = stamp(startTime);
        const endTimeStamp = stamp(endTime);
        console.log(`  Start time: ${startTime.toISOString()} (UTC) / ${startTime.format()} (${timeZone})`);
        console.log(`    End time: ${endTime.toISOString()} (UTC) / ${endTime.format()} (${timeZone})`);

        const fileName = buildRangedFileName(startTimeStamp, endTimeStamp);
        const filePath = path.join(dir, 'logs.txt');
        const limit = '' + 10000;

        /**

         endTime
         The end of the time range to query. The range is inclusive, so the specified end time is included in the query. Specified as epoch time, the number of seconds since January 1, 1970, 00:00:00 UTC.
         Type: Long
         Valid Range: Minimum value of 0.
         Required: Yes

         limit
         The maximum number of log events to return in the query. If the query string uses the fields command, only the specified fields and their values are returned. The default is 1000.
         Type: Integer
         Valid Range: Minimum value of 1. Maximum value of 10000.
         Required: No

         logGroupName
         The log group on which to perform the query.
         A StartQuery operation must include a logGroupNames or a logGroupName parameter, but not both.
         Type: String
         Length Constraints: Minimum length of 1. Maximum length of 512.
         Pattern: [\.\-_/#A-Za-z0-9]+
         Required: No

         logGroupNames
         The list of log groups to be queried. You can include up to 20 log groups.
         A StartQuery operation must include a logGroupNames or a logGroupName parameter, but not both.
         Type: Array of strings
         Length Constraints: Minimum length of 1. Maximum length of 512.
         Pattern: [\.\-_/#A-Za-z0-9]+
         Required: No

         queryString
         The query string to use. For more information, see CloudWatch Logs Insights Query Syntax.
         Type: String
         Length Constraints: Minimum length of 0. Maximum length of 2048.
         Required: Yes

         startTime
         The beginning of the time range to query. The range is inclusive, so the specified start time is included in the query. Specified as epoch time, the number of seconds since January 1, 1970, 00:00:00 UTC.
         Type: Long
         Valid Range: Minimum value of 0.
         Required: Yes
         */

        const params = {
            endTime: endTime.valueOf().toString(),
            startTime: startTime.valueOf().toString(),
            queryString,
            limit,
            logGroupName,
        };

        let fileHandle = {};

        try {
            const {queryId} = await cloudwatchlogs.startQuery(params).promise();

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

            const action = work => async () => {
                await Promise.delay(work.pause)
                let {results, statistics, status} = await cloudwatchlogs.getQueryResults(work.params).promise();
                console.log('statistics=', JSON.stringify(statistics, null, 4));
                console.log('work count=', work.count++);
                console.log('# of records=', results.length);
                if (status === 'Running') {
                    return;
                }
                const filePathName = path.join(dir, fileName);
                console.log('Cloud Watch JSON file', filePathName);
                await writeFile(filePathName, JSON.stringify(results, null, 4))
                work.continue = false;
            };

            await promiseWhile(condition(work), action(work));

            console.log('done calling AWS');

            let fileNames = await readdir(dir);

            fileNames = [].concat(...fileNames); // flatten

            fileNames = fileNames.filter(fileName => ~fileName.search(/^[^\.].*\.json$/)); // filter

            fileNames = fileNames.map(file => path.join(dir, file)) // attach directory

            let data = await Promise.map(fileNames, fileName => readFile(fileName, options));

            data = await Promise.map(data, (file) => JSON.parse(file));

            data = data.reduce(
                    (accum, items, index) => {
                        console.log(`d${index} has ${items.length} records`)
                        return accum.concat(items);
                    },
                    []
                )
                .reduce(
                    (accum, [timestamp, message, ptr]) => {
                        accum.push({
                            timestamp: extractTime(timestamp),
                            message: extractMessage(message)
                        })
                        return accum;
                    },
                    []
                )
                .sort(compareTimeStamps)
                .reduce(
                    (accum, {message, timestamp}) => {
                        return `${accum}\n${message}`;
                    },
                    ''
                );

            fileHandle = await open(filePath, 'w');

            await writeFile(filePath, data);

        } catch (err) {
            console.log(err, err.stack); // an error occurred
        }

    }
})()
