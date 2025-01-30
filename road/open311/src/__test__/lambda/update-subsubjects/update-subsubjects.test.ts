import { dbTestBase } from "../../db-testutil.js";
import * as SubSubjectsDb from "../../../db/subsubjects.js";
import { Locale } from "../../../model/locale.js";
import type { DTDatabase } from "@digitraffic/common/dist/database/database";
import { jest } from "@jest/globals";
import axios, { type AxiosRequestConfig } from "axios";

const SERVER_PORT = 8091;

// eslint-disable-next-line dot-notation
process.env["ENDPOINT_USER"] = "some_user";
// eslint-disable-next-line dot-notation
process.env["ENDPOINT_PASS"] = "some_pass";
// eslint-disable-next-line dot-notation
process.env["ENDPOINT_URL"] = `http://localhost:${SERVER_PORT}`;

const lambda = await import(
  "../../../lambda/update-subsubjects/lambda-update-subsubjects.js"
);

describe(
  "update-subsubjects",
  dbTestBase((db: DTDatabase) => {
    test("update", async () => {
      jest.spyOn(axios, "get").mockImplementation(
        (
          _url: string,
          _config?: AxiosRequestConfig<unknown>,
        ): Promise<unknown> => {
          if (_url.match("/subsubjects")) {
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
            const locale = _url!.match(/\/.+=(.+)/)![1];
            return Promise.resolve({
              status: 200,
              data: fakeSubSubjects(locale),
            });
          }
          return Promise.resolve({
            status: 404,
          });
        },
      );
      const expectedId = 305;
      await lambda.handler();

      const foundSubSubjectsFi = await SubSubjectsDb.findAll(
        Locale.FINNISH,
        db,
      );
      expect(foundSubSubjectsFi.length).toBe(1);
      expect(foundSubSubjectsFi[0]!.id).toBe(expectedId);

      const foundSubSubjectsSv = await SubSubjectsDb.findAll(
        Locale.SWEDISH,
        db,
      );
      expect(foundSubSubjectsSv.length).toBe(1);
      expect(foundSubSubjectsSv[0]!.id).toBe(expectedId);

      const foundSubSubjectsEn = await SubSubjectsDb.findAll(
        Locale.ENGLISH,
        db,
      );
      expect(foundSubSubjectsEn.length).toBe(1);
      expect(foundSubSubjectsEn[0]!.id).toBe(expectedId);
    });
  }),
);

function fakeSubSubjects(locale?: string): string {
  if (locale === "fi") {
    return `
<?xml version="1.0" encoding="UTF-8"?>
<subsubjects>
    <subsubject>
        <active>1</active>
        <name>Vettä tai öljyä tiellä</name>
        <id>305</id>
        <locale>fi</locale>
        <subject_id>3</subject_id>
    </subsubject>
</subsubjects>
`;
  } else if (locale === "sv") {
    return `
<?xml version="1.0" encoding="UTF-8"?>
<subsubjects>
    <subsubject>
        <active>1</active>
        <name>Vatten eller olja på vägen</name>
        <id>305</id>
        <locale>sv</locale>
        <subject_id>3</subject_id>
    </subsubject>
</subsubjects>
`;
  }
  return `
<?xml version="1.0" encoding="UTF-8"?>
<subsubjects>
    <subsubject>
        <active>1</active>
        <name>Water or oil on the road</name>
        <id>305</id>
        <locale>en</locale>
        <subject_id>3</subject_id>
    </subsubject>
</subsubjects>
`;
}
