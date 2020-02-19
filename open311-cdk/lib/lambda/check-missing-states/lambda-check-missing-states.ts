import {initDbConnection} from 'digitraffic-lambda-postgres/database';
import {findStateIds} from '../../db/db-requests';
import {findAll} from '../../db/db-states';
import {SNS} from 'aws-sdk';

export const handler = async () : Promise <any> => {
    const db = initDbConnection(
        process.env.DB_USER as string,
        process.env.DB_PASS as string,
        process.env.DB_URI as string
    );
    try {
        const requestStateIds = await findStateIds(db);
        const states = await findAll(db);
        const stateKeys = new Set(states.map(s => s.key));

        // TODO do in this in the database?
        const missingStates = requestStateIds
            .map(r => r.status_id)
            .filter(s => s != null && s.length > 0)
            .filter(rsc => !stateKeys.has(rsc as string));

        if (missingStates.length > 0) {
            console.warn('Missing states found: ' + missingStates.join(','));
            new SNS().publish({
                Message: missingStates.join(','),
                TopicArn: process.env.ORPHAN_SNS_TOPIC_ARN
            });
        } else {
            console.info('No missing states found');
        }
    } catch (e) {
        console.error('Error', e);
    } finally {
        db.$pool.end();
    }
};
