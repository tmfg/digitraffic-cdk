import { beforeEach, describe, expect, test, vi } from "vitest";

// Mock dependencies before importing the service
vi.mock("mqtt", () => ({
  connectAsync: vi.fn(),
}));

vi.mock("@digitraffic/common/dist/database/database", () => ({
  inDatabaseReadonly: vi.fn(),
}));

vi.mock("../../dao/rtti.js", () => ({
  getRttiBySituationId: vi.fn(),
}));

vi.mock("@digitraffic/common/dist/aws/runtime/dt-logger-default", () => ({
  logger: { error: vi.fn() },
}));

import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { inDatabaseReadonly } from "@digitraffic/common/dist/database/database";
import { connectAsync } from "mqtt";
import { getRttiBySituationId } from "../../dao/rtti.js";
import { sendMqttUpdates } from "../../service/mqtt-sending-service.js";

const mockConnectAsync = vi.mocked(connectAsync);
const mockInDatabaseReadonly = vi.mocked(inDatabaseReadonly);
const mockGetRttiBySituationId = vi.mocked(getRttiBySituationId);
const mockLogger = vi.mocked(logger);

function makeClient() {
  return {
    publishAsync: vi.fn().mockResolvedValue(undefined),
    endAsync: vi.fn().mockResolvedValue(undefined),
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  mockInDatabaseReadonly.mockImplementation((fn) =>
    // @ts-expect-error db is not needed in tests
    fn(null),
  );
});

describe("sendMqttUpdates – URL parsing", () => {
  test("parses tcp:// URL into protocol, host and port", async () => {
    const client = makeClient();
    mockConnectAsync.mockResolvedValue(client as never);
    mockGetRttiBySituationId.mockResolvedValue([
      { message: "<situation/>", is_srti: false },
    ] as never);

    await sendMqttUpdates("tcp://mqtt.example.com:1883", "user", "pass", [
      "id1",
    ]);

    expect(mockConnectAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        protocol: "tcp",
        host: "mqtt.example.com",
        port: 1883,
        username: "user",
        password: "pass",
        clean: false,
        clientId: "mqtt-publisher",
      }),
    );
  });

  test("parses mqtt:// URL correctly", async () => {
    const client = makeClient();
    mockConnectAsync.mockResolvedValue(client as never);
    mockGetRttiBySituationId.mockResolvedValue([
      { message: "<situation/>", is_srti: false },
    ] as never);

    await sendMqttUpdates("mqtt://broker.example.com:1883", "u", "p", ["id1"]);

    expect(mockConnectAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        protocol: "mqtt",
        host: "broker.example.com",
        port: 1883,
      }),
    );
  });

  test("defaults to port 1883 when port is omitted from URL", async () => {
    const client = makeClient();
    mockConnectAsync.mockResolvedValue(client as never);
    mockGetRttiBySituationId.mockResolvedValue([
      { message: "<situation/>", is_srti: false },
    ] as never);

    await sendMqttUpdates("tcp://broker.example.com", "u", "p", ["id1"]);

    expect(mockConnectAsync).toHaveBeenCalledWith(
      expect.objectContaining({ port: 1883 }),
    );
  });

  test("parses mqtts:// URL with custom port", async () => {
    const client = makeClient();
    mockConnectAsync.mockResolvedValue(client as never);
    mockGetRttiBySituationId.mockResolvedValue([
      { message: "<situation/>", is_srti: false },
    ] as never);

    await sendMqttUpdates("mqtts://broker.example.com:8883", "u", "p", ["id1"]);

    expect(mockConnectAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        protocol: "mqtts",
        host: "broker.example.com",
        port: 8883,
      }),
    );
  });

  test("throws for unsupported protocol", async () => {
    mockGetRttiBySituationId.mockResolvedValue([
      { message: "<situation/>", is_srti: false },
    ] as never);

    await expect(
      sendMqttUpdates("https://broker.example.com:443", "u", "p", ["id1"]),
    ).rejects.toThrow("Unsupported MQTT protocol: https");
  });
});

describe("sendMqttUpdates – message publishing", () => {
  test("publishes RTTI topic for non-SRTI message", async () => {
    const client = makeClient();
    mockConnectAsync.mockResolvedValue(client as never);
    mockGetRttiBySituationId.mockResolvedValue([
      { message: "<situation/>", is_srti: false },
    ] as never);

    await sendMqttUpdates("tcp://broker.example.com:1883", "u", "p", ["id1"]);

    expect(client.publishAsync).toHaveBeenCalledOnce();
    expect(client.publishAsync).toHaveBeenCalledWith(
      "traffic-message-v3/traffic-data/datex2-3.5/RTTI",
      expect.stringContaining("<situation/>"),
    );
    expect(client.endAsync).toHaveBeenCalledOnce();
  });

  test("publishes SRTI topic for SRTI message", async () => {
    const client = makeClient();
    mockConnectAsync.mockResolvedValue(client as never);
    mockGetRttiBySituationId.mockResolvedValue([
      { message: "<srti/>", is_srti: true },
    ] as never);

    await sendMqttUpdates("tcp://broker.example.com:1883", "u", "p", ["id1"]);

    expect(client.publishAsync).toHaveBeenCalledWith(
      "traffic-message-v3/traffic-data/datex2-3.5/SRTI",
      expect.stringContaining("<srti/>"),
    );
  });

  test("publishes one message per RTTI record", async () => {
    const client = makeClient();
    mockConnectAsync.mockResolvedValue(client as never);
    mockGetRttiBySituationId.mockResolvedValue([
      { message: "<s1/>", is_srti: false },
      { message: "<s2/>", is_srti: true },
    ] as never);

    await sendMqttUpdates("tcp://broker.example.com:1883", "u", "p", [
      "id1",
      "id2",
    ]);

    expect(client.publishAsync).toHaveBeenCalledTimes(2);
    expect(client.endAsync).toHaveBeenCalledOnce();
  });

  test("does not connect when no RTTI data is found", async () => {
    mockGetRttiBySituationId.mockResolvedValue([] as never);

    await sendMqttUpdates("tcp://broker.example.com:1883", "u", "p", ["id1"]);

    expect(mockConnectAsync).not.toHaveBeenCalled();
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.objectContaining({ method: "MqttSendingService.sendMqttUpdate" }),
    );
  });
});
