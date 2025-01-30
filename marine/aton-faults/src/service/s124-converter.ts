import { format } from "date-fns";
import type { DbFault } from "../model/fault.js";
import type { Feature, Geometry } from "geojson";
import * as wkx from "wkx";
import type {
  GmlEnvelope,
  S100PointProperty,
  S124DataSet,
  S124FixedDateRange,
  S124IMember,
  S124Member,
  S124MessageSeriesIdentifier,
} from "../model/dataset.js";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import type { WarningFeatureProperties } from "../model/warnings.js";
import { TZDate } from "@date-fns/tz";

const YEAR_MONTH_DAY = "yyyy-MM-dd";
const HOUR_MINUTE_SECOND = "HH:MM:SSXXX";

const PRODUCTION_AGENCY = {
  language: "fin",
  text: "Finnish Transport Infrastructure Agency",
};

const NAME_OF_SERIES_ATON_FAULTS = "Finnish ATON Faults";
const NAME_OF_SERIES_NAUTICAL_WARNINGS = "Finnish Nautical Warnings";

function createDataSet(
  id: string,
  boundedBy: GmlEnvelope,
  member: S124Member,
  imember: S124IMember,
): S124DataSet {
  return {
    "S124:DataSet": {
      $: {
        "xmlns:S124": "http://www.iho.int/S124/gml/1.0",
        "xsi:schemaLocation":
          "http://www.iho.int/S124/gml/1.0 ../../schemas/0.5/S124.xsd",
        "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
        "xmlns:gml": "http://www.opengis.net/gml/3.2",
        "xmlns:S100": "http://www.iho.int/s100gml/1.0",
        "xmlns:xlink": "http://www.w3.org/1999/xlink",
        "gml:id": id,
      },
      "gml:boundedBy": boundedBy,
      member,
      imember,
    },
  };
}

function createId(domain: string, id: number, year: number): string {
  return `FI.${domain}.${id}.${year}`;
}

function createUrn(id: string): string {
  return `urn:mrn:s124:${id}.P`;
}

export function convertFault(fault: DbFault): S124DataSet {
  const faultId = -fault.id;
  const year = fault.entry_timestamp.getFullYear() - 2000;

  const id = createId("AF", faultId, year);
  const urn = createUrn(id);

  const boundedBy = createBoundedBy(
    createCoordinatePair(fault.geometry),
    createCoordinatePair(fault.geometry),
  );

  const imember: S124IMember = {
    "S124:S124_NWPreamble": {
      $: {
        "gml:id": `PR.${id}`,
      },
      id: urn,
      messageSeriesIdentifier: createMessageSeriesIdentifier(
        NAME_OF_SERIES_ATON_FAULTS,
        faultId,
        year,
      ),
      sourceDate: format(new Date(fault.entry_timestamp), YEAR_MONTH_DAY),
      generalArea: "Baltic sea",
      locality: {
        text: fault.fairway_name_fi,
      },
      title: {
        text:
          `${fault.aton_type} ${fault.aton_name_fi} Nr. ${fault.aton_id}, ${fault.state}`,
      },
      fixedDateRange: createFixedDateRangeForFault(fault),
      theWarningPart: {
        $: {
          "xlink:href": `${id}.1`,
        },
      },
    },
  };

  const member: S124Member = {
    "S124:S124_NavigationalWarningPart": {
      $: {
        "gml:id": `${id}.1`,
      },
      id: `urn:mrn:s124:${id}.1`,
      geometry: createPointProperty(createCoordinatePair(fault.geometry), id),
      header: {
        $: {
          owns: "true",
        },
      },
    },
  };

  return createDataSet(id, boundedBy, member, imember);
}

