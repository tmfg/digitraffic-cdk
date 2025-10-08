import { randomInt } from "es-toolkit";
import type {
  ActivityDB,
  Dirway,
  Dirwaypoint,
  Location,
  PortSuspension,
  PortSuspensionLocation,
  QueueDB,
  Restriction,
  Source,
  Vessel,
} from "../../model/apidata.js";
import { createTestFunctions } from "./data-updater-testutil.js";
import { addDays } from "date-fns";

export const ACTIVITY_1: ActivityDB = {
  rv: 0,
  id: "id1",
  vessel_id: "id1",
  change_time: new Date(),
  deleted: undefined,
  start_time: new Date(),
  icebreaker_id: "",
  reason: "tell my why?",
  type: "",
};

const ACTIVITY_1_1: ActivityDB = {
  ...ACTIVITY_1,
  ...{ rv: 1, text_compilation: "foo" },
};

export function createActivity(
  props: {
    id?: string;
    vessel_id?: string;
    icebreaker_id?: string;
    type?: string;
    reason?: string;
    rv?: number;
  },
): ActivityDB {
  return {
    id: props.id ?? randomInt(1000000).toString(),
    vessel_id: props.vessel_id ?? "",
    icebreaker_id: props.icebreaker_id ?? "",
    type: props.type ?? "",
    reason: props.reason ?? "",
    rv: props.rv ?? 1,
    start_time: new Date(),
    change_time: new Date(),
    deleted: undefined,
  };
}

export const LOCATION_1: Location = {
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
  deleted: undefined,
};

const LOCATION_1_1: Location = {
  ...LOCATION_1,
  ...{
    name: "newName",
    rv: 1,
  },
};

export const RESTRICTION_1: Restriction = {
  rv: 0,
  id: "id1",
  location_id: "id1",
  change_time: new Date(),
  deleted: undefined,
  start_time: new Date(),
  text_compilation: "",
};

const RESTRICTION_1_1: Restriction = {
  ...RESTRICTION_1,
  ...{ rv: 1, text_compilation: "foo" },
};

const SOURCE_1: Source = {
  rv: 0,
  id: "id1",
  change_time: new Date(),
  deleted: undefined,
  name: "",
  nationality: "",
  type: "",
};

const SOURCE_1_1: Source = {
  ...SOURCE_1,
  ...{ rv: 1, text_compilation: "foo" },
};

export const VESSEL_1: Vessel = {
  rv: 0,
  id: "id1",
  change_time: new Date(),
  deleted: undefined,
  name: "",
  shortcode: "",
  type: "",
};

const VESSEL_1_1: Vessel = {
  ...VESSEL_1,
  ...{ rv: 1, text_compilation: "foo" },
};

export function createVessel(
  props: {
    id?: string;
    name?: string;
    type?: string;
    rv?: number;
    imo?: number;
    mmsi?: number;
  },
): Vessel {
  return {
    rv: props.rv ?? 1,
    id: props.id ?? randomInt(1000000).toString(),
    change_time: new Date(),
    deleted: undefined,
    name: props.name ?? "",
    shortcode: "",
    type: props.type ?? "",
    imo: props.imo ?? randomInt(1000000, 9999999),
    mmsi: props.mmsi ?? randomInt(100000000, 999999999),
  };
}

export const QUEUE_1: QueueDB = {
  id: "id1",
  icebreaker_id: "",
  vessel_id: "",
  start_time: new Date(),
  end_time: new Date(),
  order_num: 0,
  rv: 0,
  change_time: new Date(),
  deleted: undefined,
};

const QUEUE_1_1: QueueDB = { ...QUEUE_1, ...{ rv: 1, order_num: 2 } };

export function createQueue(
  props: {
    icebreaker_id?: string;
    vessel_id?: string;
    id?: string;
    order_num?: number;
    rv?: number;
  },
): QueueDB {
  return {
    id: props.id ?? randomInt(1000000).toString(),
    start_time: new Date(),
    end_time: addDays(new Date(), 1),
    change_time: new Date(),
    icebreaker_id: props.icebreaker_id ?? "",
    vessel_id: props.vessel_id ?? "",
    order_num: props.order_num ?? randomInt(1000),
    rv: props.rv ?? 1,
    deleted: undefined,
  };
}

