import type { Activity, Dirway, Dirwaypoint, Location, PortSuspension, PortSuspensionLocation, Queue, Restriction, Source, Vessel } from "../../model/apidata.js";
import { createTestFunctions } from "./data-updater-testutil.js";

const ACTIVITY_1: Activity = {
    rv: 0,
    id: "id1",
    change_time: new Date(),
    deleted: undefined,
    start_time: new Date(),
    icebreaker_id: "",
    type: ""
};

const ACTIVITY_1_1: Activity = { ...ACTIVITY_1, ...{ rv: 1, text_compilation: "foo" } };

const LOCATION_1: Location = {
    name: "name",
    type: "type",
    locode_list: "",
    nationality: "",
    latitude: 12,
    longitude: 13,
    winterport: false,
    rv: 0,
    id: "id1",
    change_time: new Date(),
    deleted: undefined
};

const LOCATION_1_1: Location = {
    ...LOCATION_1,
    ...{
        name: "newName",
        rv: 1
    }
};

const RESTRICTION_1: Restriction = {
    rv: 0,
    id: "id1",
    location_id: "location_1",
    change_time: new Date(),
    deleted: undefined,
    start_time: new Date(),
    text_compilation: ""
};

const RESTRICTION_1_1: Restriction = { ...RESTRICTION_1, ...{ rv: 1, text_compilation: "foo" } };

const SOURCE_1: Source = {
    rv: 0,
    id: "id1",
    change_time: new Date(),
    deleted: undefined,
    name: "",
    nationality: "",
    type: ""
};

const SOURCE_1_1: Source = { ...SOURCE_1, ...{ rv: 1, text_compilation: "foo" } };

const VESSEL_1: Vessel = {
    rv: 0,
    id: "id1",
    change_time: new Date(),
    deleted: undefined,
    name: "",
    shortcode: ""
};

const VESSEL_1_1: Vessel = { ...VESSEL_1, ...{ rv: 1, text_compilation: "foo" } };

const QUEUE_1: Queue = {
    id: "id1",
    icebreaker_id: "",
    vessel_id: "",
    start_time: new Date(),
    end_time: new Date(),
    order_num: 0,
    rv: 0,
    change_time: new Date(),
    deleted: undefined
};

const QUEUE_1_1: Queue = { ...QUEUE_1, ...{ rv: 1, order_num: 2}};

const DIRWAY_1: Dirway = {
    id: "id1",
    name: "name",
    description: "empty",
    rv: 0,
    change_time: new Date(),
    deleted: undefined
};

const DIRWAY_1_1: Dirway = { ...DIRWAY_1, ... {rv: 1, description: "foo" }}

const DIRWAYPOINT_1: Dirwaypoint = {
    id: "id1",
    dirway_id: "",
    order_num: 0,
    name: "",
    latitude: 0,
    longitude: 0,
    rv: 0,
    change_time: new Date(),
    deleted: undefined
};

const DIRWAYPOINT_1_1 = {...DIRWAYPOINT_1, ...{rv: 1, name: "foo" }};

const PORT_SUSPENSION_1: PortSuspension = {
    start_time: new Date(),
    prenotification: false,
    ports_closed: false,
    due_to: "",
    rv: 0,
    id: "id1",
    change_time: new Date(),
    deleted: undefined
};

const PORT_SUSPENSION_1_1: PortSuspension = {...PORT_SUSPENSION_1, ...{rv: 1, due_to: "foo"}};

const PORT_SUSPENSION_LOCATION_1: PortSuspensionLocation = {
    suspension_id: "",
    location_id: "",
    rv: 0,
    id: "id1",
    change_time: new Date(),
    deleted: undefined
};

const PORT_SUSPENSION_LOCATION_1_1 = {...PORT_SUSPENSION_LOCATION_1, ...{rv: 2, location_id: "foo"}};

describe("update activities", createTestFunctions("wn_activity", "activity", ACTIVITY_1, ACTIVITY_1_1));
describe("update locations", createTestFunctions("wn_location", "location", LOCATION_1, LOCATION_1_1));
describe("update restrictions", createTestFunctions("wn_restriction", "restriction", RESTRICTION_1, RESTRICTION_1_1));
describe("update sources", createTestFunctions("wn_source", "source", SOURCE_1, SOURCE_1_1));
describe("update vessels", createTestFunctions("wn_vessel", "vessel", VESSEL_1, VESSEL_1_1));
describe("update queues", createTestFunctions("wn_queue", "queue", QUEUE_1, QUEUE_1_1));
describe("update dirways", createTestFunctions("wn_dirway", "dirway", DIRWAY_1, DIRWAY_1_1));
describe("update dirwaypoints", createTestFunctions("wn_dirwaypoint", "dirwaypoint", DIRWAYPOINT_1, DIRWAYPOINT_1_1));
describe("update port suspensions", createTestFunctions("wn_port_suspension", "port-suspension", PORT_SUSPENSION_1, PORT_SUSPENSION_1_1));
describe("update port suspension locations", createTestFunctions("wn_port_suspension_location", "port-suspension-location", PORT_SUSPENSION_LOCATION_1, PORT_SUSPENSION_LOCATION_1_1));
