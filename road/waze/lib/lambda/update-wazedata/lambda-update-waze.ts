import {config as AWSConfig} from 'aws-sdk';
import axios from 'axios';
import moment from 'moment';
import {uploadToS3} from '../../../../../common/stack/s3-utils';

export const KEY_BUCKET_NAME = 'BUCKET_NAME';
export const KEY_REGION = 'REGION';
export const KEY_ENDPOINT_URL = 'ENDPOINT_URL';

export async function handler() {
    AWSConfig.update({region: process.env[KEY_REGION] as string});
    return updateWazeData();
}

async function updateWazeData(): Promise<any> {
    const response = await axios.get(process.env[KEY_ENDPOINT_URL] as string);
    if (response.status != 200) {
        console.error(`method=updateWazeData Received status ${response.status}`);
        throw new Error('Unable to fetch Waze data');
    }
    const nowMinute = moment().seconds(0).milliseconds(0);
    return await uploadToS3(process.env[KEY_BUCKET_NAME] as string,
        JSON.stringify(response.data, null, 2),
        `waze-${nowMinute.toISOString()}.json`)
}
