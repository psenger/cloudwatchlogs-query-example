require('dotenv').config();
const orError = name => { throw new Error(`Environment variable "${name}" is required.\n       Refer to the README.md for a full list of variables.\n`) };
const queryString = `
FIELDS @timestamp, @message
| sort @timestamp desc
`;
const hours = process.env.HOURS_RANGE || orError('HOURS_RANGE');
module.exports = {
    region: process.env.AWS_REGION || 'ap-southeast-2',
    profile: process.env.AWS_PROFILE || orError('AWS_PROFILE'),
    logGroupName: process.env.CLOUDWATCH_LOG_GROUP || orError('CLOUDWATCH_LOG_GROUP'),
    startDate: process.env.START_DATE || orError('START_DATE'),
    timeZone: process.env.TIMEZONE || 'UTC',
    hours : JSON.parse( hours ),
    queryString: process.env.QUERY_STRING || queryString
}
