import { dbTestBase } from "../../db-testutil.js";
import * as SubjectsDb from "../../../db/subjects.js";
import { Locale } from "../../../model/locale.js";
import { jest } from "@jest/globals";
import ky, { type Input, type Options, type ResponsePromise } from "ky";

const SERVER_PORT = 8090;

// eslint-disable-next-line dot-notation
process.env["ENDPOINT_USER"] = "some_user";
// eslint-disable-next-line dot-notation
process.env["ENDPOINT_PASS"] = "some_pass";
// eslint-disable-next-line dot-notation
process.env["ENDPOINT_URL"] = `http://localhost:${SERVER_PORT}`;

const lambda = await import(
  "../../../lambda/update-subjects/lambda-update-subjects.js"
);

describe(
  "update-subjects",
  dbTestBase((db) => {
    test("update", async () => {
      jest.spyOn(ky, "get").mockImplementation(
        (
          _url: Input,
          _options: Options | undefined,
        ): ResponsePromise => {
          if (_url.toString().match("/subjects")) {
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
            const locale = _url!.toString().match(/\/.+=(.+)/)![1];
            return Promise.resolve({
              status: 200,
              text: () => Promise.resolve(fakeSubjects(locale)),
            }) as ResponsePromise;
          }
          return Promise.resolve({
            status: 404,
          }) as ResponsePromise;
        },
      );

      const expectedId = 2;
      await lambda.handler();

      const foundSubjectsFi = await SubjectsDb.findAll(Locale.FINNISH, db);
      expect(foundSubjectsFi.length).toBe(1);
      expect(foundSubjectsFi[0]!.id).toBe(expectedId);

      const foundSubjectsSv = await SubjectsDb.findAll(Locale.SWEDISH, db);
      expect(foundSubjectsSv.length).toBe(1);
      expect(foundSubjectsSv[0]!.id).toBe(expectedId);

      const foundSubjectsEn = await SubjectsDb.findAll(Locale.ENGLISH, db);
      expect(foundSubjectsEn.length).toBe(1);
      expect(foundSubjectsEn[0]!.id).toBe(expectedId);
    });
  }),
);

function fakeSubjects(locale?: string): string {
  if (locale === "fi") {
    return `
<?xml version="1.0" encoding="UTF-8"?>
<subjects>
    <subject>
        <active>1</active>
        <name>Päällystetyn tien kunto (esim. päällystevaurio, harjaustarve)</name>
        <id>2</id>
        <locale>fi</locale>
    </subject>
</subjects>
`;
  } else if (locale === "sv") {
    return `
<?xml version="1.0" encoding="UTF-8"?>
<subjects>
    <subject>
        <active>1</active>
        <name>En belagd vägs skick (t.ex. beläggningsskada, behov av borstning)</name>
        <id>2</id>
        <locale>sv</locale>
    </subject>
</subjects>
`;
  }
  return `
<?xml version="1.0" encoding="UTF-8"?>
<subjects>
    <subject>
        <active>1</active>
        <name>Condition of paved road (e.g. paving damage, need for brushing)</name>
        <id>2</id>
        <locale>en</locale>
    </subject>
</subjects>
`;
}
