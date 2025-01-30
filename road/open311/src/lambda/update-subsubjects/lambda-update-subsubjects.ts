import * as SubSubjectsApi from "../../api/subsubjects.js";
import { update } from "../../service/subsubjects.js";
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
  const subSubjects = await Promise.all([
    SubSubjectsApi.getSubSubjects(
      endpointUser,
      endpointPass,
      endpointUrl,
      Locale.FINNISH,
    ),
    SubSubjectsApi.getSubSubjects(
      endpointUser,
      endpointPass,
      endpointUrl,
      Locale.SWEDISH,
    ),
    SubSubjectsApi.getSubSubjects(
      endpointUser,
      endpointPass,
      endpointUrl,
      Locale.ENGLISH,
    ),
  ]);
  await update(subSubjects.flat());
};
