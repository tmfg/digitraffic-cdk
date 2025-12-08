import type { LoggerMethodType } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import type { SecretHolder } from "@digitraffic/common/dist/aws/runtime/secrets/secret-holder";
import { MediaType } from "@digitraffic/common/dist/aws/types/mediatypes";
import ky from "ky";
import _ from "lodash";
import type { MonitoredEndpoint } from "../app-props.js";
import { EndpointHttpMethod, EndpointProtocol } from "../app-props.js";
import type { UpdateStatusSecret } from "../secret.js";
import type { ErrorOrHTTPError } from "./api-tools.js";
import { convertToError } from "./api-tools.js";

const SERVICE = "NodePingApi" as const;

export const NODEPING_DIGITRAFFIC_USER = "internal-digitraffic-status";

export const NODEPING_SENT_HEADERS = {
  "accept-encoding": "gzip",
  "digitraffic-user": NODEPING_DIGITRAFFIC_USER,
} as const;

/**
 * This has only a subset of all the fields of NodePing Contact
 * @see https://nodeping.com/docs-api-checks.html
 */
export interface NodePingCheck {
  readonly _id: string;
  readonly label: string;
  readonly type: "HTTPADV" | "WEBSOCKET";
  // In documentation there is field enable and enabled??? "enable": "active" "enable": "inactive"
  readonly enable: "inactive" | "active";
  readonly state: 0 | 1;
  readonly interval: number;
  readonly notifications: NodePingNotification[];
  readonly parameters: {
    readonly target: string;
    readonly method: EndpointHttpMethod;
    readonly threshold: number;
    readonly sendheaders: Record<string, string>;
  };
}

export interface NodePingNotification {
  [key: string]: {
    readonly delay: number;
    readonly schedule: string;
  };
}

/**
 * This has only a subset of all the fields of NodePing Contact
 * @see https://nodeping.com/docs-api-contacts.html
 */
export interface NodePingContactAddress {
  address: string;
  type?: "email" | "sms" | "webhook" | string; // NodePing has many types; allow string fallback
}

/**
 * This has only a subset of all the fields of NodePing Contact
 * @see https://nodeping.com/docs-api-contacts.html
 */
export interface NodePingContact {
  readonly name: string;
  readonly addresses: Record<string, NodePingContactAddress>;
  readonly custrole: "notify";
}

export interface NodePingContactPostPutData {
  readonly name: string;
  readonly custrole: "notify";
  readonly newaddresses: NodePingNewAddress[];
}

interface NodePingCheckPostPutAuthData {
  customerid: string;
  token: string;
}

/**
 * This has only a subset of all the fields of NodePing Contact
 * @see https://nodeping.com/docs-api-contacts.html
 */
export interface NodePingCheckPostPutData {
  label?: string;
  type: "WEBSOCKET" | "HTTPADV";
  target?: string;
  interval: number | undefined;
  threshold: number | undefined;
  enabled?: boolean;
  follow?: boolean;
  method: EndpointHttpMethod | undefined;
  notifications: NodePingNotification[];
  postdata?: string;
  sendheaders: Record<string, string>;
  contentstring?: string;
  invert?: boolean;
  regex?: boolean;
}

interface NodePingCheckPutData extends NodePingCheckPostPutData {
  id: string;
}

export interface NodePingNewAddress {
  readonly address: string;
  readonly type: "webhook";
  readonly action: "get" | "put" | "post" | "head" | "delete" | "patch";
  readonly headers: Record<string, string>;
  readonly data: Record<string, string>;
}

export class NodePingApi {
  private readonly secretHolder: SecretHolder<UpdateStatusSecret>;
  private readonly requestTimeoutMs: number;
  private readonly checkTimeoutSeconds: number;
  private readonly checkIntervalMinutes: number;
  private readonly nodePingApi: string;

  constructor(
    secretHolder: SecretHolder<UpdateStatusSecret>,
    requestTimeoutMs: number,
    checkTimeoutSeconds: number,
    checkIntervalMinutes: number,
    nodePingApi: string = "https://api.nodeping.com/api/1",
  ) {
    this.secretHolder = secretHolder;
    this.requestTimeoutMs = requestTimeoutMs;
    this.checkTimeoutSeconds = checkTimeoutSeconds;
    this.checkIntervalMinutes = checkIntervalMinutes;
    this.nodePingApi = nodePingApi;
  }

  private async doGet<T>(url: string): Promise<T> {
    const secret = await this.secretHolder.get();
    return ky
      .get<T>(`${url}?customerid=${secret.nodePingSubAccountId}`, {
        timeout: this.requestTimeoutMs,
        headers: {
          Authorization: `Basic ${this.toBase64(secret.nodePingToken)}`,
        },
      })
      .catch(async (error: ErrorOrHTTPError) => {
        throw await convertToError(error);
      })
      .then((response) => response.json());
  }

