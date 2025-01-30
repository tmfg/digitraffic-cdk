import axios, { type AxiosError } from "axios";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";

export class PermitsApi {
  readonly apiUrl: string;
  readonly path: string;
  readonly authKey: string;

  readonly genericError: string;

  constructor(apiUrl: string, path: string, authKey: string) {
    this.apiUrl = apiUrl;
    this.path = path;
    this.authKey = authKey;

    this.genericError = `Query to ${this.path} failed`;
  }

  async getPermitsXml(): Promise<string> {
    const start = Date.now();

    try {
      const resp = await axios.get(
        `${this.apiUrl}${this.path}?authKey=${this.authKey}`,
        {
          timeout: 10000,
          headers: {
            Accept: "application/xml",
          },
          validateStatus: (status: number) => {
            return status === 200;
          },
        },
      );

      return resp.data as string;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        logger.error({
          method: "permits.getPermitsXml",
          message: `${this.genericError} with status ${axiosError.code}`,
        });
        throw Error(`${this.genericError} with: ${axiosError.message}`);
      }
      if (error instanceof Error) {
        throw Error(`${this.genericError} with: ${error.message}`);
      }
      throw error;
    } finally {
      logger.info({
        method: "permits.getPermitsXml",
        tookMs: Date.now() - start,
      });
    }
  }
}
