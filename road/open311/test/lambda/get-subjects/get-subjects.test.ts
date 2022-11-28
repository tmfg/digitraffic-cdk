import { handler } from "../../../lib/lambda/get-subjects/lambda-get-subjects";
import * as SubjectsDb from "../../../lib/db/subjects";
import { newSubject } from "../../testdata";
import { dbTestBase } from "../../db-testutil";
import { Locale } from "../../../lib/model/locale";
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
            const locale = shuffle([
                Locale.ENGLISH,
                Locale.FINNISH,
                Locale.SWEDISH,
            ])[0];
            const subjects = Array.from({
                length: Math.floor(Math.random() * 10),
            }).map(() => newSubject(locale));
            await SubjectsDb.update(subjects, db);

            const response = await handler({ locale: locale });

            expect(response.length).toBe(subjects.length);
        });
    })
);
