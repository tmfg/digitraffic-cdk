import * as SubjectsApi from "../../api/subjects.js";
import { update } from "../../service/subjects.js";
import { Locale } from "../../model/locale.js";

// eslint-disable-next-line dot-notation
const endpointUser = process.env["ENDPOINT_USER"];
// eslint-disable-next-line dot-notation
const endpointPass = process.env["ENDPOINT_PASS"];
// eslint-disable-next-line dot-notation
const endpointUrl = process.env["ENDPOINT_URL"];

export const handler = async (): Promise<void> => {
    if (!endpointUser || !endpointPass || !endpointUrl) {
        throw new Error("Env variables are not set!");
    }
    const subjects = await Promise.all([
        SubjectsApi.getSubjects(endpointUser, endpointPass, endpointUrl, Locale.FINNISH),
        SubjectsApi.getSubjects(endpointUser, endpointPass, endpointUrl, Locale.SWEDISH),
        SubjectsApi.getSubjects(endpointUser, endpointPass, endpointUrl, Locale.ENGLISH)
    ]);
    await update(subjects.flat());
};
