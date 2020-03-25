/**
 * Philip A Senger - 2019-03-25
 */
const AWS = require('aws-sdk');
const cloudwatchlogs = new AWS.CloudWatchLogs({region: 'ap-southeast-2'});

function describeAllLogGroupsAsyncIterator() {
    return {
        nextToken: null,
        next() {
            return cloudwatchlogs.describeLogGroups({
                    limit: 50,
                    nextToken: this.nextToken
                })
                .promise()
                .then(({nextToken,logGroups}) => {
                    this.nextToken = nextToken;
                    return {done: ! nextToken , value:logGroups }
                })
        },
        [Symbol.asyncIterator]() {
            return this;
        }
    };
}

/**
 * Many times I cant find a log group, and I need to use Regular Expression
 */
const Pattern = /ecs/ig; // Case insensitive global
(async () => {
    const logGroups = [];
    for await (let value of describeAllLogGroupsAsyncIterator()) {
        value.forEach(lg=>logGroups.push(lg))
    }
    console.log('Matching Log Group Names');
    console.log(logGroups.filter(({logGroupName})=>Pattern.test(logGroupName)).map(({logGroupName})=>logGroupName));
})();

