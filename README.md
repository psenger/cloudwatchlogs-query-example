# cloudwatchlogs-query-example

A very simple example of cloud watch logs query from NodeJS as a client.

## Variables

You can use a `.env` for or environment variables.

| Parameter              	| Type                        	| Purpose                                                                                                                                 	|
|------------------------	|-----------------------------	|-----------------------------------------------------------------------------------------------------------------------------------------	|
| `AWS_REGION`              | STRING (OPTIONAL)             | The AWS Region Defaults to ap-southeast-2                                                                                                 |
| `AWS_PROFILE`          	| STRING                      	| The AWS Named Profile to use see [AWS Named Profile](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-profiles.html)      	|
| `TIMEZONE`             	| TIME ZONE DB NAME           	| A full list of all DB Names can be found [List of tz database time zones](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones) 	|
| `START_DATE`           	| ISO 8601 DATE               	| YYYY-MM-DD format start date                                                                                                            	|
| `HOURS_RANGE`          	| VALID JSON ARRAY OF NUMBERS 	| A valid JSON array of consecutive numbers of which represent the 24 hour period to scan. Eg `[20,21]` would be 9pm and 10pm               |
| `CLOUDWATCH_LOG_GROUP` 	| STRING                      	| The AWS Cloud Watch Log Group Name                                                                                                      	|
| `QUERY_STRING`            | STRING (OPTIONAL)             | The query string to send Cloud watch, the default is mentioned below                                 |

## Default Cloud Watch Query

The default query is:

```
FIELDS @timestamp, @message
| sort @timestamp desc
```
As long as timestamp is first, it should work.

You could even do something like this...But have not tested either the of the following
```
FIELDS @timestamp, @message
| filter @message like /requestid/
| sort @timestamp desc
```
or
```
filter @message like /Rate exceeded/
| stats count(*) as exceptionCount by bin(1h)
| sort exceptionCount desc
```

fini