  // create
  private async doPost<DATA>(url: string, data: DATA): Promise<void> {
    const secret = await this.secretHolder.get();
    const config = {
      headers: { "Content-type": MediaType.APPLICATION_JSON },
      timeout: this.requestTimeoutMs,
    };

    return ky
      .post(url, {
        json: {
          ...data,
          token: secret.nodePingToken,
          customerid: secret.nodePingSubAccountId,
        } satisfies NodePingCheckPostPutAuthData & DATA,
        ...config,
      })
      .catch(async (error: ErrorOrHTTPError) => {
        throw await convertToError(error);
      })
      .then((response) => response.json());
  }

  // update
  async doPut<DATA>(url: string, data: DATA): Promise<void> {
    const secret = await this.secretHolder.get();
    const config = {
      headers: { "Content-type": MediaType.APPLICATION_JSON },
      timeout: this.requestTimeoutMs,
    };
    return ky
      .put<void>(url, {
        json: {
          ...data,
          token: secret.nodePingToken,
          customerid: secret.nodePingSubAccountId,
        } satisfies NodePingCheckPostPutAuthData & DATA,
        ...config,
      })
      .catch(async (error: ErrorOrHTTPError) => {
        throw await convertToError(error);
      })
      .then((response) => response.json());
  }

  async getNodepingContacts(): Promise<NodePingContact[]> {
    const method =
      `${SERVICE}.getNodepingContacts` as const satisfies LoggerMethodType;
    const start = Date.now();
    const message = `Fetch NodePing contacts`;
    logger.info({
      method: method,
      message,
    });
    const url = `${this.nodePingApi}/contacts`;
    return this.doGet<Record<string, NodePingContact>>(url)
      .catch((reason) => {
        const errorMessage = `${message} failed with reason: ${JSON.stringify(
          reason,
        )}`;
        logger.error({
          method,
          message: errorMessage,
        });
        throw new Error(`${method} ${errorMessage}`);
      })
      .then((value) => Object.values(value))
      .finally(() =>
        logger.info({
          method: method,
          message: `${message} done`,
          tookMs: Date.now() - start,
        }),
      );
  }

  /**
   * @param owner action repo owner
   * @param repo action repo
   * @param branch action repo branch
   * @param workflowFile workflow in the action repo
   * @param gitHubPat GitHub personal access token
   * @param nodepingContactName name for NodePing contact
   */
  async createNodepingContactForCState(
    owner: string,
    repo: string,
    branch: string,
    workflowFile: string,
    gitHubPat: string,
    nodepingContactName: string,
  ): Promise<void> {
    const start = Date.now();
    const method =
      `${SERVICE}.createNodepingContactForCState` as const satisfies LoggerMethodType;
    const GITHUB_API =
      `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowFile}/dispatches` as const;

    const message = `Create contact ${nodepingContactName} for cState GitHub Action for branch ${branch}`;
    logger.info({
      method,
      message,
      customUrl: GITHUB_API,
    });

    // https://nodeping.com/docs-api-contacts.html
    // -d '{"ref":"topic-branch","inputs":{"name":"Mona the Octocat","home":"San Francisco, CA"}}'
    const url = `${this.nodePingApi}/contacts`;
    const data = {
      name: `${nodepingContactName}`,
      custrole: "notify",
      newaddresses: [
        {
          address: GITHUB_API,
          type: "webhook",
          action: "post",
          headers: {
            Accept: "application/vnd.github+json",
            "Content-Type": "application/vnd.github+json",
            Authorization: `token ${gitHubPat}`,
          },
          data: { ref: `refs/heads/${branch}` },
        },
      ],
    } satisfies NodePingContactPostPutData;

    return this.doPost<NodePingContactPostPutData>(url, data)
      .catch((reason) => {
        const errorMessage = `${message} failed with reason: ${JSON.stringify(
          reason,
        )}`;
        logger.error({
          method,
          message: errorMessage,
          customUrl: GITHUB_API,
        });
        throw new Error(`${method} ${errorMessage}`);
      })
      .finally(() =>
        logger.info({
          method,
          message: `${message} done`,
          tookMs: Date.now() - start,
          customUrl: GITHUB_API,
        }),
      );
  }

  async getNodePingChecks(): Promise<NodePingCheck[]> {
    const start = Date.now();
    const method =
      `${SERVICE}.getNodepingChecks` as const satisfies LoggerMethodType;
    const message = "Fetching NodePing checks";
    logger.info({
      method,
      message,
    });
    const url = `${this.nodePingApi}/checks`;
    return this.doGet<Record<string, NodePingCheck>>(`${url}`)
      .catch((reason) => {
        const errorMessage = `${message} failed with reason: ${JSON.stringify(
          reason,
        )}`;
        logger.error({
          method,
          message: errorMessage,
        });
        throw new Error(`${method} ${errorMessage}`);
      })
      .then((data) => Object.values(data))
      .finally(() =>
        logger.info({
          method,
          message: `${message} done`,
          tookMs: Date.now() - start,
        }),
      );
  }

