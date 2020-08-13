import {SQSEvent} from "aws-lambda";

export const handler = async (event: SQSEvent, context: any): Promise<any> => {
    event.Records.forEach(record => {
        //const { body } = record;
        // TODO persist
    });
};
