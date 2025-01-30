import { handler } from "../../../lambda/get-subjects/lambda-get-subjects.js";
import * as SubjectsDb from "../../../db/subjects.js";
import { newSubject } from "../../testdata.js";
import { dbTestBase } from "../../db-testutil.js";
import { Locale } from "../../../model/locale.js";
import { shuffle } from "@digitraffic/common/dist/test/testutils";

describe(
  "lambda-get-subjects",
  dbTestBase((db) => {
    test("no subjects", async () => {
      const response = await handler({ locale: Locale.ENGLISH });

      expect(response).toMatchObject([]);
    });

    test("default locale", async () => {
      await SubjectsDb.update([newSubject(Locale.ENGLISH)], db);

      const response = await handler({});

      expect(response.length).toBe(1);
    });

    test("some subjects", async () => {
      const locale =
        shuffle([Locale.ENGLISH, Locale.FINNISH, Locale.SWEDISH])[0];
      const subjects = Array.from({
        length: Math.floor(Math.random() * 10),
      }).map(() => newSubject(locale));
      await SubjectsDb.update(subjects, db);

      const response = await handler({ locale: locale });

      expect(response.length).toBe(subjects.length);
    });
  }),
);
