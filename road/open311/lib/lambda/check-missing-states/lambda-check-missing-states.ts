import {initDbConnection} from 'digitraffic-lambda-postgres/database';
import {findStateIds} from '../../db/db-requests';
import {findAll as findAllStates} from '../../db/db-states';
import {findAll as findAllSubjects} from '../../db/db-subjects';
import {SNS} from 'aws-sdk';

export const handler = async () : Promise <any> => {
    const db = initDbConnection(
        process.env.DB_USER as string,
        process.env.DB_PASS as string,
        process.env.DB_URI as string
    );
    try {
        const requestStateIds = (await findStateIds(db))
            .map(r => r.status_id)
            .filter(s => s != null && s.length > 0);

        const states = await findAllStates(db);
        const stateKeys = new Set(states.map(s => s.key));
        const missingStates = requestStateIds.filter(rsc => !stateKeys.has(Number(rsc)));

        const subjects = await findAllSubjects(db);
        const subjectIds = new Set(subjects.map(s => s.id));
        const missingSubjects = requestStateIds
            .filter(rsc => !subjectIds.has(Number(rsc)));

        if (missingStates.length || missingSubjects.length) {
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
