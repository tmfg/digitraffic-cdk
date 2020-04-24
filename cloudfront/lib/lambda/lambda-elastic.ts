const zlib = require('zlib');
const readline = require('readline');
const AWS = require('aws-sdk');
const elasticsearch = require('elasticsearch')
const awsHttpClient = require('http-aws-es')

const elasticDomain = process.env.ELASTIC_DOMAIN as string;
const appDomain = process.env.APP_DOMAIN as string;

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

exports.handler = async function handler(event: any, context: any, callback: any) {
    console.info(JSON.stringify(event));

    const s3 = new AWS.S3();

    const params = {
            Bucket: event['Records'][0]['s3']['bucket']['name'],
            Key: event['Records'][0]['s3']['object']['key']
    };

    const messageBody = await handleS3Object(s3, params);

    const esMessage = createEsMessage(messageBody);

    await sendToEs(esMessage, function(error: any, success: any, statusCode: any, failedItems: any) {
        console.log('Response: ' + JSON.stringify({ "statusCode": statusCode }));

        if (error) {
            console.log('Error: ' + JSON.stringify(failedItems));
//            logFailure(error, failedItems);
            context.fail(JSON.stringify(error));
        } else {
            console.log('Success: ' + JSON.stringify(success));
            context.succeed('Success');
        }
    });
}

async function handleS3Object(s3: any, params: any): Promise<string[]> {
    const s3InputStream = s3.getObject(params).createReadStream();
    const indexName = createIndexName();

    const readStream = readline.createInterface({
        input: s3InputStream.pipe(zlib.createGunzip())
    });

    return new Promise((resolve, reject) => {
        let lines = [] as any[];

        readStream.on('line', (l: string) => handleLine(l, lines, indexName));
        readStream.on('close', () => {
            resolve(lines);
        });
    });
}

function createIndexName(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    return `${appDomain}-cf-${year}.${month}`;
}

function handleLine(line: string, lines: any[], indexName: string) {
//    console.info("line: %s", line);

    // skip first two lines
    if(!line.startsWith('#')) {
        const action = { index: { _index: indexName, _type: 'doc' } } as any;

        lines.push(action);
        lines.push(parseLine(line));
    }
}

function createEsMessage(lines: any[]): any {
    console.log("lines " + lines);
    console.log("lines " + JSON.stringify(lines));

    return {
        "body": lines
    };
}

async function sendToEs(message: any, callback: any) {
    const client = elasticsearch.Client({
        host: elasticDomain,
        connectionClass: awsHttpClient,
        awsConfig: new AWS.Config({ region: "eu-west-1" })
    });

    try {
        console.log("sending to es: " + JSON.stringify(message));

        const response = await client.bulk(message);

        console.log("response " + JSON.stringify(response));
    } catch(e) {
        console.log("got exception " + JSON.stringify(e));
    } finally {
        console.log("done");
    }
}

function parseLine(line: string): any {
    const fields = line.split('\t');

    const date = fields[0];
    const time = fields[1];
    const edgeLocation = fields[2];
    const bytes = fields[3];
    const ip = fields[4];
    const method = fields[5];
    const request = fields[7];
    const responseStatus = fields[8];
    const referrer = fields[9];
    const userAgent = unescape(fields[10]);
    const scheme = fields[16];
    const timeTaken = fields[18];
    const resultType = fields[22];
    const httpVersion = fields[23];
    const timeToFirstByte = fields[27];

    const httpDate = getHttpDate(date, time);

    return {
        timestamp: httpDate,
        remote_addr: ip,
        body_bytes_sent: bytes,
        http_referrer: referrer,
        http_user_agent: userAgent,
        request_method: method,
        request_time: timeTaken,
        request_uri: request,
        scheme: scheme,
        server_protocol: httpVersion,
        status: responseStatus,
        upstream_cache_status: resultType,
        edge_location: edgeLocation,
        upstream_response_time: timeToFirstByte
    };
}

function getHttpDate(date: string, time: string): string {
    // date: YYYY-MM-DD
    // time: HH:MM:SS
    //target format: HTTPDATE %{MONTHDAY}/%{MONTH}/%{YEAR}:%{TIME} %{INT}

    return `${date}T${time}Z`;
//    const ds = date.split('-');

 //   return `${ds[2]}/${monthNames[+ds[1] - 1]}/${ds[0]}:${time} +0000`; // Time is in UTC
}