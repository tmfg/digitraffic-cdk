/* eslint-disable camelcase */
import {TrackingSaveResult} from "../../lib/model/tracking-save-result";


describe('tracking-save-result-model-test', () => {

    test('createSaved', () => {
        expectSizeSaveErrors(TrackingSaveResult.createSaved(10), 10, 1, 0);
        expectSizeSaveErrors(TrackingSaveResult.createSaved(5, 2), 5, 2, 0);
    });

    test('createError', () => {
        expectSizeSaveErrors(TrackingSaveResult.createError(10), 10, 0, 1);
    });

    test('constructor', () => {
        expectSizeSaveErrors(new TrackingSaveResult(1, 2, 3), 1, 2, 3);
    });

    test('sum', () => {
        expectSizeSaveErrors(new TrackingSaveResult(1, 2, 3).sum(new TrackingSaveResult(10, 20, 30)),
            11, 22, 33);
    });

    test('addError', () => {
        expectSizeSaveErrors(new TrackingSaveResult(1, 2, 3).addSaved(10),
            11, 3, 3);
    });

    test('addError', () => {
        expectSizeSaveErrors(new TrackingSaveResult(1, 2, 3).addError(10),
            11, 2, 4);
    });
});

function expectSizeSaveErrors(result: TrackingSaveResult, sizeBytes: number, saved: number, errors: number) {
    expect(result.sizeBytes).toEqual(sizeBytes);
    expect(result.saved).toEqual(saved);
    expect(result.errors).toEqual(errors);
}
