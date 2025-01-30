import * as SubSubjectsService from "../../service/subsubjects.js";
import type { DigitrafficApiSubSubject } from "../../model/subsubject.js";
import { Locale } from "../../model/locale.js";
import type { LocaleEvent } from "../lambda-common.js";

export const handler = async (
  event: LocaleEvent,
): Promise<DigitrafficApiSubSubject[]> => {
  return (
    await SubSubjectsService.findAll(
      event.locale && event.locale.length ? event.locale : Locale.ENGLISH,
    )
  ).map((s) => ({
    active: s.active,
    name: s.name,
    id: s.id,
    locale: s.locale,
    subjectId: s.subject_id,
  }));
};
