import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import * as VisApi from "../api/vis.js";

export class VisService {
  private readonly ca: string;
  private readonly clientCertificate: string;
  private readonly privateKey: string;
  private readonly serviceRegistryUrl: string;

  constructor(
    ca: string,
    clientCertificate: string,
    privateKey: string,
    serviceRegistryUrl: string = "",
  ) {
    this.ca = ca;
    this.clientCertificate = clientCertificate;
    this.privateKey = privateKey;
    this.serviceRegistryUrl = serviceRegistryUrl;
  }

  async sendFault(faultS124: string, url: string): Promise<void> {
    const start = Date.now();

    try {
      await VisApi.postDocument(
        faultS124,
        url,
        this.ca,
        this.clientCertificate,
        this.privateKey,
      );
    } finally {
      logger.info({
        method: "VisService.sendFault",
        tookMs: Date.now() - start,
      });
    }
  }

  async sendWarning(warningS124: string, url: string): Promise<void> {
    const start = Date.now();

    try {
      await VisApi.postDocument(
        warningS124,
        url,
        this.ca,
        this.clientCertificate,
        this.privateKey,
      );
    } finally {
      logger.info({
        method: "VisService.sendWarning",
        tookMs: Date.now() - start,
      });
    }
  }

  async queryCallBackForImo(imo: string): Promise<string | undefined> {
    const start = Date.now();

    try {
      return await VisApi.query(imo, this.serviceRegistryUrl);
    } finally {
      logger.info({
        method: "VisService.queryCallBackForImo",
        tookMs: Date.now() - start,
      });
    }
  }
}