  createNotificationsPostData(contactIds: string[]): NodePingNotification[] {
    const notifications: NodePingNotification[] = [];
    contactIds.forEach((contactId) => {
      notifications.push({
        [contactId]: { delay: 0, schedule: "All" },
      });
    });
    return notifications;
  }

  createNodepingCheck(
    endpoint: string,
    contactIds: string[],
    hostPart: string,
    appName: string,
    extraData?: MonitoredEndpoint,
  ): Promise<void> {
    const method =
      `${SERVICE}.createNodepingCheck` as const satisfies LoggerMethodType;
    const start = Date.now();
    const message = `Create NodePing check for endpoint ${endpoint}`;
    logger.info({
      method,
      message,
    });

    const checkMethod = extraData?.method ?? EndpointHttpMethod.HEAD;

    const type =
      extraData?.protocol === EndpointProtocol.WebSocket
        ? "WEBSOCKET"
        : "HTTPADV";
    const data: NodePingCheckPostPutData = {
      label: endpoint.includes(appName) ? endpoint : `${appName} ${endpoint}`,
      type,
      target: extraData?.url ?? `${hostPart}${endpoint}`,
      interval: this.checkIntervalMinutes,
      threshold: this.checkTimeoutSeconds,
      enabled: true,
      follow: true,
      sendheaders: NODEPING_SENT_HEADERS,
      method: checkMethod,
      notifications: this.createNotificationsPostData(contactIds),
    };

    if (type === "WEBSOCKET") {
      // Fix if type is changed and there is method other than head -> clear to default value
      data.method = undefined;
    }

    if (extraData?.sendData) {
      data.postdata = extraData.sendData;
      data.sendheaders["content-type"] = MediaType.APPLICATION_JSON;
    }

    if (extraData?.contentstring) {
      data.contentstring = extraData.contentstring;
      data.invert = extraData.invert ?? false;
      data.regex = extraData.regex ?? false;
    }

    const url = `${this.nodePingApi}/checks`;
    return this.doPost<NodePingCheckPostPutData>(url, data)
      .catch((reason) => {
        const errorMessage = `${message} failed with reason: ${JSON.stringify(
          reason,
        )}`;
        logger.error({
          method,
          message: errorMessage,
        });
        throw new Error(message);
      })
      .finally(() =>
        logger.info({
          method,
          message: `${message} done`,
          tookMs: Date.now() - start,
        }),
      );
  }

  async updateNodepingCheck(
    id: string,
    currentTarget: string,
    contactIds: string[],
    checkLabel: string,
    extraData?: MonitoredEndpoint,
  ): Promise<void> {
    const method =
      `${SERVICE}.updateNodepingCheck` as const satisfies LoggerMethodType;
    const start = Date.now();

    const checkMethod = extraData?.method ?? EndpointHttpMethod.HEAD;
    const data: NodePingCheckPutData = {
      id,
      type:
        extraData?.protocol === EndpointProtocol.WebSocket
          ? "WEBSOCKET"
          : "HTTPADV",
      target: extraData?.url ?? currentTarget,
      threshold: this.checkTimeoutSeconds,
      method: checkMethod,
      interval: this.checkIntervalMinutes,
      sendheaders: NODEPING_SENT_HEADERS,
      notifications: this.createNotificationsPostData(contactIds),
    } as const satisfies NodePingCheckPutData;

    if (extraData?.sendData) {
      data.postdata = extraData.sendData;
      data.sendheaders["content-type"] = MediaType.APPLICATION_JSON;
    }

    if (extraData?.contentstring) {
      data.contentstring = extraData.contentstring;
      data.invert = extraData.invert ?? false;
      data.regex = extraData.regex ?? false;
    }

    const message =
      `Update NodePing check ${checkLabel} id ${id}, properties ${JSON.stringify(
        data,
      )}` as const;

    logger.info({
      method,
      message,
    });

    const url = `${this.nodePingApi}/checks`;
    return this.doPut<NodePingCheckPutData>(url, data)
      .catch((reason) => {
        const errorMessage = `${message} failed with reason: ${JSON.stringify(
          reason,
        )}`;
        logger.error({
          method,
          message: errorMessage,
        });
        throw new Error(message);
      })
      .finally(() =>
        logger.info({
          method,
          message: `${message} done`,
          tookMs: Date.now() - start,
        }),
      );
  }

