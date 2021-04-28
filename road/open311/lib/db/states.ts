import {IDatabase, PreparedStatement} from "pg-promise";
import {ServiceRequestState} from "../model/service-request-state";
import {Locale} from "../model/locale";

const DELETE_STATES_PS = new PreparedStatement({
    name: 'delete-states',
    text: 'DELETE FROM open311_service_request_state'
});

const INSERT_STATE_PS = new PreparedStatement({
    name: 'insert-state',
    text: `INSERT INTO open311_service_request_state(key,name,locale) VALUES ($1, $2, $3)`
});

const SELECT_STATES_PS = new PreparedStatement({
    name: 'select-states',
    text: 'SELECT key, name, locale FROM open311_service_request_state WHERE locale = $1 ORDER BY key'
});

export function findAll(
    locale: Locale,
    db: IDatabase<any, any>): Promise<ServiceRequestState[]> {
    return db.manyOrNone(SELECT_STATES_PS, [locale]);
}

export function update(
    states: ServiceRequestState[],
    db: IDatabase<any, any>
): Promise<void> {
    return db.tx(t => {
        t.none(DELETE_STATES_PS);
        const queries: any[] = states.map(state => {
            return t.none(INSERT_STATE_PS, [state.key, state.name, state.locale]);
        });
        return t.batch(queries);
    });
}