export function convertWarning(warning: Feature): S124DataSet {
  // TODO: create type for warning properties
  const p = warning.properties as WarningFeatureProperties;
  const year = new Date(p.creationTime).getFullYear() - 2000;
  const warningId = p.id;
  const id = createId("NW", warningId, year);
  const urn = createUrn(id);

  const boundedBy = createBoundedBy("17.0000 55.0000", "32.0000 75.0000");

  const imember: S124IMember = {
    "S124:S124_NWPreamble": {
      $: {
        "gml:id": `PR.${id}`,
      },
      id: urn,
      messageSeriesIdentifier: createMessageSeriesIdentifier(
        NAME_OF_SERIES_NAUTICAL_WARNINGS,
        warningId,
        year,
      ),
      sourceDate: format(new Date(p.creationTime), YEAR_MONTH_DAY),
      generalArea: "Baltic sea",
      locality: {
        text: p.areasEn,
      },
      title: {
        text: p.typeEn,
      },
      fixedDateRange: createFixedDateRangeForWarning(p),
      theWarningPart: {
        $: {
          "xlink:href": `${id}.1`,
        },
      },
    },
  };

  const member: S124Member = {
    "S124:S124_NavigationalWarningPart": {
      $: {
        "gml:id": `${id}.1`,
      },
      id: `urn:mrn:s124:${id}.1`,
      geometry: createGeometryForWarning(warning.geometry, id),
      Subject: {
        text: p.contentsEn,
      },
      header: {
        $: {
          owns: "true",
        },
      },
    },
  };

  return createDataSet(id, boundedBy, member, imember);
}

function createBoundedBy(
  lowerCorner: string,
  upperCorner: string,
): GmlEnvelope {
  return {
    "gml:Envelope": {
      $: {
        srsName: "EPSG:4326",
      },
      "gml:lowerCorner": lowerCorner,
      "gml:upperCorner": upperCorner,
    },
  };
}

function createFixedDateRangeForWarning(
  p: WarningFeatureProperties,
): S124FixedDateRange {
  const validityStartTime = p.validityStartTime;
  const vst = new Date(validityStartTime);

  if (p.validityEndTime) {
    const vet = new Date(p.validityEndTime);

    return {
      timeOfDayStart: format(new TZDate(vst, "UTC"), HOUR_MINUTE_SECOND),
      timeOfDayEnd: format(new TZDate(vet, "UTC"), HOUR_MINUTE_SECOND),
      dateStart: {
        date: format(vst, YEAR_MONTH_DAY),
      },
      dateEnd: {
        date: format(vet, YEAR_MONTH_DAY),
      },
    };
  }

  return {
    timeOfDayStart: format(new TZDate(vst, "UTC"), HOUR_MINUTE_SECOND),
    dateStart: {
      date: format(vst, YEAR_MONTH_DAY),
    },
  };
}

function createFixedDateRangeForFault(fault: DbFault): S124FixedDateRange {
  if (fault.fixed_timestamp) {
    return {
      dateStart: {
        date: format(new Date(fault.entry_timestamp), YEAR_MONTH_DAY),
      },
      dateEnd: {
        date: format(new Date(fault.fixed_timestamp), YEAR_MONTH_DAY),
      },
    };
  }

  return {
    timeOfDayStart: format(
      new TZDate(fault.entry_timestamp, "UTC"),
      HOUR_MINUTE_SECOND,
    ),
    dateStart: {
      date: format(new Date(fault.entry_timestamp), YEAR_MONTH_DAY),
    },
  };
}

function createGeometryForWarning(
  geometry: Geometry,
  id: string,
): S100PointProperty | unknown {
  if (geometry.type === "Point") {
    const [x, y] = geometry.coordinates as [number, number];
    return createPointProperty(`${x} ${y}`, id);
  }

  logger.info({
    method: "S124Converter.createGeometryForWarning",
    message: "not supported geometry type " + geometry.type,
  });
  return {};
}

function createPointProperty(geometry: string, id: string): S100PointProperty {
  return {
    "S100:pointProperty": {
      "S100:Point": {
        $: {
          "gml:id": `P.${id}.1`,
        },
        "gml:pos": geometry,
      },
    },
  };
}

function createCoordinatePair(geometry: string): string {
  const g = wkx.Geometry.parse(Buffer.from(geometry, "hex")).toGeoJSON() as {
    coordinates: string[];
  };

  const [x, y] = g.coordinates as [string, string];

  return `${x} ${y}`;
}

function createMessageSeriesIdentifier(
  NameOfSeries: string,
  warningNumber: number,
  year: number,
): S124MessageSeriesIdentifier {
  return {
    NameOfSeries,
    typeOfWarning: "local",
    warningNumber,
    year,
    productionAgency: PRODUCTION_AGENCY,
    country: "FI",
  };
}
