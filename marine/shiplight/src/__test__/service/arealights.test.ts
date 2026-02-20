import { jest } from "@jest/globals";
import { AreaLightsApi } from "../../api/arealights.js";
import type { AreaTraffic } from "../../model/areatraffic.js";
import { AreaLightsService } from "../../service/arealights.js";

describe("arealights service", () => {
  test("updateLightsForArea - calls API", async () => {
    const api = createApi();
    const service = new AreaLightsService(api);
    const areaTraffic = createAreaTraffic();

    const updateLightsForAreaStub = jest
      .spyOn(AreaLightsApi.prototype, "updateLightsForArea")
      .mockResolvedValue({
        LightsSetSentFailed: [],
        LightsSetSentSuccessfully: [],
      });

    await service.updateLightsForArea(areaTraffic);

    expect(updateLightsForAreaStub).toHaveBeenCalledWith({
      routeId: areaTraffic.areaId,
      visibility: areaTraffic.visibilityInMeters,
      time: areaTraffic.durationInMinutes,
      MMSI: areaTraffic.ship.mmsi.toString(),
      shipName: areaTraffic.ship.name,
    });
  });

  test("updateLightsForArea - retry on error", async () => {
    const api = createApi();
    const service = new AreaLightsService(api);

    const areaTraffic = createAreaTraffic();
    const updateLightsForAreaStub = jest
      .spyOn(AreaLightsApi.prototype, "updateLightsForArea")
      .mockRejectedValueOnce({})
      .mockResolvedValueOnce({
        LightsSetSentFailed: [],
        LightsSetSentSuccessfully: [],
      });

    await service.updateLightsForArea(areaTraffic);

    const expectedArguments = {
      routeId: areaTraffic.areaId,
      visibility: areaTraffic.visibilityInMeters,
      time: areaTraffic.durationInMinutes,
      shipName: areaTraffic.ship.name,
      MMSI: areaTraffic.ship.mmsi.toString(),
    };

    expect(updateLightsForAreaStub).toHaveBeenCalledTimes(2);
    expect(updateLightsForAreaStub).toHaveBeenNthCalledWith(
      1,
      expectedArguments,
    );
    expect(updateLightsForAreaStub).toHaveBeenNthCalledWith(
      2,
      expectedArguments,
    );
  });

  function createApi(): AreaLightsApi {
    return new AreaLightsApi("", "");
  }

  function createAreaTraffic(): AreaTraffic {
    return {
      areaId: (Math.floor(Math.random() * 100) + 1) % 50,
      durationInMinutes: 45,
      visibilityInMeters: 5000,
      ship: {
        name: "test",
        mmsi: 1,
      },
    };
  }
});
