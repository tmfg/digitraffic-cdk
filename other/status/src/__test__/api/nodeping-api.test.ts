import {
    NODEPING_DIGITRAFFIC_USER,
    NODEPING_SENT_HEADERS,
    NodePingApi,
    type NodePingCheck,
    type NodePingCheckPostPutData,
    type NodePingContact,
    type NodePingContactPostPutData,
    type NodePingNotification
} from "../../api/nodeping-api.js";
import { randomString } from "@digitraffic/common/dist/test/testutils";
import { EndpointHttpMethod, EndpointProtocol, type MonitoredEndpoint } from "../../app-props.js";
import { NODEPING_API, mockSecretHolder, setTestEnv } from "../testutils.js";
import type { SecretHolder } from "@digitraffic/common/dist/aws/runtime/secrets/secret-holder";
import type { UpdateStatusSecret } from "../../secret.js";
import axios, { AxiosError, type AxiosRequestConfig } from "axios";
import { jest } from "@jest/globals";

let secretHolder: SecretHolder<UpdateStatusSecret>;
let nodepingApi: NodePingApi;

const CHECK_INTERVAL_MIN = 1 as const;
const CHECK_TIMEOUT_SEC = 30 as const;

describe("NodePing API test", () => {
    beforeAll(() => {
        setTestEnv();
        secretHolder = mockSecretHolder();
        nodepingApi = makeApi();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test("checkNeedsUpdate - timeout configured - equal timeout value", () => {
        const api = makeApi({ timeout: 30 });
        const check = makeCheck({ timeout: 30 });

        expect(api.checkNeedsUpdate(check)).toBe(false);
    });

    test("checkNeedsUpdate - timeout configured - different timeout value", () => {
        const api = makeApi({ timeout: 30 });
        const check = makeCheck({ timeout: 5 });

        expect(api.checkNeedsUpdate(check)).toBe(true);
    });

    test("checkNeedsUpdate - interval configured - equal interval value", () => {
        const api = makeApi({ interval: 3 });
        const check = makeCheck({ interval: 3 });

        expect(api.checkNeedsUpdate(check)).toBe(false);
    });

    test("checkNeedsUpdate - interval configured - different interval value", () => {
        const api = makeApi({ interval: 1 });
        const check = makeCheck({ interval: 5 });

        expect(api.checkNeedsUpdate(check)).toBe(true);
    });

    test("checkNeedsUpdate - correct digitraffic-user", () => {
        const api = makeApi();
        const check = makeCheck({
            headers: { "digitraffic-user": NODEPING_DIGITRAFFIC_USER }
        });

        expect(api.checkNeedsUpdate(check)).toBe(false);
    });

    test("checkNeedsUpdate - wrong digitraffic-user", () => {
        const api = makeApi();
        const check = makeCheck({ headers: { "digitraffic-user": "asdf" } });

        expect(api.checkNeedsUpdate(check)).toBe(true);
    });

    test("checkNeedsUpdate - digitraffic-user not configured", () => {
        const api = makeApi();
        const check = makeCheck({
            headers: { "not-digitraffic-user": "asdf" }
        });

        expect(api.checkNeedsUpdate(check)).toBe(true);
    });

    test("checkNeedsUpdate - http method not explicitly configured - needs to be HEAD", () => {
        const api = makeApi();
        const check = makeCheck({ method: EndpointHttpMethod.GET });

        expect(api.checkNeedsUpdate(check)).toBe(true);
    });

    test("checkNeedsUpdate - http method not explicitly configured - already HEAD", () => {
        const api = makeApi();
        const check = makeCheck({ method: EndpointHttpMethod.HEAD });

        expect(api.checkNeedsUpdate(check)).toBe(false);
    });

    test("checkNeedsUpdate - http method explicitly configured - different", () => {
        const api = makeApi();
        const check = makeCheck({ method: EndpointHttpMethod.GET });

        expect(
            api.checkNeedsUpdate(check, {
                name: "name",
                method: EndpointHttpMethod.HEAD,
                protocol: EndpointProtocol.HTTP,
                url: check.parameters.target
            })
        ).toBe(true);
    });

    test("checkNeedsUpdate - http method explicitly configured - same", () => {
        const api = makeApi();
        const check = makeCheck({ method: EndpointHttpMethod.HEAD });

        expect(
            api.checkNeedsUpdate(check, {
                name: "name",
                method: EndpointHttpMethod.HEAD,
                protocol: EndpointProtocol.HTTP,
                url: check.parameters.target
            })
        ).toBe(false);
    });

    test("checkNeedsUpdate - no need to update mqtt method", () => {
        const api = makeApi();
        const check = {
            ...makeCheck(),
            ...{
                type: "WEBSOCKET"
            }
        } as const satisfies NodePingCheck;
        // eslint-disable-next-line
        delete (check.parameters as any).method;

        expect(
            api.checkNeedsUpdate(check, {
                name: "name",
                protocol: EndpointProtocol.WebSocket,
                url: check.parameters.target
            })
        ).toBe(false);
    });

    test("checkNeedsUpdate - contacts ok", () => {
        const commonContactId = randomString();
        const api = makeApi();
        const check = makeCheck({ notifications: [makeNotification(commonContactId)] });

        expect(api.checkNeedsUpdate(check, undefined, [commonContactId])).toBe(false);
    });

    test("checkNeedsUpdate - contact missing", () => {
        const api = makeApi();
        const check = makeCheck();

        expect(api.checkNeedsUpdate(check, undefined, [randomString()])).toBe(true);
    });

    test("checkNeedsUpdate - extra contact", () => {
        const commonContactId = randomString();
        const api = makeApi();
        const check = makeCheck({
            notifications: [makeNotification(commonContactId), makeNotification(randomString())]
        });

        expect(api.checkNeedsUpdate(check, undefined, [commonContactId])).toBe(true);
    });

    test("checkNeedsUpdate - contacts not match", () => {
        const api = makeApi();
        const check = makeCheck({ notifications: [makeNotification(randomString())] });

        expect(api.checkNeedsUpdate(check, undefined, [randomString()])).toBe(true);
    });

    test("getNodePingChecks", async () => {
        const secret = await secretHolder.get();
        const spy = jest
            .spyOn(axios, "get")
            .mockImplementation((_url: string, _config?: AxiosRequestConfig<unknown>): Promise<unknown> => {
                expect(_url).toEqual(`${NODEPING_API}/checks?customerid=${secret.nodePingSubAccountId}`);
                return Promise.resolve({
                    status: 200,
                    data: getNodepinChecksJson()
                });
            });
        const checks = await nodepingApi.getNodePingChecks();
        expect(checks.length).toBe(2);
        expect(spy).toHaveBeenCalledTimes(1);
    });

    test("getNodepingContacts", async () => {
        const secret = await secretHolder.get();
        const spy = jest
            .spyOn(axios, "get")
            .mockImplementation((_url: string, _config?: AxiosRequestConfig<unknown>): Promise<unknown> => {
                expect(_url).toEqual(`${NODEPING_API}/contacts?customerid=${secret.nodePingSubAccountId}`);
                return Promise.resolve({
                    status: 200,
                    data: getNodepinContactsJson()
                });
            });

        const contacts = await nodepingApi.getNodepingContacts();
        expect(contacts.length).toBe(2);
        expect(contacts[0]?.custrole).toEqual("notify");
        expect(contacts[0]?.name).toEqual("contact1");
        expect(contacts[1]?.name).toEqual("contact2");
        expect(spy).toHaveBeenCalledTimes(1);
    });

    test("createNodepingContactForCState", async () => {
        const secret = await secretHolder.get();
        const owner = "foo";
        const repo = "bar";
        const branch = "master";
        const workflowFile = "workflowFile.yaml";
        const gitHubPat = "gh_pat_adfas";
        const nodepingContactName = "gh-contact";

        const spy = jest
            .spyOn(axios, "post")
            .mockImplementation(
                (_url: string, data?: unknown, _config?: AxiosRequestConfig<unknown>): Promise<unknown> => {
                    expect(_url).toEqual(`${NODEPING_API}/contacts`);

                    const body: NodePingContactPostPutData =
                        data as NodePingContactPostPutData satisfies NodePingContactPostPutData;

                    expect(body.name).toEqual(nodepingContactName);
                    expect(body.custrole).toEqual("notify");
                    expect(body.hasOwnProperty("addresses")).toBe(false); // this is not allowed to be posted
                    expect(body.newaddresses?.length).toBe(1);

                    const address = body.newaddresses[0];
                    expect(address?.address).toEqual(
                        `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowFile}/dispatches`
                    );
                    expect(address?.type).toEqual("webhook");
                    expect(address?.action).toEqual("post");
                    // @ts-ignore
                    expect(address?.headers.Authorization).toEqual(`token ${gitHubPat}`);
                    // @ts-ignore
                    expect(address?.headers.Accept).toEqual("application/vnd.github+json");
                    expect(address?.headers["Content-Type"]).toEqual("application/vnd.github+json");
                    expect(address?.data).toEqual({ ref: `refs/heads/${branch}` });

                    // Extra field for post request
                    expect((body as unknown as { token: string }).token).toEqual(secret.nodePingToken);
                    expect(
                        (
                            body as unknown as {
                                customerid: string;
                            }
                        ).customerid
                    ).toEqual(secret.nodePingSubAccountId);

                    return Promise.resolve({
                        status: 200,
                        data: {}
                    });
                }
            );

        await nodepingApi.createNodepingContactForCState(
            owner,
            repo,
            branch,
            workflowFile,
            gitHubPat,
            nodepingContactName
        );
        expect(spy).toHaveBeenCalledTimes(1);
    });

    test("enableNodePingChecks", async () => {
        await testNodePingChecksDisableall(false);
    });

    test("disableNodePingChecks", async () => {
        await testNodePingChecksDisableall(true);
    });

    test("enableNodePingChecks fail", async () => {
        await testNodePingChecksDisableall(false, true);
    });

    test("disableNodePingChecks fail", async () => {
        await testNodePingChecksDisableall(true, true);
    });

    test("createNodepingCheck", async () => {
        await testCreateNodepingCheck("/api/foo/v1/bar", [randomString()], "tie", "Road");
    });

    test("createNodepingCheck with extra params", async () => {
        await testCreateNodepingCheck("MQTT", [randomString(), randomString()], "meri", "Marine", {
            name: "Marine MQTT",
            url: "/mqtt",
            protocol: EndpointProtocol.WebSocket,
            method: EndpointHttpMethod.POST,
            sendData: '{ "app": "marine" }'
        } satisfies MonitoredEndpoint);
    });
});

async function testNodePingChecksDisableall(disableall: boolean, fail: boolean = false): Promise<void> {
    const url = `${NODEPING_API}/checks?disableall=${JSON.stringify(disableall)}`;

    const spy = jest
        .spyOn(axios, "put")
        .mockImplementation(
            async (_url: string, data?: unknown, _config?: AxiosRequestConfig<unknown>): Promise<unknown> => {
                expect(_url).toEqual(url);
                if (fail) {
                    throw new AxiosError("Put failed!");
                }

                await expectTokenAndCustomeridInData(data);

                return Promise.resolve({
                    status: 200,
                    data: {
                        disableall: disableall ? 3 : 0,
                        disabled: 0,
                        enabled: disableall ? 0 : 3
                    }
                });
            }
        );
    const spyDoPut = jest.spyOn(nodepingApi, "doPut");

    if (fail) {
        await expect(async () => {
            if (disableall) {
                await nodepingApi.disableNodePingChecks();
            } else {
                await nodepingApi.enableNodePingChecks();
            }
        }).rejects.toThrow();
    } else {
        if (disableall) {
            await nodepingApi.disableNodePingChecks();
        } else {
            await nodepingApi.enableNodePingChecks();
        }
    }

    expect(spyDoPut).toHaveBeenCalledTimes(1);
    expect(spyDoPut).toHaveBeenCalledWith(url, {});
    expect(spy).toHaveBeenCalledTimes(1);
}

async function testCreateNodepingCheck(
    endpoint: string,
    contactIds: string[],
    hostPart: string,
    appName: string,
    extraData?: MonitoredEndpoint
): Promise<void> {
    const expectedNotifications = contactIds.map((cid) => {
        return { [cid]: { delay: 0, schedule: "All" } };
    });

    const spy = jest
        .spyOn(axios, "post")
        .mockImplementation(
            async (_url: string, data?: unknown, _config?: AxiosRequestConfig<unknown>): Promise<unknown> => {
                expect(_url).toEqual(`${NODEPING_API}/checks`);

                const postData = data as NodePingCheckPostPutData;

                await expectTokenAndCustomeridInData(postData);
                expect(postData.type).toEqual(
                    extraData?.protocol === EndpointProtocol.WebSocket ? "WEBSOCKET" : "HTTPADV"
                );
                expect(postData.target).toEqual(
                    extraData?.url ? extraData?.url : `https://${hostPart}.digitraffic.fi${endpoint}`
                );
                expect(postData.method).toEqual(extraData?.method ?? EndpointHttpMethod.HEAD);
                if (extraData?.sendData) {
                    expect(postData.postdata).toEqual(extraData?.sendData);
                }

                expect(postData.label).toEqual(`${appName} ${endpoint}`);
                expect(postData.interval).toEqual(CHECK_INTERVAL_MIN);
                expect(postData.threshold).toEqual(CHECK_TIMEOUT_SEC);
                expect(postData.enabled).toEqual(true);
                expect(postData.follow).toEqual(true);
                expect(postData.sendheaders).toEqual(NODEPING_SENT_HEADERS);

                expect(postData.notifications).toEqual(expectedNotifications);

                console.log(JSON.stringify(postData));
                return Promise.resolve({
                    status: 200,
                    data: {}
                });
            }
        );

    await nodepingApi.createNodepingCheck(endpoint, contactIds, hostPart, appName, extraData);
    expect(spy).toHaveBeenCalledTimes(1);
}

function makeApi(options?: { timeout?: number; interval?: number }): NodePingApi {
    return new NodePingApi(
        secretHolder,
        1000,
        options?.timeout ?? CHECK_TIMEOUT_SEC,
        options?.interval ?? CHECK_INTERVAL_MIN
    );
}

function makeCheck(options?: {
    timeout?: number;
    method?: EndpointHttpMethod;
    interval?: number;
    headers?: Record<string, string>;
    notifications?: NodePingNotification[];
}): NodePingCheck {
    return {
        _id: randomString(),
        type: "HTTPADV",
        label: randomString(),
        enable: "active",
        state: 1,
        interval: options?.interval ?? 1,
        notifications: options?.notifications ?? [],
        parameters: {
            target: "http://some.url",
            method: options?.method ?? EndpointHttpMethod.HEAD,
            threshold: options?.timeout ?? 30,
            sendheaders: options?.headers ?? {
                "digitraffic-user": NODEPING_DIGITRAFFIC_USER
            }
        }
    };
}

function makeNotification(contactId: string): NodePingNotification {
    return { [contactId]: { delay: 0, schedule: "All" } };
}

function makeContact(id: number): NodePingContact {
    return {
        name: `contact${id}`,
        addresses: {},
        custrole: "notify"
    };
}

function getNodepinChecksJson(): Record<string, NodePingCheck> {
    return {
        check1: makeCheck(),
        check2: makeCheck()
    };
}

function getNodepinContactsJson(): Record<string, NodePingContact> {
    return {
        contact1: makeContact(1),
        contact2: makeContact(2)
    };
}

async function expectTokenAndCustomeridInData(data: unknown): Promise<void> {
    const secret: UpdateStatusSecret = await secretHolder.get();
    const authData = data as {
        token: string;
        customerid: string;
    };
    expect(authData.token).toEqual(secret.nodePingToken);
    expect(authData.customerid).toEqual(secret.nodePingSubAccountId);
}
