import axios from 'axios';

import {RoadConditionApi} from "../../api/road-condition";

jest.mock('axios');

describe("Road network condition API", () => {

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it("should fetch alarm types from the api", () => {
        const data = {
            alarmTypes: [
                {alarmId: 1, alarmText: "Tienpinta pakkaselle"},
                {alarmId: 2, alarmText: "Lumi alkaa kertyä tienpinnalle"},
            ],
        };
        const authKey = "authkey";
        const endpoint = "http://endpoint";

        const api = new RoadConditionApi(authKey, endpoint);

        (axios.get as unknown as jest.Mock).mockResolvedValueOnce({ status: 200, data});

        return api.getAlarmTypes()
            .then(d => expect(d).toEqual(data))
            .then(() => expect(axios.get).toHaveBeenCalledWith(`${endpoint}/keli/halytystyypit?authKey=${authKey}`));
    });

    it("should fetch alarms from the api", () => {
        const authKey = "authkey";
        const endpoint = "http://endpoint";
        const api = new RoadConditionApi(authKey, endpoint);

        (axios.get as unknown as jest.Mock).mockResolvedValueOnce({ status: 200, data: {}});

        return api.getAlarms()
            .then(() => expect(axios.get).toHaveBeenCalledWith(`${endpoint}/keli/halytykset?authKey=${authKey}`));
    });

    it("should fetch devices from the api", () => {
        const authKey = "authkey";
        const endpoint = "http://endpoint";
        const api = new RoadConditionApi(authKey, endpoint);

        (axios.get as unknown as jest.Mock).mockResolvedValueOnce({ status: 200, data: {}});

        return api.getDevices()
            .then(() => expect(axios.get).toHaveBeenCalledWith(`${endpoint}/keli/laitetiedot?authKey=${authKey}`));
    });
});
