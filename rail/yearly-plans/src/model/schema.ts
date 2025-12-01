export const schema = {
  openapi: "3.0.1",
  components: {
    schemas: {
      DataModelVersionDto: {
        type: "object",
        properties: {
          major: {
            type: "integer",
            format: "int32",
          },
          minor: {
            type: "integer",
            format: "int32",
          },
        },
        required: ["major", "minor"],
      },
      InfraInfoDto: {
        type: "object",
        properties: {
          infraRevision: {
            type: "integer",
            format: "int64",
          },
          infraTargetTime: {
            type: "string",
            format: "date-time",
          },
          infraChangeTime: {
            type: "string",
            format: "date-time",
          },
        },
        required: ["infraChangeTime", "infraRevision", "infraTargetTime"],
      },
      KmLocationDto: {
        type: "object",
        properties: {
          kilometers: {
            type: "integer",
            format: "int32",
          },
          meters: {
            type: "integer",
            format: "int32",
          },
        },
        required: ["kilometers", "meters"],
      },
      LimitedTrackDto: {
        type: "object",
        properties: {
          trackOid: {
            type: "string",
          },
          railway: {
            type: ["string", "null"],
          },
          startLimit: {
            anyOf: [
              { $ref: "#/components/schemas/TrackLimitDto" },
              { type: "null" },
            ],
          },
          endLimit: {
            anyOf: [
              { $ref: "#/components/schemas/TrackLimitDto" },
              { type: "null" },
            ],
          },
          oid: {},
        },
        required: ["trackOid"],
      },
      LocationDto: {
        type: "object",
        properties: {
          infraInfo: {
            $ref: "#/components/schemas/InfraInfoDto",
          },
          stationOids: {
            type: "array",
            items: {
              type: "string",
            },
            uniqueItems: true,
          },
          stationIntervalOids: {
            type: "array",
            items: {
              type: "string",
            },
            uniqueItems: true,
          },
          trafficPlanningAreaOids: {
            type: "array",
            items: {
              type: "string",
            },
            uniqueItems: true,
          },
          accountingRailwaySectionOids: {
            type: "array",
            items: {
              type: "string",
            },
            uniqueItems: true,
          },
          switchOids: {
            type: "array",
            items: {
              type: "string",
            },
            uniqueItems: true,
          },
          signalOids: {
            type: "array",
            items: {
              type: "string",
            },
            uniqueItems: true,
          },
          limitedTracks: {
            type: "array",
            items: {
              $ref: "#/components/schemas/LimitedTrackDto",
            },
            uniqueItems: true,
          },
        },
        required: [
          "accountingRailwaySectionOids",
          "infraInfo",
          "limitedTracks",
          "signalOids",
          "stationIntervalOids",
          "stationOids",
          "switchOids",
          "trafficPlanningAreaOids",
        ],
      },
      RailwayKmIntervalDto: {
        type: "object",
        properties: {
          railway: {
            type: "string",
          },
          start: {
            $ref: "#/components/schemas/KmLocationDto",
          },
          end: {
            $ref: "#/components/schemas/KmLocationDto",
          },
        },
        required: ["end", "railway", "start"],
      },
      TrackLimitDto: {
        type: "object",
        properties: {
          infraElementOid: {
            type: ["string", "null"],
          },
          kmLocation: {
            anyOf: [
              { $ref: "#/components/schemas/KmLocationDto" },
              { type: "null" },
            ],
          },
          oid: {},
        },
      },
      YearlyPlanComputedDataDto: {
        type: "object",
        properties: {
          trackOids: {
            type: "array",
            items: {
              type: "string",
            },
            uniqueItems: true,
          },
          trafficManagementTrackOids: {
            type: "array",
            items: {
              type: "string",
            },
            uniqueItems: true,
          },
          stationOids: {
            type: "array",
            items: {
              type: "string",
            },
            uniqueItems: true,
          },
          stationIntervalOids: {
            type: "array",
            items: {
              type: "string",
            },
            uniqueItems: true,
          },
          trafficControlSectorOids: {
            type: "array",
            items: {
              type: "string",
            },
            uniqueItems: true,
          },
          trafficPlanningAreaOids: {
            type: "array",
            items: {
              type: "string",
            },
            uniqueItems: true,
          },
          accountingRailwaySectionOids: {
            type: "array",
            items: {
              type: "string",
            },
            uniqueItems: true,
          },
          railwayKmIntervals: {
            type: "array",
            items: {
              $ref: "#/components/schemas/RailwayKmIntervalDto",
            },
          },
          mapGeometry: {
            type: ["string", "null"],
          },
          diagramGeometry: {
            type: ["string", "null"],
          },
        },
        required: [
          "accountingRailwaySectionOids",
          "railwayKmIntervals",
          "stationIntervalOids",
          "stationOids",
          "trackOids",
          "trafficControlSectorOids",
          "trafficManagementTrackOids",
          "trafficPlanningAreaOids",
        ],
      },
      YearlyPlanListItemDataRedactedDto: {
        type: "object",
        properties: {
          oid: {
            type: "string",
          },
          versionNumber: {
            type: "integer",
            format: "int64",
          },
          versionCreateTime: {
            type: "string",
            format: "date-time",
          },
          infraTargetTime: {
            type: ["string", "null"],
            format: "date-time",
          },
          name: {
            type: "string",
          },
          projectPlanOid: {
            type: ["string", "null"],
          },
          startDate: {
            type: ["string", "null"],
            format: "date",
          },
          endDate: {
            type: ["string", "null"],
            format: "date",
          },
          dateTz: {
            type: ["string", "null"],
          },
          timeslots: {
            type: "array",
            items: {
              $ref: "#/components/schemas/YearlyPlanTimeslotRevisedDto",
            },
          },
          trafficDisruption: {
            type: ["string", "null"],
          },
          location: {
            anyOf: [
              { $ref: "#/components/schemas/LocationDto" },
              { type: "null" },
            ],
          },
          computedData: {
            anyOf: [
              { $ref: "#/components/schemas/YearlyPlanComputedDataDto" },
              { type: "null" },
            ],
          },
        },
        required: [
          "name",
          "oid",
          "timeslots",
          "trafficDisruption",
          "versionCreateTime",
          "versionNumber",
        ],
      },
      YearlyPlanListItemRedactedDto: {
        type: "object",
        properties: {
          dataModelVersion: {
            $ref: "#/components/schemas/DataModelVersionDto",
          },
          data: {
            $ref: "#/components/schemas/YearlyPlanListItemDataRedactedDto",
          },
        },
        required: ["data", "dataModelVersion"],
      },
      YearlyPlanListRedactedDto: {
        type: "object",
        properties: {
          items: {
            type: "array",
            items: {
              $ref: "#/components/schemas/YearlyPlanListItemRedactedDto",
            },
          },
          totalItems: {
            type: "integer",
            format: "int32",
          },
        },
        required: ["items", "totalItems"],
      },
      YearlyPlanRepeatingTimeslotDto: {
        type: "object",
        properties: {
          firstOccurrenceDate: {
            type: "string",
            format: "date",
          },
          lastOccurrenceDate: {
            type: "string",
            format: "date",
          },
          startTime: {
            type: "string",
            format: "partial-time",
          },
          tzName: {
            type: ["string", "null"],
          },
          duration: {
            type: "string",
          },
          weekdays: {
            type: "array",
            items: {
              type: "string",
              enum: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"],
            },
            uniqueItems: true,
          },
          repetition: {
            type: ["string", "null"],
            enum: ["EVERY_WEEK", "EVERY_OTHER_WEEK", "EVERY_FOURTH_WEEK"],
          },
        },
        required: [
          "duration",
          "firstOccurrenceDate",
          "lastOccurrenceDate",
          "startTime",
          "weekdays",
        ],
      },
      YearlyPlanSingleTimeslotDto: {
        type: "object",
        properties: {
          start: {
            type: "string",
            format: "date-time",
          },
          end: {
            type: ["string", "null"],
            format: "date-time",
          },
        },
        required: ["start"],
      },
      YearlyPlanTimeslotRevisedDto: {
        type: "object",
        properties: {
          single: {
            anyOf: [
              { $ref: "#/components/schemas/YearlyPlanSingleTimeslotDto" },
              { type: "null" },
            ],
          },
          repeating: {
            anyOf: [
              { $ref: "#/components/schemas/YearlyPlanRepeatingTimeslotDto" },
              { type: "null" },
            ],
          },
        },
      },
      LinkedAnnouncementOrPlanDto: {
        type: "object",
        properties: {
          linkedAnnouncementWithPlans: {
            anyOf: [
              { $ref: "#/components/schemas/LinkedAnnouncementWithPlansDto" },
              { type: "null" },
            ],
          },
          linkedPreliminaryPlanOid: {
            type: ["string", "null"],
          },
        },
      },
      LinkedAnnouncementWithPlansDto: {
        type: "object",
        properties: {
          preliminaryAnnouncementOid: {
            type: "string",
          },
          preliminaryPlanOids: {
            type: "array",
            items: {
              type: "string",
            },
          },
        },
        required: ["preliminaryAnnouncementOid", "preliminaryPlanOids"],
      },
      SpeedLimitLocationDto: {
        type: "object",
        properties: {
          infraInfo: {
            $ref: "#/components/schemas/InfraInfoDto",
          },
          limitedTracks: {
            type: "array",
            items: {
              $ref: "#/components/schemas/LimitedTrackDto",
            },
            uniqueItems: true,
          },
        },
        required: ["infraInfo", "limitedTracks"],
      },
      YearlyPlanRedactedDto: {
        type: "object",
        properties: {
          oid: {
            type: "string",
          },
          latestVersion: {
            type: "integer",
            format: "int64",
          },
          createTime: {
            type: "string",
            format: "date-time",
          },
        },
        required: ["createTime", "latestVersion", "oid"],
      },
      YearlyPlanSpeedLimitRedactedDto: {
        type: "object",
        properties: {
          startTime: {
            type: ["string", "null"],
            format: "date-time",
          },
          endTime: {
            type: ["string", "null"],
            format: "date-time",
          },
          direction: {
            type: ["string", "null"],
            enum: ["UP", "DOWN", "BOTH"],
          },
          speedLimit: {
            type: "integer",
            format: "int32",
          },
          description: {
            type: ["string", "null"],
            maxLength: 2000,
            minLength: 0,
          },
          location: {
            anyOf: [
              { $ref: "#/components/schemas/SpeedLimitLocationDto" },
              { type: "null" },
            ],
          },
        },
        required: ["speedLimit"],
      },
      YearlyPlanVersionContentRedactedDto: {
        type: "object",
        properties: {
          description: {
            type: ["string", "null"],
          },
          name: {
            type: "string",
          },
          timeslots: {
            type: "array",
            items: {
              $ref: "#/components/schemas/YearlyPlanTimeslotRevisedDto",
            },
          },
          startDate: {
            type: ["string", "null"],
            format: "date",
          },
          endDate: {
            type: ["string", "null"],
            format: "date",
          },
          dateTz: {
            type: ["string", "null"],
          },
          requiredRailwayCapacity: {
            type: ["string", "null"],
          },
          railwayCapacityTiming: {
            type: ["string", "null"],
          },
          trafficRestrictions: {
            type: "array",
            items: {
              type: "string",
            },
          },
          railwayInfraChanges: {
            type: "array",
            items: {
              type: "string",
            },
          },
          trafficDisruption: {
            type: ["string", "null"],
          },
          speedLimits: {
            type: "array",
            items: {
              $ref: "#/components/schemas/YearlyPlanSpeedLimitRedactedDto",
            },
          },
          trafficRestrictionDescription: {
            type: ["string", "null"],
          },
          projectPlanOid: {
            type: ["string", "null"],
          },
          linkedAnnouncementsAndPlans: {
            type: "array",
            items: {
              $ref: "#/components/schemas/LinkedAnnouncementOrPlanDto",
            },
          },
          location: {
            anyOf: [
              { $ref: "#/components/schemas/LocationDto" },
              { type: "null" },
            ],
          },
          computedData: {
            anyOf: [
              { $ref: "#/components/schemas/YearlyPlanComputedDataDto" },
              { type: "null" },
            ],
          },
        },
        required: [
          "description",
          "linkedAnnouncementsAndPlans",
          "name",
          "railwayInfraChanges",
          "speedLimits",
          "timeslots",
          "trafficDisruption",
          "trafficRestrictions",
        ],
      },
      YearlyPlanVersionDataRedactedDto: {
        type: "object",
        properties: {
          yearlyPlan: {
            $ref: "#/components/schemas/YearlyPlanRedactedDto",
          },
          version: {
            type: "integer",
            format: "int64",
          },
          createTime: {
            type: "string",
            format: "date-time",
          },
          content: {
            $ref: "#/components/schemas/YearlyPlanVersionContentRedactedDto",
          },
        },
        required: ["content", "createTime", "version", "yearlyPlan"],
      },
      YearlyPlanVersionRedactedDto: {
        type: "object",
        properties: {
          dataModelVersion: {
            $ref: "#/components/schemas/DataModelVersionDto",
          },
          data: {
            $ref: "#/components/schemas/YearlyPlanVersionDataRedactedDto",
          },
        },
        required: ["data", "dataModelVersion"],
      },
      ProjectPlanListItemDataRedactedDto: {
        type: "object",
        properties: {
          oid: {
            type: "string",
          },
          versionNumber: {
            type: "integer",
            format: "int64",
          },
          versionCreateTime: {
            type: "string",
            format: "date-time",
          },
          startDate: {
            type: ["string", "null"],
            format: "date",
          },
          endDate: {
            type: ["string", "null"],
            format: "date",
          },
          dateTz: {
            type: ["string", "null"],
          },
          name: {
            type: "string",
          },
        },
        required: ["name", "oid", "versionCreateTime", "versionNumber"],
      },
      ProjectPlanListItemRedactedDto: {
        type: "object",
        properties: {
          dataModelVersion: {
            $ref: "#/components/schemas/DataModelVersionDto",
          },
          data: {
            $ref: "#/components/schemas/ProjectPlanListItemDataRedactedDto",
          },
        },
        required: ["data", "dataModelVersion"],
      },
      ProjectPlanListRedactedDto: {
        type: "object",
        properties: {
          items: {
            type: "array",
            items: {
              $ref: "#/components/schemas/ProjectPlanListItemRedactedDto",
            },
          },
          totalItems: {
            type: "integer",
            format: "int32",
          },
        },
        required: ["items", "totalItems"],
      },
      ProjectPlanRedactedDto: {
        type: "object",
        properties: {
          oid: {
            type: "string",
          },
          latestVersion: {
            type: "integer",
            format: "int64",
          },
          createTime: {
            type: "string",
            format: "date-time",
          },
        },
        required: ["createTime", "latestVersion", "oid"],
      },
      ProjectPlanVersionContentRedactedDto: {
        type: "object",
        properties: {
          name: {
            type: "string",
            maxLength: 200,
            minLength: 0,
          },
          description: {
            type: "string",
            maxLength: 2000,
            minLength: 0,
          },
          startDate: {
            type: ["string", "null"],
            format: "date",
          },
          endDate: {
            type: ["string", "null"],
            format: "date",
          },
          dateTz: {
            type: ["string", "null"],
            maxLength: 200,
            minLength: 0,
          },
          yearlyPlanOids: {
            type: "array",
            items: {
              type: "string",
            },
            uniqueItems: true,
          },
        },
        required: ["description", "name", "yearlyPlanOids"],
      },
      ProjectPlanVersionDataRedactedDto: {
        type: "object",
        properties: {
          projectPlan: {
            $ref: "#/components/schemas/ProjectPlanRedactedDto",
          },
          version: {
            type: "integer",
            format: "int64",
          },
          createTime: {
            type: "string",
            format: "date-time",
          },
          content: {
            $ref: "#/components/schemas/ProjectPlanVersionContentRedactedDto",
          },
        },
        required: ["content", "createTime", "projectPlan", "version"],
      },
      ProjectPlanVersionRedactedDto: {
        type: "object",
        properties: {
          dataModelVersion: {
            $ref: "#/components/schemas/DataModelVersionDto",
          },
          data: {
            $ref: "#/components/schemas/ProjectPlanVersionDataRedactedDto",
          },
        },
        required: ["data", "dataModelVersion"],
      },
    },
  },
};
