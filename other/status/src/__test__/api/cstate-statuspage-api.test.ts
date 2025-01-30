import {
  type ActiveMaintenance,
  CStateStatuspageApi,
  type GithubActionPostData,
} from "../../api/cstate-statuspage-api.js";
import { getRandomInteger } from "@digitraffic/common/dist/test/testutils";
import { add, sub } from "date-fns";
import {
  getActiveMaintenance,
  getCstateIndexJson,
  mockSecretHolder,
  setTestEnv,
} from "../testutils.js";
import axios, { type AxiosRequestConfig } from "axios";
import { expect, jest } from "@jest/globals";
import type { SecretHolder } from "@digitraffic/common/dist/aws/runtime/secrets/secret-holder";
import type { UpdateStatusSecret } from "../../secret.js";
import { getEnvVariable } from "@digitraffic/common/dist/utils/utils";
import { StatusEnvKeys } from "../../keys.js";
import ky, { type Input, type Options, type ResponsePromise } from "ky";

let secretHolder: SecretHolder<UpdateStatusSecret>;

let cStateApi: CStateStatuspageApi;

describe("CStateApiTest", () => {
  beforeAll(() => {
    setTestEnv();
    secretHolder = mockSecretHolder();
    cStateApi = makeApi();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("getStatus - no maintenances", async (): Promise<void> => {
    await expectMaintenance([], false);
  });

  test("getStatus - active maintenance, not with NodePing disable", async (): Promise<void> => {
    await expectMaintenance([{
      disableNodeping: false,
      start: getDateInPast(),
    }], false);
  });

  test("getStatus - active maintenance, with NodePing disable", async (): Promise<void> => {
    await expectMaintenance(
      [{ disableNodeping: true, start: getDateInPast() }],
      true,
    );
  });

  test("getStatus - future maintenance, not with NodePing disable", async (): Promise<void> => {
    await expectMaintenance([{
      disableNodeping: false,
      start: getDateInFuture(),
    }], false);
  });

  test("getStatus - future maintenance, with NodePing disable", async (): Promise<void> => {
    await expectMaintenance([{
      disableNodeping: true,
      start: getDateInFuture(),
    }], false);
  });

  test("getStatus - future maintenance in 1 minute, with NodePing disable should activate", async (): Promise<void> => {
    await expectMaintenance([{
      disableNodeping: true,
      start: getDateInFuture(30),
    }], true);
  });

  test("findActiveMaintenance - no maintenances", async (): Promise<void> => {
    await expectFindActiveMaintenance([], false);
  });

  test("findActiveMaintenance - active maintenance, not with NodePing disable", async (): Promise<void> => {
    await expectFindActiveMaintenance([{
      disableNodeping: false,
      start: getDateInPast(),
    }], false);
  });

  test("findActiveMaintenance - active maintenance, with NodePing disable", async (): Promise<void> => {
    await expectFindActiveMaintenance([{
      disableNodeping: true,
      start: getDateInPast(),
    }], true);
  });

  test("findActiveMaintenance - future maintenance, not with NodePing disable", async (): Promise<void> => {
    await expectFindActiveMaintenance([{
      disableNodeping: false,
      start: getDateInFuture(),
    }], false);
  });

  test("findActiveMaintenance - future maintenance, with NodePing disable", async (): Promise<void> => {
    await expectFindActiveMaintenance([{
      disableNodeping: true,
      start: getDateInFuture(),
    }], false);
  });

  test("findActiveMaintenance - future maintenance in 1 minute, with NodePing disable should activate", async () => {
    await expectFindActiveMaintenance([{
      disableNodeping: true,
      start: getDateInFuture(30),
    }], true);
  });

  test("triggerUpdateMaintenanceGithubAction", async (): Promise<void> => {
    await expectTriggerUpdateMaintenanceGithubAction(getActiveMaintenance());
  });

  interface TestMaintenance {
    readonly disableNodeping: boolean;
    readonly start: Date;
  }

  async function expectMaintenance(
    maintenances: TestMaintenance[],
    expectMaintenance: boolean,
  ): Promise<void> {
    const spy = jest
      .spyOn(axios, "get")
      .mockImplementation(
        (
          _url: string,
          _config?: AxiosRequestConfig<unknown>,
        ): Promise<unknown> => {
          expect(_url).toEqual(
            `${getEnvVariable(StatusEnvKeys.C_STATE_PAGE_URL)}/index.json`,
          );
          return Promise.resolve({
            status: 200,
            data: getCstateIndexJson(maintenances),
          });
        },
      );
    const result = await cStateApi.isActiveMaintenances();
    expect(result).toBe(expectMaintenance);
    expect(spy).toHaveBeenCalledTimes(1);
  }

  async function expectFindActiveMaintenance(
    maintenances: TestMaintenance[],
    expectMaintenance: boolean,
  ): Promise<void> {
    const indexJson = getCstateIndexJson(maintenances);
    const spy = jest
      .spyOn(axios, "get")
      .mockImplementation(
        (
          _url: string,
          _config?: AxiosRequestConfig<unknown>,
        ): Promise<unknown> => {
          expect(_url).toEqual(
            `${getEnvVariable(StatusEnvKeys.C_STATE_PAGE_URL)}/index.json`,
          );
          return Promise.resolve({
            status: 200,
            data: indexJson,
          });
        },
      );
    const result = await cStateApi.findActiveMaintenance();
    if (expectMaintenance) {
      expect(result).toStrictEqual(
        {
          issue: indexJson.pinnedIssues[0]!,
          baseURL: indexJson.baseURL,
        } satisfies ActiveMaintenance,
      );
    } else {
      expect(result).toBeUndefined();
    }
    expect(spy).toHaveBeenCalledTimes(1);
  }

  async function expectTriggerUpdateMaintenanceGithubAction(
    maintenance: ActiveMaintenance,
  ): Promise<void> {
    const url = `https://api.github.com/repos/${
      getEnvVariable(StatusEnvKeys.GITHUB_OWNER)
    }/${getEnvVariable(StatusEnvKeys.GITHUB_REPO)}/actions/workflows/${
      getEnvVariable(StatusEnvKeys.GITHUB_UPDATE_MAINTENANCE_WORKFLOW_FILE)
    }/dispatches` as const;
    const gitHubPat = (await secretHolder.get()).gitHubPat;
    const spy = jest
      .spyOn(ky, "post")
      .mockImplementation(
        (_url: Input, _options?: Options | undefined): ResponsePromise => {
          expect(_url).toEqual(url);
          if (!_options) {
            throw new Error("_options have to be defined");
          }
          const data = _options
            .json as GithubActionPostData satisfies GithubActionPostData;
          const headers = _options.headers as Record<string, string>;
          expect(data.ref).toEqual(
            `refs/heads/${getEnvVariable(StatusEnvKeys.GITHUB_BRANCH)}`,
          );
          expect(data.inputs.baseUrl).toEqual(
            getEnvVariable(StatusEnvKeys.C_STATE_PAGE_URL),
          );
          expect(data.inputs.permalink).toMatch(
            `${
              getEnvVariable(StatusEnvKeys.C_STATE_PAGE_URL)
            }/issues/digitraffic-maintenance/`,
          );

          // eslint-disable-next-line dot-notation
          expect(headers["Accept"]).toEqual("application/vnd.github+json");
          expect(headers["Content-Type"]).toEqual(
            "application/vnd.github+json",
          );
          // eslint-disable-next-line dot-notation
          expect(headers["Authorization"]).toEqual(`token ${gitHubPat}`);
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ Status: 204 }),
          }) as ResponsePromise;
        },
      );

    await cStateApi.triggerUpdateMaintenanceGithubAction(maintenance);

    expect(spy).toHaveBeenCalledTimes(1);
  }

  function getDateInPast(seconds?: number): Date {
    return sub(new Date(), {
      seconds: seconds ?? getRandomInteger(60, 10 * 60),
    });
  }

  function getDateInFuture(seconds?: number): Date {
    return add(new Date(), {
      seconds: seconds ?? getRandomInteger(2 * 60, 10 * 60),
    });
  }

  function makeApi(): CStateStatuspageApi {
    return new CStateStatuspageApi(
      getEnvVariable(StatusEnvKeys.C_STATE_PAGE_URL),
      getEnvVariable(StatusEnvKeys.GITHUB_OWNER),
      getEnvVariable(StatusEnvKeys.GITHUB_REPO),
      getEnvVariable(StatusEnvKeys.GITHUB_BRANCH),
      getEnvVariable(StatusEnvKeys.GITHUB_UPDATE_MAINTENANCE_WORKFLOW_FILE),
      secretHolder,
    );
  }
});
