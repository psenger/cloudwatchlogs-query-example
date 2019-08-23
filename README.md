# cloudwatchlogs-query-example

A very simple example of cloud watch logs query from NodeJS as a client.

__Note:__

* I used moment.js because it is easy to manipulate the dates.
* the queryString is just looking at the timestamp, you will need to modify it.
* and ```params``` has a limit of 1000, which might mean you lose some of the matching records if the results exceeds 1000.

```javascript 1.6
const fileName = 'outfile.json';
const logGroupName = 'fill this in';
const queryString = `
fields @timestamp 
| sort @timestamp desc
`;
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
```

fini