export function createSource(
  props: {
    vessel_id?: string;
    id?: string;
    rv?: number;
    name?: string;
    nationality?: string;
    type?: string;
  },
): Source {
  return {
    id: props.id ?? randomInt(1000000).toString(),
    vessel_id: props.vessel_id ?? "",
    name: props.name ?? "",
    nationality: props.nationality ?? "",
    type: props.type ?? "",
    change_time: new Date(),
    rv: props.rv ?? 1,
    deleted: undefined,
  };
}

export const DIRWAY_1: Dirway = {
  id: "id1",
  name: "name",
  description: "empty",
  rv: 0,
  change_time: new Date(),
  deleted: undefined,
};

const DIRWAY_1_1: Dirway = { ...DIRWAY_1, ...{ rv: 1, description: "foo" } };

export const DIRWAYPOINT_1: Dirwaypoint = {
  id: "id1",
  dirway_id: "id1",
  order_num: 0,
  name: "",
  latitude: 0,
  longitude: 0,
  rv: 0,
  change_time: new Date(),
  deleted: undefined,
};

const DIRWAYPOINT_1_1 = { ...DIRWAYPOINT_1, ...{ rv: 1, name: "foo" } };

export const PORT_SUSPENSION_1: PortSuspension = {
  start_time: new Date(),
  prenotification: false,
  ports_closed: false,
  due_to: "no reason",
  rv: 0,
  id: "id1",
  change_time: new Date(),
  deleted: undefined,
};

const PORT_SUSPENSION_1_1: PortSuspension = {
  ...PORT_SUSPENSION_1,
  ...{ rv: 1, due_to: "foo" },
};

export const PORT_SUSPENSION_LOCATION_1: PortSuspensionLocation = {
  suspension_id: "id1",
  location_id: "id1",
  rv: 0,
  id: "id1",
  change_time: new Date(),
  deleted: undefined,
};

const PORT_SUSPENSION_LOCATION_1_1 = {
  ...PORT_SUSPENSION_LOCATION_1,
  ...{ rv: 2, location_id: "foo" },
};

describe(
  "update activities",
  createTestFunctions("wn_activity", "activity", ACTIVITY_1, ACTIVITY_1_1),
);
describe(
  "update locations",
  createTestFunctions("wn_location", "location", LOCATION_1, LOCATION_1_1),
);
describe(
  "update restrictions",
  createTestFunctions(
    "wn_restriction",
    "restriction",
    RESTRICTION_1,
    RESTRICTION_1_1,
  ),
);
describe(
  "update sources",
  createTestFunctions("wn_source", "source", SOURCE_1, SOURCE_1_1),
);
describe(
  "update vessels",
  createTestFunctions("wn_vessel", "vessel", VESSEL_1, VESSEL_1_1),
);
describe(
  "update queues",
  createTestFunctions("wn_queue", "queue", QUEUE_1, QUEUE_1_1),
);
describe(
  "update dirways",
  createTestFunctions("wn_dirway", "dirway", DIRWAY_1, DIRWAY_1_1),
);
describe(
  "update dirwaypoints",
  createTestFunctions(
    "wn_dirwaypoint",
    "dirwaypoint",
    DIRWAYPOINT_1,
    DIRWAYPOINT_1_1,
  ),
);
describe(
  "update port suspensions",
  createTestFunctions(
    "wn_port_suspension",
    "port-suspension",
    PORT_SUSPENSION_1,
    PORT_SUSPENSION_1_1,
  ),
);
describe(
  "update port suspension locations",
  createTestFunctions(
    "wn_port_suspension_location",
    "port-suspension-location",
    PORT_SUSPENSION_LOCATION_1,
    PORT_SUSPENSION_LOCATION_1_1,
  ),
);