  checkNeedsUpdate(
    check: NodePingCheck,
    correspondingExtraEndpoint?: MonitoredEndpoint,
    contactIds: string[] = [],
  ): boolean {
    const method =
      `${SERVICE}.checkNeedsUpdate` as const satisfies LoggerMethodType;
    let needsUpdate = false;
    const messagePrefix = `Check ${check.label}` as const;

    if (
      this.checkTimeoutSeconds &&
      this.checkTimeoutSeconds !== check.parameters.threshold
    ) {
      logger.info({
        method,
        message: `${messagePrefix} timeout ${check.parameters.threshold} different than default ${this.checkTimeoutSeconds}`,
      });
      needsUpdate = true;
    }

    if (
      this.checkIntervalMinutes &&
      this.checkIntervalMinutes !== check.interval
    ) {
      logger.info({
        method,
        message: `${messagePrefix} interval ${check.interval} different than default ${this.checkIntervalMinutes}`,
      });
      needsUpdate = true;
    }

    if (check.type.toUpperCase() === "HTTPADV") {
      const digitrafficUser = Object.entries(
        check.parameters.sendheaders ?? {},
      ).find((e) => e[0].toLowerCase() === "digitraffic-user")?.[1];
      if (digitrafficUser !== NODEPING_DIGITRAFFIC_USER) {
        logger.info({
          method,
          message: `${messagePrefix} doesn't have digitraffic user header`,
        });
        needsUpdate = true;
      }
    }

    const checkMethod =
      correspondingExtraEndpoint?.method ?? EndpointHttpMethod.HEAD;
    // In case of Websocket method is not relevant
    if (
      correspondingExtraEndpoint?.protocol !== EndpointProtocol.WebSocket &&
      check.parameters.method !== checkMethod
    ) {
      logger.info({
        method,
        message: `${messagePrefix} method was not ${EndpointHttpMethod.HEAD}, instead: ${check.parameters.method}`,
      });
      needsUpdate = true;
    }

    if (
      correspondingExtraEndpoint &&
      check.parameters.target !== correspondingExtraEndpoint?.url
    ) {
      logger.info({
        method,
        message: `${messagePrefix} url was not ${correspondingExtraEndpoint?.url}, instead: ${check.parameters.target}`,
      });
      needsUpdate = true;
    }

    const currentContactIds = check.notifications.flatMap((n) => _.keys(n));

    if (
      !currentContactIds.every((c) => contactIds.includes(c)) ||
      !contactIds.every((c) => currentContactIds.includes(c))
    ) {
      needsUpdate = true;
      logger.info({
        method,
        message: `${messagePrefix} current contacts ${JSON.stringify(
          currentContactIds,
        )} needs to be updated to ${JSON.stringify(contactIds)}`,
      });
    }

    return needsUpdate;
  }

  getEnabledNodePingChecksCount(checks: NodePingCheck[]): number {
    return this.getEnabledNodePingChecks(checks).length;
  }

  getEnabledNodePingChecks(checks: NodePingCheck[]): NodePingCheck[] {
    return checks.filter((c) => c.enable === "active");
  }

  getDisabledNodePingChecksCount(checks: NodePingCheck[]): number {
    return this.getDisabledNodePingChecks(checks).length;
  }

  getDisabledNodePingChecks(checks: NodePingCheck[]): NodePingCheck[] {
    return checks.filter((c) => c.enable !== "active");
  }

  private async setNodePingCheckDisabledTo(disabled: boolean): Promise<void> {
    const method =
      `${SERVICE}.setNodePingCheckDisabledTo` as const satisfies LoggerMethodType;
    const message = `Set NodePing checks disabled to ${JSON.stringify(
      disabled,
    )}`;
    const start = Date.now();
    logger.info({
      method: method,
      message,
    });

    const url = `${this.nodePingApi}/checks?disableall=${JSON.stringify(
      disabled,
    )}` as const;

    return this.doPut(url, {})
      .catch((reason) => {
        const errorMessage = `${message} failed with reason: ${JSON.stringify(
          reason,
        )}`;
        logger.error({
          method,
          message: errorMessage,
        });
        throw new Error(`${method} ${errorMessage}`);
      })
      .then((result): void => {
        logger.info({
          method,
          message: `Update result ${JSON.stringify(result)}`,
        });
        return;
      })
      .finally(() =>
        logger.info({
          method: method,
          message: `${message} done`,
          tookMs: Date.now() - start,
        }),
      );
  }

  async enableNodePingChecks(): Promise<void> {
    await this.setNodePingCheckDisabledTo(false);
  }

  async disableNodePingChecks(): Promise<void> {
    await this.setNodePingCheckDisabledTo(true);
  }

  private toBase64(body: string): string {
    return Buffer.from(body).toString("base64");
  }
}
