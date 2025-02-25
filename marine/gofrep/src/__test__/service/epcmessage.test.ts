import * as EpcMessageService from "../../service/epcmessage.js";
import type { EpcMessage } from "../../model/epcmessage.js";

describe("epcmessage service", () => {
  test("createEpcMessageResponse", () => {
    const epcMessage: EpcMessage = {
      EPCMessageHeader: {
        ShipMessageId: "1",
      },
    };
    const dateStr = "2021-07-29T10:20:30Z";
    const date = new Date(dateStr);

    const resp = EpcMessageService.createEpcMessageResponse(epcMessage, date);

    expect(resp).toMatchObject({
      EPCMessageHeader: {
        SentTime: dateStr,
        MessageType: 0,
        Version: "",
      },
    });
  });
});
