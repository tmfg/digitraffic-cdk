export const schema = {
  definitions: {
    DataModelVersionDto: {
      description:
        'All data objects (e.g. yearly plans, project plans) managed and stored in the SUPA service have a \ndata model (schema) that the content of these objects adheres to. The data models themselves are \nversioned with semantic versioning (major and minor version numbers in SUPA case). Data model major\nversion is increased when the model changes in a backwards incompatible way. Data model minor version\nis increased when the model changes in a backwards compatible way.\n\n"backwards incompatible" - new data objects (with content adhering to new data model model version) \ncould break existing clients\n\n"backwards compatible" - new data objects should not break existing clients\n',
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
      description:
        "Information about the infra data (Trakedia data) that the location information in the yearly plan\nversion adheres to\n",
      type: "object",
      properties: {
        infraRevision: {
          description:
            "Infra data revision of the infra data that was used to specify the location information in the\nyearly plan version\n",
          type: "integer",
          format: "int64",
        },
        infraTargetTime: {
          description:
            "The yearly plan time (derived from yearly plan time related content) that was used to load the infra\ndata that was used to specify the location information in the yearly plan version\n",
          type: "string",
          format: "date-time",
        },
        infraChangeTime: {
          description:
            "The infra data change time that corresponded (at the time of the location information entry) to the\ninfra target time that was used to load the infra data that was used to specify the location \ninformation in the yearly plan version\n",
          type: "string",
          format: "date-time",
        },
      },
      required: ["infraChangeTime", "infraRevision", "infraTargetTime"],
    },
    KmLocationDto: {
      description:
        "Railway kilometer location on some railway (railway name/identifier defined outside this object)\n",
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
      description:
        "A track and possible optional limit information. A track has a certain railway kilometer interval on \none or more railways. This range can be limited from both directions (start - the lower end of the track's \nrailway kilometer interval, or end - the higher end of the track's railway kilometer interval). Each \nlimit can be either a railway kilometer definition or a reference to an infra data object on the track.\n",
      type: "object",
      properties: {
        trackOid: {
          type: "string",
        },
        railway: {
          description:
            "If the track kilometer interval has been limited, the name/identifier of the railway to which the \nlimitation applies. The track must have a railway kilometer interval on the railway. Specifies the \nrailway that possible railway kilometer locations given as limit values concern, or the railway \nbased on which a kilometer location is selected from the railway intervals of possible elements used\nas limits. If railway information has not been defined, the track is a part of the yearly plan \nlocation in its entirety.\n",
          type: ["string", "null"],
        },
        startLimit: {
          anyOf: [
            {
              $ref: "#/definitions/TrackLimitDto",
            },
            {
              type: "null",
            },
          ],
        },
        endLimit: {
          anyOf: [
            {
              $ref: "#/definitions/TrackLimitDto",
            },
            {
              type: "null",
            },
          ],
        },
        oid: {
          description: "The OID of the track",
        },
      },
      required: ["trackOid"],
    },
    LocationDto: {
      description:
        "The location information of the yearly plan version specified by the user. The location selections made\nby the user are stored in SUPA as references (OID values) to the corresponding infra data (Trakedia) \nobjects and, in the case of limited tracks, additional track limit information.\n",
      type: "object",
      properties: {
        infraInfo: {
          $ref: "#/definitions/InfraInfoDto",
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
            $ref: "#/definitions/LimitedTrackDto",
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
          $ref: "#/definitions/KmLocationDto",
        },
        end: {
          $ref: "#/definitions/KmLocationDto",
        },
      },
      required: ["end", "railway", "start"],
    },
    TrackLimitDto: {
      description:
        "A limit that limits track railway kilometer interval. The limit can be either a railway kilometer\nlocation or a reference to an infra data object (element) on the track. Requires that the railway \ninformation has been specified as well.\n",
      type: "object",
      properties: {
        infraElementOid: {
          type: ["string", "null"],
        },
        kmLocation: {
          anyOf: [
            {
              $ref: "#/definitions/KmLocationDto",
            },
            {
              type: "null",
            },
          ],
        },
        oid: {
          description: "The OID of the limiting infra data object on the track",
        },
      },
    },
    YearlyPlanComputedDataDto: {
      description:
        'A collection of computed data related to the yearly plan version. This data is computed by the SUPA\nservice based on the content of the yearly plan version and Infra API (Trakedia) data.\n\nBased on the location information specified by the user for the yearly plan version, the SUPA service \ngenerates additional "computed" location information. Computed location information means in practice:\n\n* Various areas / infra objects that the user-specified precise location information for the yearly plan overlaps\n* Combined geometry (map/diagram) of the user-specified precise location information for the yearly plan\n* Railway kilometer interval set covered by the user-specified precise location information for the yearly plan\n',
      type: "object",
      properties: {
        trackOids: {
          description:
            "The computed tracks (their Infra API OIDs) for the specified yearly plan version (the tracks \nthat the user-specified location information for the yearly plan version fully or partially overlaps)\n",
          type: "array",
          items: {
            type: "string",
          },
          uniqueItems: true,
        },
        trafficManagementTrackOids: {
          description:
            "The computed traffic management tracks (their Infra API OIDs) for the specified yearly plan version\n(the traffic management tracks that the user-specified location information for the yearly plan \nversion fully or partially overlaps)\n",
          type: "array",
          items: {
            type: "string",
          },
          uniqueItems: true,
        },
        stationOids: {
          description:
            "The computed stations (their Infra API OIDs) for the specified yearly plan version (the stations \nthat the user-specified location information for the yearly plan version fully or partially overlaps)\n",
          type: "array",
          items: {
            type: "string",
          },
          uniqueItems: true,
        },
        stationIntervalOids: {
          description:
            "The computed station intervals (their Infra API OIDs) for the specified yearly plan version (the \nstations that the user-specified location information for the yearly plan version fully or partially\noverlaps)\n",
          type: "array",
          items: {
            type: "string",
          },
          uniqueItems: true,
        },
        trafficControlSectorOids: {
          description:
            "The computed traffic planning control areas (their Infra API OIDs) for the specified yearly plan \nversion (the traffic planning control areas that the user-specified location information for the\nyearly plan version fully or partially overlaps)\n",
          type: "array",
          items: {
            type: "string",
          },
          uniqueItems: true,
        },
        trafficPlanningAreaOids: {
          description:
            "The computed traffic planning areas (their Infra API OIDs) for the specified yearly plan version \n(the traffic planning areas that the user-specified location information for the yearly plan version\nfully or partially overlaps)\n",
          type: "array",
          items: {
            type: "string",
          },
          uniqueItems: true,
        },
        accountingRailwaySectionOids: {
          description:
            "The computed accounting railway sections (their Infra API OIDs) for the specified yearly plan \nversion (the accounting railway sections that the user-specified location information for the yearly\nplan version fully or partially overlaps)\n",
          type: "array",
          items: {
            type: "string",
          },
          uniqueItems: true,
        },
        railwayKmIntervals: {
          description:
            "The computed railway kilometer intervals for the specified yearly plan version (the railway\nkilometer intervals that the user-specified location information for the yearly plan version covers).\nNOTE. Computed railway kilometer intervals for traffic planning areas are approximated on the basis \nof element (balise) locations inside the areas.\n",
          type: "array",
          items: {
            $ref: "#/definitions/RailwayKmIntervalDto",
          },
        },
        mapGeometry: {
          description:
            "The computed map geometry for the specified yearly plan version (the combined map geometry of \nthe user-specified location information for the yearly plan version). Returned in Well-known text \n(WKT) format using the requested coordinate system (default: EPSG:3067).\n",
          type: ["string", "null"],
        },
        diagramGeometry: {
          description:
            "The computed diagram geometry for the specified yearly plan version (the combined diagram geometry of \nthe user-specified location information for the yearly plan version). Returned in Well-known text \n(WKT) format using the requested coordinate system (default: EPSG:3067).\n",
          type: ["string", "null"],
        },
        mapGeometryCentroid: {
          description:
            "The computed map geometry centroid for the specified yearly plan version (the centroid of the \ncombined map geometry of the user-specified location information for the yearly plan version). \nReturned in Well-known text (WKT) format using the requested coordinate system (default: EPSG:3067).\n",
          type: ["string", "null"],
        },
        diagramGeometryCentroid: {
          description:
            "The computed diagram geometry centroid for the specified yearly plan version (the centroid of the \ncombined diagram geometry of the user-specified location information for the yearly plan version). \nReturned in Well-known text (WKT) format using the requested coordinate system (default: EPSG:3067).\n",
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
        displayId: {
          type: "integer",
          format: "int64",
        },
        versionNumber: {
          type: "integer",
          format: "int64",
        },
        versionCreateTime: {
          description:
            "Creation time as an ISO instant string. Example value: 2024-12-03T10:15:30Z\n",
          type: "string",
          format: "date-time",
        },
        name: {
          type: "string",
        },
        projectPlanOid: {
          type: ["string", "null"],
        },
        startDate: {
          description:
            'See the corresponding field description for class  \n<a href="#model-YearlyPlanVersionContentRedactedDto">YearlyPlanVersionContentRedactedDto</a>\n',
          type: ["string", "null"],
          format: "date",
        },
        endDate: {
          description:
            'See the corresponding field description for class  \n<a href="#model-YearlyPlanVersionContentRedactedDto">YearlyPlanVersionContentRedactedDto</a>\n',
          type: ["string", "null"],
          format: "date",
        },
        dateTz: {
          description:
            'See the corresponding field description for class  \n<a href="#model-YearlyPlanVersionContentRedactedDto">YearlyPlanVersionContentRedactedDto</a>\n',
          type: ["string", "null"],
        },
        timeslots: {
          description:
            'See the corresponding field description for class  \n<a href="#model-YearlyPlanVersionContentRedactedDto">YearlyPlanVersionContentRedactedDto</a>\n',
          type: "array",
          items: {
            $ref: "#/definitions/YearlyPlanTimeslotRevisedDto",
          },
        },
        trafficDisruption: {
          description:
            'The traffic disruption level of the yearly plan. Possible values are listed by the metadata endpoint\n<a href="#operation/trafficDisruptions">/b/1/yearly-plan/meta/trafficDisruptions</a>\n',
          type: "string",
        },
        location: {
          anyOf: [
            {
              $ref: "#/definitions/LocationDto",
            },
            {
              type: "null",
            },
          ],
        },
        computedData: {
          anyOf: [
            {
              $ref: "#/definitions/YearlyPlanComputedDataDto",
            },
            {
              type: "null",
            },
          ],
        },
      },
      required: [
        "displayId",
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
          $ref: "#/definitions/DataModelVersionDto",
        },
        data: {
          $ref: "#/definitions/YearlyPlanListItemDataRedactedDto",
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
            $ref: "#/definitions/YearlyPlanListItemRedactedDto",
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
      description: "Repeating timeslot definition",
      type: "object",
      properties: {
        firstOccurrenceDate: {
          description:
            "The start date of the first occurrence of the timeslot. E.g. 2024-12-03.",
          type: "string",
          format: "date",
        },
        lastOccurrenceDate: {
          description:
            "The start date of the last occurrence of the timeslot. E.g. 2024-12-06.",
          type: "string",
          format: "date",
        },
        startTime: {
          description:
            "The start time of the timeslot on each occurrence start date. E.g. 10:20.",
          type: "string",
          format: "partial-time",
        },
        tzName: {
          description:
            "The IANA timezone name of the timezone of the date and time fields. E.g. Europe/Helsinki.\n",
          type: ["string", "null"],
        },
        duration: {
          description:
            "The duration of the timeslot expressed as an ISO duration string. E.g. PT10H20M.",
          type: "string",
        },
        weekdays: {
          description:
            "Defines a set of weekdays on which the timeslot reoccurs on each repetition week\n",
          type: "array",
          items: {
            type: "string",
            enum: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"],
          },
          uniqueItems: true,
        },
        repetition: {
          description:
            "Defines the week-level repetition pattern of the timeslot. Week calculation starts from the week\nof the date defined by the 'firstOccurrenceDate' field.\n",
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
      description: "Single timeslot definition",
      type: "object",
      properties: {
        start: {
          description:
            "The start instant (date and time) of the timeslot. Specified as an ISO instant string. \nExample value: 2024-12-03T10:15:30Z\n",
          type: "string",
          format: "date-time",
        },
        end: {
          description:
            "The end instant (date and time) of the timeslot. Specified as an ISO instant string. Example value:\n2024-12-03T10:15:30Z. If left out, the timeslot extends to \"eternity\" starting from the 'start' \ninstant.\n",
          type: ["string", "null"],
          format: "date-time",
        },
      },
      required: ["start"],
    },
    YearlyPlanTimeslotRevisedDto: {
      description:
        "A timeslot definition. Can represent either a single timeslot or a repeating timeslot.\n",
      type: "object",
      properties: {
        single: {
          anyOf: [
            {
              $ref: "#/definitions/YearlyPlanSingleTimeslotDto",
            },
            {
              type: "null",
            },
          ],
        },
        repeating: {
          anyOf: [
            {
              $ref: "#/definitions/YearlyPlanRepeatingTimeslotDto",
            },
            {
              type: "null",
            },
          ],
        },
      },
    },
    LinkedAnnouncementOrPlanDto: {
      description:
        "Linkage of a yearly plan either to a preliminary announcement or a preliminary plan\n",
      type: "object",
      properties: {
        linkedAnnouncementWithPlans: {
          anyOf: [
            {
              $ref: "#/definitions/LinkedAnnouncementWithPlansDto",
            },
            {
              type: "null",
            },
          ],
        },
        linkedPreliminaryPlanOid: {
          description:
            "Linkage of a yearly plan directly to a preliminary plan",
          type: ["string", "null"],
        },
      },
    },
    LinkedAnnouncementWithPlansDto: {
      description:
        "Linkage of a yearly plan to a preliminary announcement. The announcement itself may then be linked\nto one or more preliminary plans.\n",
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
      description:
        "The location information of the yearly plan version specified by the user. The location selections made\nby the user are stored in SUPA as references (OID values) to the corresponding infra data (Trakedia) \nobjects and, in the case of limited tracks, additional track limit information.\n",
      type: "object",
      properties: {
        infraInfo: {
          $ref: "#/definitions/InfraInfoDto",
        },
        limitedTracks: {
          type: "array",
          items: {
            $ref: "#/definitions/LimitedTrackDto",
          },
          uniqueItems: true,
        },
      },
      required: ["infraInfo", "limitedTracks"],
    },
    YearlyPlanRedactedDto: {
      description:
        'Core information about a yearly plan stored in the SUPA service. This information is common to all \nversions of the yearly plan. Each yearly plan version is stored in the service as a separate "record"\nand all these versions share (refer to) the same single yearly plan record.\n',
      type: "object",
      properties: {
        oid: {
          type: "string",
        },
        displayId: {
          type: "integer",
          format: "int64",
        },
        latestVersion: {
          type: "integer",
          format: "int64",
        },
        createTime: {
          description:
            "Creation time as an ISO instant string. Example value: 2024-12-03T10:15:30Z\n",
          type: "string",
          format: "date-time",
        },
      },
      required: ["createTime", "displayId", "latestVersion", "oid"],
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
            {
              $ref: "#/definitions/SpeedLimitLocationDto",
            },
            {
              type: "null",
            },
          ],
        },
      },
      required: ["speedLimit"],
    },
    YearlyPlanVersionContentRedactedDto: {
      description: "The actual content of a yearly plan version",
      type: "object",
      properties: {
        name: {
          type: "string",
        },
        description: {
          type: "string",
        },
        timeslots: {
          description: "More detailed time information for the yearly plan",
          type: "array",
          items: {
            $ref: "#/definitions/YearlyPlanTimeslotRevisedDto",
          },
        },
        startDate: {
          description:
            "High-level (preliminary) start date for the yearly plan. A local date in ISO format, \nexample value: 2024-03-26.\n",
          type: ["string", "null"],
          format: "date",
        },
        endDate: {
          description:
            "High-level (preliminary) end date for the yearly plan. A local date in ISO format, example value:\n2024-03-26. If left out, and 'startDate' is given, the high-level timespan of the yearly plan \nextends to \"eternity\" starting from 'startDate'. If defined, also 'startDate' must be defined.\n",
          type: ["string", "null"],
          format: "date",
        },
        dateTz: {
          description:
            'The IANA timezone name of start and end dates to allow the comparison of the yearly plan high-level\ntimespan to intervals/instants. If left undefined and start date is defined, defaults to \n"Europe/Helsinki".\n',
          type: ["string", "null"],
        },
        requiredRailwayCapacity: {
          description:
            "Preliminary railway capacity needs of the yearly plan (area and timeslots, free-formatted textual\ndescription)\n",
          type: ["string", "null"],
        },
        railwayCapacityTiming: {
          description:
            "Preliminary timing of the yearly plan's capacity needs (free-formatted textual description)\n",
          type: ["string", "null"],
        },
        trafficRestrictions: {
          description:
            'The traffic restrictions of the yearly plan. Possible values are listed by the metadata endpoint\n<a href="#operation/trafficRestrictions">/b/1/yearly-plan/meta/trafficRestrictions</a>\n',
          type: "array",
          items: {
            type: "string",
          },
        },
        railwayInfraChanges: {
          description:
            'The railway infrastructure changes of the yearly plan. Possible values are listed by the metadata \nendpoint <a href="#operation/railwayInfraChanges">/b/1/yearly-plan/meta/railwayInfraChanges</a>\n',
          type: "array",
          items: {
            type: "string",
          },
        },
        trafficDisruption: {
          description:
            'The traffic disruption level of the yearly plan. Possible values are listed by the metadata endpoint\n<a href="#operation/trafficDisruptions">/b/1/yearly-plan/meta/trafficDisruptions</a>\n',
          type: "string",
        },
        speedLimits: {
          type: "array",
          items: {
            $ref: "#/definitions/YearlyPlanSpeedLimitRedactedDto",
          },
        },
        trafficRestrictionDescription: {
          description:
            "Free formatted description of the traffic restrictions caused",
          type: ["string", "null"],
        },
        projectPlanOid: {
          description:
            'If the yearly plan "belongs" to a project plan, the OID of that project plan. A yearly plan can \nbelong to at most one project plan at a time.\n',
          type: ["string", "null"],
        },
        linkedAnnouncementsAndPlans: {
          type: "array",
          items: {
            $ref: "#/definitions/LinkedAnnouncementOrPlanDto",
          },
        },
        location: {
          anyOf: [
            {
              $ref: "#/definitions/LocationDto",
            },
            {
              type: "null",
            },
          ],
        },
        computedData: {
          anyOf: [
            {
              $ref: "#/definitions/YearlyPlanComputedDataDto",
            },
            {
              type: "null",
            },
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
      description:
        "A yearly plan version stored in the SUPA service. The actual content of the version is wrapped inside\na separate DTO ('YearlyPlanVersionContentRedactedDto'). Likewise, information shared by all versions of\nthe same yearly plan is also wrapped inside a separate DTO ('YearlyPlanRedactedDto').\n",
      type: "object",
      properties: {
        yearlyPlan: {
          $ref: "#/definitions/YearlyPlanRedactedDto",
        },
        version: {
          type: "integer",
          format: "int64",
        },
        createTime: {
          description:
            "Creation time as an ISO instant string. Example value: 2024-12-03T10:15:30Z\n",
          type: "string",
          format: "date-time",
        },
        content: {
          $ref: "#/definitions/YearlyPlanVersionContentRedactedDto",
        },
      },
      required: ["content", "createTime", "version", "yearlyPlan"],
    },
    YearlyPlanVersionRedactedDto: {
      type: "object",
      properties: {
        dataModelVersion: {
          $ref: "#/definitions/DataModelVersionDto",
        },
        data: {
          $ref: "#/definitions/YearlyPlanVersionDataRedactedDto",
        },
      },
      required: ["data", "dataModelVersion"],
    },
    MetaDataItem: {
      type: "object",
      properties: {
        value: {
          type: "string",
        },
        displayNameEn: {
          type: "string",
        },
        displayNameFi: {
          type: "string",
        },
      },
      required: ["displayNameEn", "displayNameFi", "value"],
    },
    ProjectPlanListItemDataRedactedDto: {
      type: "object",
      properties: {
        oid: {
          type: "string",
        },
        displayId: {
          type: "integer",
          format: "int64",
        },
        versionNumber: {
          type: "integer",
          format: "int64",
        },
        versionCreateTime: {
          description:
            "Creation time as an ISO instant string. Example value: 2024-12-03T10:15:30Z\n",
          type: "string",
          format: "date-time",
        },
        startDate: {
          description:
            'See the corresponding field description for class  \n<a href="#model-ProjectPlanVersionContentRedactedDto">ProjectPlanVersionContentRedactedDto</a>\n',
          type: ["string", "null"],
          format: "date",
        },
        endDate: {
          description:
            'See the corresponding field description for class  \n<a href="#model-ProjectPlanVersionContentRedactedDto">ProjectPlanVersionContentRedactedDto</a>\n',
          type: ["string", "null"],
          format: "date",
        },
        dateTz: {
          description:
            'See the corresponding field description for class  \n<a href="#model-ProjectPlanVersionContentRedactedDto">ProjectPlanVersionContentRedactedDto</a>\n',
          type: ["string", "null"],
        },
        name: {
          type: "string",
        },
      },
      required: [
        "displayId",
        "name",
        "oid",
        "versionCreateTime",
        "versionNumber",
      ],
    },
    ProjectPlanListItemRedactedDto: {
      type: "object",
      properties: {
        dataModelVersion: {
          $ref: "#/definitions/DataModelVersionDto",
        },
        data: {
          $ref: "#/definitions/ProjectPlanListItemDataRedactedDto",
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
            $ref: "#/definitions/ProjectPlanListItemRedactedDto",
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
      description:
        'Core information about a project plan stored in the SUPA service. This information is common to all \nversions of the project plan. Each project plan version is stored in the service as a separate "record"\nand all these versions share (refer to) the same single project plan record.\n',
      type: "object",
      properties: {
        oid: {
          type: "string",
        },
        displayId: {
          type: "integer",
          format: "int64",
        },
        latestVersion: {
          type: "integer",
          format: "int64",
        },
        createTime: {
          description:
            "Creation time as an ISO instant string. Example value: 2024-12-03T10:15:30Z\n",
          type: "string",
          format: "date-time",
        },
      },
      required: ["createTime", "displayId", "latestVersion", "oid"],
    },
    ProjectPlanVersionContentRedactedDto: {
      description: "The actual content of a project plan version",
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
          description:
            "Approximate start date for the project. A local date in ISO format, example value: 2024-03-26.\n",
          type: ["string", "null"],
          format: "date",
        },
        endDate: {
          description:
            "Approximate end date for the project. A local date in ISO format, example value: 2024-03-26.\nIf not defined, and 'startDate' is given, the high-level timespan of the project plan extends to\n\"eternity\" starting from 'startDate'. If defined, also 'startDate' must be defined.\n",
          type: ["string", "null"],
          format: "date",
        },
        dateTz: {
          description:
            'The IANA timezone name of start and end dates to allow the comparison of the project plan high-level\ntimespan to intervals/instants. If left undefined and start date is defined, defaults to \n"Europe/Helsinki".\n',
          type: ["string", "null"],
          maxLength: 200,
          minLength: 0,
        },
        yearlyPlanOids: {
          description:
            'List of deferences (OIDs) to yearly plans that "belong" to this project plan. A yearly plan can\nbelong to at most one project plan at a time.\n',
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
      description:
        "A project plan version stored in the SUPA service. The actual content of the version is wrapped inside\na separate DTO ('ProjectPlanVersionContentRedactedDto'). Likewise, information shared by all versions of \nthe same project plan is also wrapped inside a separate DTO ('ProjectPlanRedactedDto').\n",
      type: "object",
      properties: {
        projectPlan: {
          $ref: "#/definitions/ProjectPlanRedactedDto",
        },
        version: {
          type: "integer",
          format: "int64",
        },
        createTime: {
          description:
            "Creation time as an ISO instant string. Example value: 2024-12-03T10:15:30Z\n",
          type: "string",
          format: "date-time",
        },
        content: {
          $ref: "#/definitions/ProjectPlanVersionContentRedactedDto",
        },
      },
      required: ["content", "createTime", "projectPlan", "version"],
    },
    ProjectPlanVersionRedactedDto: {
      type: "object",
      properties: {
        dataModelVersion: {
          $ref: "#/definitions/DataModelVersionDto",
        },
        data: {
          $ref: "#/definitions/ProjectPlanVersionDataRedactedDto",
        },
      },
      required: ["data", "dataModelVersion"],
    },
  },
};
