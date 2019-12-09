import {initDbConnection} from 'digitraffic-lambda-postgres/database';
import * as DbRequests from '../../db/db-requests';
import * as DbService from '../../db/db-services';
const SNS = require('aws-sdk/clients/sns');

export const handler = async () : Promise <any> => {
    const db = initDbConnection(
        process.env.DB_USER as string,
        process.env.DB_PASS as string,
        process.env.DB_URI as string
    );
    try {
        const requestServiceCodesPromise = await DbRequests.findServiceCodes(db);
        const serviceCodesPromise = await DbService.findAllServiceCodes(db);
        // @ts-ignore
        const requestServiceCodes: string[] = requestServiceCodesPromise
            .map(r => r.service_code)
            .filter(s => s != null);
        const serviceCodes = new Set(serviceCodesPromise.map(s => s.service_code));
        const missingServices = requestServiceCodes.filter(rsc => !serviceCodes.has(rsc));

        if (missingServices.length > 0) {
            console.warn('Missing services found: ' + missingServices.join(','));
            new SNS().publish({
                Message: missingServices.join(','),
                TopicArn: process.env.ORPHAN_SNS_TOPIC_ARN
            });
        } else {
            console.info('No missing services found');
        }
    } catch (e) {
        console.error('Error', e);
    } finally {
        db.$pool.end();
    }
};
