/* eslint-disable max-lines */
export const ramiRosmMessageJsonSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "RamiOperatorScheduledMessage",
  additionalProperties: false,
  type: "object",
  properties: {
    headers: {
      required: ["e2eId", "eventType", "recordedAtTime", "source"],
      type: "object",
      properties: {
        e2eId: {
          type: "string",
          description:
            "Correlational event unique identifier for logging and instrumentation",
          format: "uuid",
          example: "c45c7f92-5f96-4059-b0b3-20295388e4f6",
        },
        organisation: {
          type: "string",
          description: "Data Type for Identifier of an OrganisationCode.",
          example: "MOOVA",
        },
        source: {
          type: "string",
          description: "Module identifier that publishes the message",
          example: "scheduledmessagepublisher-adapter",
        },
        partitionKey: {
          type: ["string", "null"],
          description:
            "kafka partition key where the message is sent in the specific topic. The message id is used",
        },
        eventType: {
          type: ["string", "null"],
          description: "Type of event",
          example: "RamiOperatorScheduledMessage",
        },
        recordedAtTime: {
          type: "string",
          description: "Registration date",
          format: "date-time",
        },
      },
      description: "Mandatory header of the message",
    },
    payload: {
      required: [
        "creationDateTime",
        "endValidity",
        "messageId",
        "messageType",
        "messageVersion",
        "operation",
        "startValidity",
        "title",
      ],
      type: "object",
      properties: {
        messageId: {
          type: "string",
          description: "unique id of the message",
          example: "SHM20211217103239796",
        },
        messageVersion: {
          minimum: 1,
          type: "integer",
          description:
            "message versioning, it is incremented at each message update",
          example: 1,
        },
        title: {
          maxLength: 255,
          type: "string",
          description: "title of the message",
          example: "Title message",
        },
        messageType: {
          type: ["string", "null"],
          description:
            "type of the message. Indicates whether related with vehicle journey or not",
          example: "SCHEDULED_MESSAGE",
          enum: ["SCHEDULED_MESSAGE", "MONITORED_JOURNEY_SCHEDULED_MESSAGE"],
        },
        operation: {
          type: ["string", "null"],
          description: "type of operation performed by the user on the message",
          example: "INSERT",
          enum: ["INSERT", "UPDATE", "DELETE"],
        },
        creationDateTime: {
          type: "string",
          description: "datetime, in UTC ISO8601, creation date time",
          format: "date-time",
        },
        startValidity: {
          type: "string",
          description: "datetime, in UTC ISO8601, start validity",
          format: "date-time",
        },
        endValidity: {
          type: "string",
          description: "datetime, in UTC ISO8601, end validity",
          format: "date-time",
        },
        scheduledMessage: {
          required: ["deliveryChannels"],
          type: ["object", "null"],
          properties: {
            situations: {
              nullable: true,
              type: "array",
              items: {
                type: ["object", "null"],
                properties: {
                  id: {
                    type: "string",
                  },
                  name: {
                    type: "string",
                  },
                },
                description:
                  "a Scheduled message optionally can be related to a situation (SIRI)",
              },
            },
            deliveryChannels: {
              nullable: true,
              type: "array",
              items: {
                type: ["string", "null"],
                description:
                  "channel on which the message is delivered. EXTERNAL is not used for MonitoredJourneyScheduledMessage",
                example: "ONGROUND",
                enum: ["ONGROUND", "ONBOARD", "EXTERNAL"],
              },
            },
            onGroundRecipient: {
              required: ["deliveryPoints", "messageContentType"],
              type: ["object", "null"],
              properties: {
                messageContentType: {
                  type: ["string", "null"],
                  description: "message content type",
                  example: "AUDIO",
                  enum: ["AUDIO", "VIDEO", "AUDIO_VIDEO"],
                },
                deliveryPoints: {
                  type: "array",
                  items: {
                    required: ["id"],
                    type: ["object", "null"],
                    properties: {
                      id: {
                        type: "string",
                        description:
                          "**This refers to code external to Moova**. It is retrieved by invoking the SVCPLN-NetworkCode service",
                        example: "LPV",
                      },
                      nameLong: {
                        type: "string",
                        nullable: true,
                        example: "Milan Central FS",
                      },
                    },
                    description: "point where to deliver the scheduled message",
                  },
                },
                recipientAudioMessagesToDeliver: {
                  required: ["audioContentType", "scheduledAudioDeliveryRules"],
                  type: ["object", "null"],
                  properties: {
                    audioContentType: {
                      type: ["string", "null"],
                      description: "type of audio content",
                      example: "AUDIO_TEXT",
                      enum: ["AUDIO_TEXT", "AUDIO_FILE"],
                    },
                    audioText: {
                      type: "array",
                      nullable: true,
                      items: {
                        required: ["language", "text"],
                        type: ["object", "null"],
                        properties: {
                          language: {
                            type: "string",
                            description:
                              "identifies the language of the audio content",
                            example: "en_GB",
                          },
                          text: {
                            type: "string",
                            description: "audio text used for tts system",
                          },
                        },
                        description:
                          "information about audio text. This part is present if the audio content type is AUDIO_TEXT",
                      },
                    },
                    media: {
                      type: "string",
                      nullable: true,
                      description:
                        "used only for audio file, in this case audio content type is AUDIO_FILE",
                      format: "byte",
                    },
                    scheduledAudioDeliveryRules: {
                      required: ["audioSchedulationType"],
                      type: ["object", "null"],
                      properties: {
                        audioSchedulationType: {
                          type: ["string", "null"],
                          description: "type of audio schedulation",
                          example: "NOW",
                          enum: ["NOW", "DELIVERY_AT", "REPEAT_EVERY"],
                        },
                        repetitions: {
                          minimum: 0,
                          type: "integer",
                          nullable: true,
                          description:
                            "number of times the audio message must be repeated each occurens. It is only used for REPEAT_EVERY type scheduling",
                          example: 1,
                        },
                        repeatEvery: {
                          type: "integer",
                          nullable: true,
                          description:
                            "period of time that must pass between an audio repetition and the next. This field is in seconds. It is only used for REPEAT_EVERY type scheduling",
                          example: 600,
                        },
                        startDateTime: {
                          type: "string",
                          nullable: true,
                          description:
                            "scheduling start date. It is only used for REPEAT_EVERY type scheduling",
                          format: "date-time",
                        },
                        endDateTime: {
                          type: "string",
                          nullable: true,
                          description:
                            "scheduling end date. It is only used for REPEAT_EVERY type scheduling",
                          format: "date-time",
                        },
                        startTime: {
                          type: "string",
                          nullable: true,
                          description:
                            "scheduling start time. It is only used for REPEAT_EVERY type scheduling",
                          format: "HH:MM",
                          example: 840,
                        },
                        endTime: {
                          type: "string",
                          nullable: true,
                          description:
                            "scheduling end time. It is only used for REPEAT_EVERY type scheduling",
                          format: "HH:MM",
                          example: 1020,
                        },
                        daysOfWeek: {
                          maxItems: 7,
                          type: "array",
                          nullable: true,
                          description:
                            "days of the week when the rule is valid. If the list is empty it is valid every day. It is only used for REPEAT_EVERY type scheduling",
                          items: {
                            type: ["string", "null"],
                            description: "Day of week",
                            enum: [
                              "SUNDAY",
                              "MONDAY",
                              "TUESDAY",
                              "WEDNESDAY",
                              "THURSDAY",
                              "FRIDAY",
                              "SATURDAY",
                            ],
                          },
                        },
                        deliveryAtDateTime: {
                          type: "string",
                          nullable: true,
                          description:
                            "message delivery date and time. It is only used for DELIVERY_AT type scheduling",
                          format: "date-time",
                        },
                      },
                      description:
                        "The delivery rules can be of three types: \n  - NOW the message must be delivered at the time of insertion. \n  - DELIVERY_AT the message must be delivered on the date-time _deliveryAtDateTime_. \n  - REPEAT_EVERY the message begins to be delivered from _startDateTime_ at _startTime_ to _endDateTime_ at _endTime_ evaluating the repetition conditions and _daysOfWeek_ conditions.",
                    },
                  },
                  description:
                    "audio message to deliver. This part is present if the content type is AUDIO or AUDIO_VIDEO type for a ScheduledMessage",
                },
                recipientVideoMessagesToDeliver: {
                  required: ["deliveryRules", "videoTexts"],
                  type: ["object", "null"],
                  properties: {
                    videoTexts: {
                      type: "array",
                      items: {
                        required: ["language", "text"],
                        type: ["object", "null"],
                        properties: {
                          language: {
                            type: "string",
                            description:
                              "identifies the language of the video content",
                          },
                          text: {
                            type: "string",
                          },
                        },
                        description: "information about video text",
                      },
                    },
                    deliveryRules: {
                      required: [
                        "endDateTime",
                        "startDateTime",
                        "videoSchedulationType",
                      ],
                      type: ["object", "null"],
                      properties: {
                        videoSchedulationType: {
                          type: ["string", "null"],
                          description: "type of audio schedulation",
                          example: "WHEN",
                          enum: ["WHEN", "CONTINUOS_VISUALIZATION"],
                        },
                        startDateTime: {
                          type: "string",
                          nullable: true,
                          description: "scheduling start date",
                          format: "date-time",
                        },
                        endDateTime: {
                          type: "string",
                          nullable: true,
                          description: "scheduling end date",
                          format: "date-time",
                        },
                        startTime: {
                          type: "string",
                          nullable: true,
                          description:
                            "scheduling start time. Could be null for CONTINUOS_DELIVERY type scheduling",
                          format: "HH:MM",
                          example: 840,
                        },
                        endTime: {
                          type: "string",
                          nullable: true,
                          description:
                            "scheduling end time. Could be null for CONTINUOS_DELIVERY type scheduling",
                          format: "HH:MM",
                          example: 1020,
                        },
                        daysOfWeek: {
                          maxItems: 7,
                          type: "array",
                          nullable: true,
                          description:
                            "days of the week when the rule is valid. If the list is empty it is valid every day. It is only used for WHEN type scheduling",
                          items: {
                            type: ["string", "null"],
                            description: "Day of week",
                            enum: [
                              "SUNDAY",
                              "MONDAY",
                              "TUESDAY",
                              "WEDNESDAY",
                              "THURSDAY",
                              "FRIDAY",
                              "SATURDAY",
                            ],
                          },
                        },
                      },
                      description:
                        "The delivery rules can be of two types: \n  - WHEN the message must be delivered to the video from the _startDateTime_ date to the _endDateTime_ date only in the time interval between the _startTime_ time and _endTime_ time for each day in the _daysOfWeek_ list\n  - CONTINUOUS_VISUALIZATION the message must be delivered to the video from the _startDateTime_ date (at _startTime_ if exists) to the _endDateTime_ (at _endTime_ if exists)",
                    },
                  },
                  description:
                    "video message to deliver. This part is present if the content type is VIDEO or AUDIO_VIDEO type for a ScheduledMessage",
                },
              },
              description:
                "scheduled message to delivery at specified _deliveryPoints_. This part is present if the scheduled message must be delivered on channel ONGROUND",
            },
            onBoardRecipient: {
              required: ["messageContentType", "vehicleJourneys"],
              type: ["object", "null"],
              properties: {
                messageContentType: {
                  type: ["string", "null"],
                  description: "message content type",
                  example: "AUDIO",
                  enum: ["AUDIO", "VIDEO", "AUDIO_VIDEO"],
                },
                vehicleJourneys: {
                  type: "array",
                  items: {
                    required: [
                      "dataFrameRef",
                      "datedVehicleJourneyRef",
                      "vehicleJourneyName",
                    ],
                    type: ["object", "null"],
                    properties: {
                      datedVehicleJourneyRef: {
                        type: "string",
                        description: "id of vehicle journey",
                      },
                      dataFrameRef: {
                        type: "string",
                        description:
                          "unique identifier of data frame within participant service",
                      },
                      vehicleJourneyName: {
                        type: "string",
                        description: "name of vehicle journey",
                      },
                    },
                    description: "vehicle journey identifiers information",
                  },
                },
                recipientAudioMessagesToDeliver: {
                  required: ["audioContentType", "scheduledAudioDeliveryRules"],
                  type: ["object", "null"],
                  properties: {
                    audioContentType: {
                      type: ["string", "null"],
                      description: "type of audio content",
                      example: "AUDIO_TEXT",
                      enum: ["AUDIO_TEXT", "AUDIO_FILE"],
                    },
                    audioText: {
                      type: "array",
                      nullable: true,
                      items: {
                        required: ["language", "text"],
                        type: ["object", "null"],
                        properties: {
                          language: {
                            type: "string",
                            description:
                              "identifies the language of the audio content",
                            example: "en_GB",
                          },
                          text: {
                            type: "string",
                            description: "audio text used for tts system",
                          },
                        },
                        description:
                          "information about audio text. This part is present if the audio content type is AUDIO_TEXT",
                      },
                    },
                    media: {
                      type: "string",
                      nullable: true,
                      description:
                        "used only for audio file, in this case audio content type is AUDIO_FILE",
                      format: "byte",
                    },
                    scheduledAudioDeliveryRules: {
                      required: ["audioSchedulationType"],
                      type: ["object", "null"],
                      properties: {
                        audioSchedulationType: {
                          type: ["string", "null"],
                          description: "type of audio schedulation",
                          example: "NOW",
                          enum: ["NOW", "DELIVERY_AT", "REPEAT_EVERY"],
                        },
                        repetitions: {
                          minimum: 1,
                          type: "integer",
                          nullable: true,
                          description:
                            "number of times the audio message must be repeated each occurens. It is only used for REPEAT_EVERY type scheduling",
                          example: 1,
                        },
                        repeatEvery: {
                          type: "integer",
                          nullable: true,
                          description:
                            "period of time that must pass between an audio repetition and the next. This field is in seconds. It is only used for REPEAT_EVERY type scheduling",
                          example: 600,
                        },
                        startDateTime: {
                          type: "string",
                          nullable: true,
                          description:
                            "scheduling start date. It is only used for REPEAT_EVERY type scheduling",
                          format: "date-time",
                        },
                        endDateTime: {
                          type: "string",
                          nullable: true,
                          description:
                            "scheduling end date. It is only used for REPEAT_EVERY type scheduling",
                          format: "date-time",
                        },
                        startTime: {
                          type: "string",
                          nullable: true,
                          description:
                            "scheduling start time. It is only used for REPEAT_EVERY type scheduling",
                          format: "HH:MM",
                          example: 840,
                        },
                        endTime: {
                          type: "string",
                          nullable: true,
                          description:
                            "scheduling end time. It is only used for REPEAT_EVERY type scheduling",
                          format: "HH:MM",
                          example: 1020,
                        },
                        daysOfWeek: {
                          maxItems: 7,
                          type: "array",
                          nullable: true,
                          description:
                            "days of the week when the rule is valid. If the list is empty it is valid every day. It is only used for REPEAT_EVERY type scheduling",
                          items: {
                            type: ["string", "null"],
                            description: "Day of week",
                            enum: [
                              "SUNDAY",
                              "MONDAY",
                              "TUESDAY",
                              "WEDNESDAY",
                              "THURSDAY",
                              "FRIDAY",
                              "SATURDAY",
                            ],
                          },
                        },
                        deliveryAtDateTime: {
                          type: "string",
                          nullable: true,
                          description:
                            "message delivery date and time. It is only used for DELIVERY_AT type scheduling",
                          format: "date-time",
                        },
                      },
                      description:
                        "The delivery rules can be of three types: \n  - NOW the message must be delivered at the time of insertion. \n  - DELIVERY_AT the message must be delivered on the date-time _deliveryAtDateTime_. \n  - REPEAT_EVERY the message begins to be delivered from _startDateTime_ at _startTime_ to _endDateTime_ at _endTime_ evaluating the repetition conditions and _daysOfWeek_ conditions.",
                    },
                  },
                  description:
                    "audio message to deliver. This part is present if the content type is AUDIO or AUDIO_VIDEO type for a ScheduledMessage",
                },
                recipientVideoMessagesToDeliver: {
                  required: ["deliveryRules", "videoTexts"],
                  type: ["object", "null"],
                  properties: {
                    videoTexts: {
                      type: "array",
                      items: {
                        required: ["language", "text"],
                        type: ["object", "null"],
                        properties: {
                          language: {
                            type: "string",
                            description:
                              "identifies the language of the video content",
                          },
                          text: {
                            type: "string",
                          },
                        },
                        description: "information about video text",
                      },
                    },
                    deliveryRules: {
                      required: [
                        "endDateTime",
                        "startDateTime",
                        "videoSchedulationType",
                      ],
                      type: ["object", "null"],
                      properties: {
                        videoSchedulationType: {
                          type: ["string", "null"],
                          description: "type of audio schedulation",
                          example: "WHEN",
                          enum: ["WHEN", "CONTINUOS_VISUALIZATION"],
                        },
                        startDateTime: {
                          type: "string",
                          nullable: true,
                          description: "scheduling start date",
                          format: "date-time",
                        },
                        endDateTime: {
                          type: "string",
                          nullable: true,
                          description: "scheduling end date",
                          format: "date-time",
                        },
                        startTime: {
                          type: "string",
                          nullable: true,
                          description:
                            "scheduling start time. Could be null for CONTINUOS_DELIVERY type scheduling",
                          format: "HH:MM",
                          example: 840,
                        },
                        endTime: {
                          type: "string",
                          nullable: true,
                          description:
                            "scheduling end time. Could be null for CONTINUOS_DELIVERY type scheduling",
                          format: "HH:MM",
                          example: 1020,
                        },
                        daysOfWeek: {
                          maxItems: 7,
                          type: "array",
                          nullable: true,
                          description:
                            "days of the week when the rule is valid. If the list is empty it is valid every day. It is only used for WHEN type scheduling",
                          items: {
                            type: ["string", "null"],
                            description: "Day of week",
                            enum: [
                              "SUNDAY",
                              "MONDAY",
                              "TUESDAY",
                              "WEDNESDAY",
                              "THURSDAY",
                              "FRIDAY",
                              "SATURDAY",
                            ],
                          },
                        },
                      },
                      description:
                        "The delivery rules can be of two types: \n  - WHEN the message must be delivered to the video from the _startDateTime_ date to the _endDateTime_ date only in the time interval between the _startTime_ time and _endTime_ time for each day in the _daysOfWeek_ list\n  - CONTINUOUS_VISUALIZATION the message must be delivered to the video from the _startDateTime_ date (at _startTime_ if exists) to the _endDateTime_ (at _endTime_ if exists)",
                    },
                  },
                  description:
                    "video message to deliver. This part is present if the content type is VIDEO or AUDIO_VIDEO type for a ScheduledMessage",
                },
              },
              description:
                "scheduled message to delivery at specified _vehicleJourneys_. This part is present if the scheduled message must be delivered on channel ONBOARD",
            },
            externalSystemRecipient: {
              required: ["messageContents"],
              type: ["object", "null"],
              properties: {
                messageContents: {
                  type: "array",
                  items: {
                    required: ["language", "text"],
                    type: ["object", "null"],
                    properties: {
                      language: {
                        type: "string",
                        description:
                          "identifies the language of the external content",
                      },
                      text: {
                        type: "string",
                      },
                    },
                    description: "information about external text",
                  },
                },
                externalPoints: {
                  nullable: true,
                  type: "array",
                  items: {
                    required: ["id"],
                    type: ["object", "null"],
                    properties: {
                      id: {
                        type: "string",
                        description:
                          "**This refers to code external to Moova**. It is retrieved by invoking the SVCPLN-NetworkCode service",
                        example: "LPV",
                      },
                      nameLong: {
                        type: "string",
                        nullable: true,
                        example: "Milan Central FS",
                      },
                    },
                    description: "point where to deliver the scheduled message",
                  },
                },
                startDateTime: {
                  type: "string",
                  nullable: true,
                  description: "scheduling start date-time",
                  format: "date-time",
                },
                endDateTime: {
                  nullable: true,
                  type: "string",
                  description: "scheduling end date-time",
                  format: "date-time",
                },
              },
              description:
                "scheduled message to delivery to external system. It can delivered to _externalPoints_. This part is present if the scheduled message must be delivered on channel EXTERNAL",
            },
          },
          description:
            "it is filled only if the message is of type SCHEDULED_MESSAGE. The scheduled message can be delivered through one or more channels: ONGROUND, ONBOARD or EXTERNAL",
        },
        monitoredJourneyScheduledMessage: {
          required: ["deliveryPoints", "messageContentType", "vehicleJourney"],
          type: ["object", "null"],
          properties: {
            vehicleJourney: {
              required: [
                "dataFrameRef",
                "datedVehicleJourneyRef",
                "vehicleJourneyName",
              ],
              type: ["object", "null"],
              properties: {
                datedVehicleJourneyRef: {
                  type: "string",
                  description: "id of vehicle journey",
                },
                dataFrameRef: {
                  type: "string",
                  description:
                    "unique identifier of data frame within participant service",
                },
                vehicleJourneyName: {
                  type: "string",
                  description: "name of vehicle journey",
                },
              },
              description: "vehicle journey identifiers information",
            },
            messageContentType: {
              type: ["string", "null"],
              description: "message content type",
              example: "AUDIO",
              enum: ["AUDIO", "VIDEO", "AUDIO_VIDEO"],
            },
            deliveryPoints: {
              type: "array",
              items: {
                required: ["id"],
                type: ["object", "null"],
                properties: {
                  id: {
                    type: "string",
                    description:
                      "**This refers to code external to Moova**. It is retrieved by invoking the SVCPLN-NetworkCode service",
                    example: "LPV",
                  },
                  nameLong: {
                    type: "string",
                    nullable: true,
                    example: "Milan Central FS",
                  },
                },
                description: "point where to deliver the scheduled message",
              },
            },
            audioMessageContents: {
              required: ["audioTexts", "deliveryRules", "deliveryType"],
              type: ["object", "null"],
              properties: {
                audioTexts: {
                  type: "array",
                  description: "list of audio message text",
                  items: {
                    required: ["audioText", "language"],
                    type: ["object", "null"],
                    properties: {
                      language: {
                        type: "string",
                        description: "identifies the language of the content",
                        example: "en_GB",
                      },
                      audioText: {
                        type: "string",
                        description: "audio text used for tts system",
                      },
                    },
                    description:
                      "audio message content to be delivered for monitored journey scheduled message",
                  },
                },
                deliveryRules: {
                  type: ["object", "null"],
                  properties: {
                    repetitions: {
                      type: "integer",
                      nullable: true,
                    },
                    repeatEvery: {
                      type: "integer",
                      nullable: true,
                    },
                    scheduledArrival: {
                      type: "boolean",
                      nullable: true,
                    },
                    scheduledDeparture: {
                      type: "boolean",
                      nullable: true,
                    },
                    estimatedArrival: {
                      type: "boolean",
                      nullable: true,
                    },
                    estimatedDeparture: {
                      type: "boolean",
                      nullable: true,
                    },
                    eventType: {
                      type: ["string", "null"],
                      description:
                        "one of the event for messages to deliver on board ARRIVING DEPARTING ARRIVED DEPARTED\n  ",
                    },
                  },
                  description:
                    "Delivery Rule for monitored journey scheduled message",
                },
                deliveryType: {
                  type: ["string", "null"],
                  description:
                    "delivery type of message associated with vehicle journeys",
                  enum: ["ON_EVENT", "ON_SCHEDULE", null],
                },
              },
              description:
                "audio message content to be delivered for monitored journey scheduled message with delivery rules.\nAudio messages can be delivered in three delivery types specified in the _deliveryType_ field: \n- ON_EVENT the message is delivered for vehicle journey when that vehicle journey generates a specified event for a defined Point in _deliveryPoints_ (e.g. ARRIVING)\n- ON_SCHEDULE the message is delivered on a specific vehicle journey scheduling date happens for a defined Point in _deliveryPoints_ (e.g. estimated arrival time)",
            },
            videoTexts: {
              type: "array",
              nullable: true,
              description: "list of video message for vehicle journey",
              items: {
                required: ["language", "videoText"],
                type: ["object", "null"],
                properties: {
                  language: {
                    type: "string",
                    description: "identifies the language of the content",
                    example: "en_GB",
                  },
                  videoText: {
                    type: "string",
                    description: "audio text used for tts system",
                  },
                },
                description:
                  "video message content to be delivered for monitored journey scheduled message",
              },
            },
          },
          description:
            "is filled only if the message is of type MONITORED_JOURNEY_SCHEDULED_MESSAGE",
        },
      },
      description:
        "Object containing the information of a scheduled message inserted by an operator",
    },
    extraPayload: {
      type: ["object", "null"],
      properties: {},
      description: "Optional extention of payload object",
    },
  },
  required: ["headers", "payload"],
  description: "Container of the message",
  definitions: {
    AudioContentTypeEnum: {
      type: ["string", "null"],
      description: "type of audio content",
      example: "AUDIO_TEXT",
      enum: ["AUDIO_TEXT", "AUDIO_FILE"],
    },
    AudioSchedulationTypeEnum: {
      type: ["string", "null"],
      description: "type of audio schedulation",
      example: "NOW",
      enum: ["NOW", "DELIVERY_AT", "REPEAT_EVERY"],
    },
    AudioText: {
      required: ["language", "text"],
      type: ["object", "null"],
      properties: {
        language: {
          type: "string",
          description: "identifies the language of the audio content",
          example: "en_GB",
        },
        text: {
          type: "string",
          description: "audio text used for tts system",
        },
      },
      description:
        "information about audio text. This part is present if the audio content type is AUDIO_TEXT",
    },
    DayOfWeek: {
      type: ["string", "null"],
      description: "Day of week",
      enum: [
        "SUNDAY",
        "MONDAY",
        "TUESDAY",
        "WEDNESDAY",
        "THURSDAY",
        "FRIDAY",
        "SATURDAY",
      ],
    },
    DeliveryChannelTypeEnum: {
      type: ["string", "null"],
      description:
        "channel on which the message is delivered. EXTERNAL is not used for MonitoredJourneyScheduledMessage",
      example: "ONGROUND",
      enum: ["ONGROUND", "ONBOARD", "EXTERNAL"],
    },
    ExternalSystemRecipient: {
      required: ["messageContents"],
      type: ["object", "null"],
      properties: {
        messageContents: {
          type: "array",
          items: {
            required: ["language", "text"],
            type: ["object", "null"],
            properties: {
              language: {
                type: "string",
                description: "identifies the language of the external content",
              },
              text: {
                type: "string",
              },
            },
            description: "information about external text",
          },
        },
        externalPoints: {
          nullable: true,
          type: "array",
          items: {
            required: ["id"],
            type: ["object", "null"],
            properties: {
              id: {
                type: "string",
                description:
                  "**This refers to code external to Moova**. It is retrieved by invoking the SVCPLN-NetworkCode service",
                example: "LPV",
              },
              nameLong: {
                type: "string",
                nullable: true,
                example: "Milan Central FS",
              },
            },
            description: "point where to deliver the scheduled message",
          },
        },
        startDateTime: {
          type: "string",
          nullable: true,
          description: "scheduling start date-time",
          format: "date-time",
        },
        endDateTime: {
          nullable: true,
          type: "string",
          description: "scheduling end date-time",
          format: "date-time",
        },
      },
      description:
        "scheduled message to delivery to external system. It can delivered to _externalPoints_. This part is present if the scheduled message must be delivered on channel EXTERNAL",
    },
    ExternalText: {
      required: ["language", "text"],
      type: ["object", "null"],
      properties: {
        language: {
          type: "string",
          description: "identifies the language of the external content",
        },
        text: {
          type: "string",
        },
      },
      description: "information about external text",
    },
    Headers: {
      required: ["e2eId", "eventType", "recordedAtTime", "source"],
      type: "object",
      properties: {
        e2eId: {
          type: "string",
          description:
            "Correlational event unique identifier for logging and instrumentation",
          format: "uuid",
          example: "c45c7f92-5f96-4059-b0b3-20295388e4f6",
        },
        organisation: {
          type: "string",
          description: "Data Type for Identifier of an OrganisationCode.",
          example: "MOOVA",
        },
        source: {
          type: "string",
          description: "Module identifier that publishes the message",
          example: "scheduledmessagepublisher-adapter",
        },
        partitionKey: {
          type: ["string", "null"],
          description:
            "kafka partition key where the message is sent in the specific topic. The message id is used",
        },
        eventType: {
          type: ["string", "null"],
          description: "Type of event",
          example: "RamiOperatorScheduledMessage",
        },
        recordedAtTime: {
          type: "string",
          description: "Registration date",
          format: "date-time",
        },
      },
      description: "Mandatory header of the message",
    },
    MessageContentTypeEnum: {
      type: ["string", "null"],
      description: "message content type",
      example: "AUDIO",
      enum: ["AUDIO", "VIDEO", "AUDIO_VIDEO"],
    },
    MessageTypeEnum: {
      type: ["string", "null"],
      description:
        "type of the message. Indicates whether related with vehicle journey or not",
      example: "SCHEDULED_MESSAGE",
      enum: ["SCHEDULED_MESSAGE", "MONITORED_JOURNEY_SCHEDULED_MESSAGE"],
    },
    MonitoredJourneyAudioDeliveryRules: {
      type: ["object", "null"],
      properties: {
        repetitions: {
          type: "integer",
          nullable: true,
        },
        repeatEvery: {
          type: "integer",
          nullable: true,
        },
        scheduledArrival: {
          type: "boolean",
          nullable: true,
        },
        scheduledDeparture: {
          type: "boolean",
          nullable: true,
        },
        estimatedArrival: {
          type: "boolean",
          nullable: true,
        },
        estimatedDeparture: {
          type: "boolean",
          nullable: true,
        },
        eventType: {
          type: ["string", "null"],
          description:
            "one of the event for messages to deliver on board ARRIVING DEPARTING ARRIVED DEPARTED\n  ",
        },
      },
      description: "Delivery Rule for monitored journey scheduled message",
    },
    MonitoredJourneyAudioDeliveryTypeEnum: {
      type: ["string", "null"],
      description: "delivery type of message associated with vehicle journeys",
      enum: ["ON_EVENT", "ON_SCHEDULE", null],
    },
    MonitoredJourneyAudioMessageContents: {
      required: ["audioTexts", "deliveryRules", "deliveryType"],
      type: ["object", "null"],
      properties: {
        audioTexts: {
          type: "array",
          description: "list of audio message text",
          items: {
            required: ["audioText", "language"],
            type: ["object", "null"],
            properties: {
              language: {
                type: "string",
                description: "identifies the language of the content",
                example: "en_GB",
              },
              audioText: {
                type: "string",
                description: "audio text used for tts system",
              },
            },
            description:
              "audio message content to be delivered for monitored journey scheduled message",
          },
        },
        deliveryRules: {
          type: ["object", "null"],
          properties: {
            repetitions: {
              type: "integer",
              nullable: true,
            },
            repeatEvery: {
              type: "integer",
              nullable: true,
            },
            scheduledArrival: {
              type: "boolean",
              nullable: true,
            },
            scheduledDeparture: {
              type: "boolean",
              nullable: true,
            },
            estimatedArrival: {
              type: "boolean",
              nullable: true,
            },
            estimatedDeparture: {
              type: "boolean",
              nullable: true,
            },
            eventType: {
              type: ["string", "null"],
              description:
                "one of the event for messages to deliver on board ARRIVING DEPARTING ARRIVED DEPARTED\n  ",
            },
          },
          description: "Delivery Rule for monitored journey scheduled message",
        },
        deliveryType: {
          type: ["string", "null"],
          description:
            "delivery type of message associated with vehicle journeys",
          enum: ["ON_EVENT", "ON_SCHEDULE", null],
        },
      },
      description:
        "audio message content to be delivered for monitored journey scheduled message with delivery rules.\nAudio messages can be delivered in three delivery types specified in the _deliveryType_ field: \n- ON_EVENT the message is delivered for vehicle journey when that vehicle journey generates a specified event for a defined Point in _deliveryPoints_ (e.g. ARRIVING)\n- ON_SCHEDULE the message is delivered on a specific vehicle journey scheduling date happens for a defined Point in _deliveryPoints_ (e.g. estimated arrival time)",
    },
    MonitoredJourneyAudioText: {
      required: ["audioText", "language"],
      type: ["object", "null"],
      properties: {
        language: {
          type: "string",
          description: "identifies the language of the content",
          example: "en_GB",
        },
        audioText: {
          type: "string",
          description: "audio text used for tts system",
        },
      },
      description:
        "audio message content to be delivered for monitored journey scheduled message",
    },
    MonitoredJourneyScheduledMessage: {
      required: ["deliveryPoints", "messageContentType", "vehicleJourney"],
      type: ["object", "null"],
      properties: {
        vehicleJourney: {
          required: [
            "dataFrameRef",
            "datedVehicleJourneyRef",
            "vehicleJourneyName",
          ],
          type: ["object", "null"],
          properties: {
            datedVehicleJourneyRef: {
              type: "string",
              description: "id of vehicle journey",
            },
            dataFrameRef: {
              type: "string",
              description:
                "unique identifier of data frame within participant service",
            },
            vehicleJourneyName: {
              type: "string",
              description: "name of vehicle journey",
            },
          },
          description: "vehicle journey identifiers information",
        },
        messageContentType: {
          type: ["string", "null"],
          description: "message content type",
          example: "AUDIO",
          enum: ["AUDIO", "VIDEO", "AUDIO_VIDEO"],
        },
        deliveryPoints: {
          type: "array",
          items: {
            required: ["id"],
            type: ["object", "null"],
            properties: {
              id: {
                type: "string",
                description:
                  "**This refers to code external to Moova**. It is retrieved by invoking the SVCPLN-NetworkCode service",
                example: "LPV",
              },
              nameLong: {
                type: "string",
                nullable: true,
                example: "Milan Central FS",
              },
            },
            description: "point where to deliver the scheduled message",
          },
        },
        audioMessageContents: {
          required: ["audioTexts", "deliveryRules", "deliveryType"],
          type: ["object", "null"],
          properties: {
            audioTexts: {
              type: "array",
              description: "list of audio message text",
              items: {
                required: ["audioText", "language"],
                type: ["object", "null"],
                properties: {
                  language: {
                    type: "string",
                    description: "identifies the language of the content",
                    example: "en_GB",
                  },
                  audioText: {
                    type: "string",
                    description: "audio text used for tts system",
                  },
                },
                description:
                  "audio message content to be delivered for monitored journey scheduled message",
              },
            },
            deliveryRules: {
              type: ["object", "null"],
              properties: {
                repetitions: {
                  type: "integer",
                  nullable: true,
                },
                repeatEvery: {
                  type: "integer",
                  nullable: true,
                },
                scheduledArrival: {
                  type: "boolean",
                  nullable: true,
                },
                scheduledDeparture: {
                  type: "boolean",
                  nullable: true,
                },
                estimatedArrival: {
                  type: "boolean",
                  nullable: true,
                },
                estimatedDeparture: {
                  type: "boolean",
                  nullable: true,
                },
                eventType: {
                  type: ["string", "null"],
                  description:
                    "one of the event for messages to deliver on board ARRIVING DEPARTING ARRIVED DEPARTED\n  ",
                },
              },
              description:
                "Delivery Rule for monitored journey scheduled message",
            },
            deliveryType: {
              type: ["string", "null"],
              description:
                "delivery type of message associated with vehicle journeys",
              enum: ["ON_EVENT", "ON_SCHEDULE", null],
            },
          },
          description:
            "audio message content to be delivered for monitored journey scheduled message with delivery rules.\nAudio messages can be delivered in three delivery types specified in the _deliveryType_ field: \n- ON_EVENT the message is delivered for vehicle journey when that vehicle journey generates a specified event for a defined Point in _deliveryPoints_ (e.g. ARRIVING)\n- ON_SCHEDULE the message is delivered on a specific vehicle journey scheduling date happens for a defined Point in _deliveryPoints_ (e.g. estimated arrival time)",
        },
        videoTexts: {
          type: "array",
          nullable: true,
          description: "list of video message for vehicle journey",
          items: {
            required: ["language", "videoText"],
            type: ["object", "null"],
            properties: {
              language: {
                type: "string",
                description: "identifies the language of the content",
                example: "en_GB",
              },
              videoText: {
                type: "string",
                description: "audio text used for tts system",
              },
            },
            description:
              "video message content to be delivered for monitored journey scheduled message",
          },
        },
      },
      description:
        "is filled only if the message is of type MONITORED_JOURNEY_SCHEDULED_MESSAGE",
    },
    MonitoredJourneyVideoText: {
      required: ["language", "videoText"],
      type: ["object", "null"],
      properties: {
        language: {
          type: "string",
          description: "identifies the language of the content",
          example: "en_GB",
        },
        videoText: {
          type: "string",
          description: "audio text used for tts system",
        },
      },
      description:
        "video message content to be delivered for monitored journey scheduled message",
    },
    OnBoardRecipient: {
      required: ["messageContentType", "vehicleJourneys"],
      type: ["object", "null"],
      properties: {
        messageContentType: {
          type: ["string", "null"],
          description: "message content type",
          example: "AUDIO",
          enum: ["AUDIO", "VIDEO", "AUDIO_VIDEO"],
        },
        vehicleJourneys: {
          type: "array",
          items: {
            required: [
              "dataFrameRef",
              "datedVehicleJourneyRef",
              "vehicleJourneyName",
            ],
            type: ["object", "null"],
            properties: {
              datedVehicleJourneyRef: {
                type: "string",
                description: "id of vehicle journey",
              },
              dataFrameRef: {
                type: "string",
                description:
                  "unique identifier of data frame within participant service",
              },
              vehicleJourneyName: {
                type: "string",
                description: "name of vehicle journey",
              },
            },
            description: "vehicle journey identifiers information",
          },
        },
        recipientAudioMessagesToDeliver: {
          required: ["audioContentType", "scheduledAudioDeliveryRules"],
          type: ["object", "null"],
          properties: {
            audioContentType: {
              type: ["string", "null"],
              description: "type of audio content",
              example: "AUDIO_TEXT",
              enum: ["AUDIO_TEXT", "AUDIO_FILE"],
            },
            audioText: {
              type: "array",
              nullable: true,
              items: {
                required: ["language", "text"],
                type: ["object", "null"],
                properties: {
                  language: {
                    type: "string",
                    description: "identifies the language of the audio content",
                    example: "en_GB",
                  },
                  text: {
                    type: "string",
                    description: "audio text used for tts system",
                  },
                },
                description:
                  "information about audio text. This part is present if the audio content type is AUDIO_TEXT",
              },
            },
            media: {
              type: "string",
              nullable: true,
              description:
                "used only for audio file, in this case audio content type is AUDIO_FILE",
              format: "byte",
            },
            scheduledAudioDeliveryRules: {
              required: ["audioSchedulationType"],
              type: ["object", "null"],
              properties: {
                audioSchedulationType: {
                  type: ["string", "null"],
                  description: "type of audio schedulation",
                  example: "NOW",
                  enum: ["NOW", "DELIVERY_AT", "REPEAT_EVERY"],
                },
                repetitions: {
                  minimum: 1,
                  type: "integer",
                  nullable: true,
                  description:
                    "number of times the audio message must be repeated each occurens. It is only used for REPEAT_EVERY type scheduling",
                  example: 1,
                },
                repeatEvery: {
                  type: "integer",
                  nullable: true,
                  description:
                    "period of time that must pass between an audio repetition and the next. This field is in seconds. It is only used for REPEAT_EVERY type scheduling",
                  example: 600,
                },
                startDateTime: {
                  type: "string",
                  nullable: true,
                  description:
                    "scheduling start date. It is only used for REPEAT_EVERY type scheduling",
                  format: "date-time",
                },
                endDateTime: {
                  type: "string",
                  nullable: true,
                  description:
                    "scheduling end date. It is only used for REPEAT_EVERY type scheduling",
                  format: "date-time",
                },
                startTime: {
                  type: "string",
                  nullable: true,
                  description:
                    "scheduling start time. It is only used for REPEAT_EVERY type scheduling",
                  format: "HH:MM",
                  example: 840,
                },
                endTime: {
                  type: "string",
                  nullable: true,
                  description:
                    "scheduling end time. It is only used for REPEAT_EVERY type scheduling",
                  format: "HH:MM",
                  example: 1020,
                },
                daysOfWeek: {
                  maxItems: 7,
                  type: "array",
                  nullable: true,
                  description:
                    "days of the week when the rule is valid. If the list is empty it is valid every day. It is only used for REPEAT_EVERY type scheduling",
                  items: {
                    type: ["string", "null"],
                    description: "Day of week",
                    enum: [
                      "SUNDAY",
                      "MONDAY",
                      "TUESDAY",
                      "WEDNESDAY",
                      "THURSDAY",
                      "FRIDAY",
                      "SATURDAY",
                    ],
                  },
                },
                deliveryAtDateTime: {
                  type: "string",
                  nullable: true,
                  description:
                    "message delivery date and time. It is only used for DELIVERY_AT type scheduling",
                  format: "date-time",
                },
              },
              description:
                "The delivery rules can be of three types: \n  - NOW the message must be delivered at the time of insertion. \n  - DELIVERY_AT the message must be delivered on the date-time _deliveryAtDateTime_. \n  - REPEAT_EVERY the message begins to be delivered from _startDateTime_ at _startTime_ to _endDateTime_ at _endTime_ evaluating the repetition conditions and _daysOfWeek_ conditions.",
            },
          },
          description:
            "audio message to deliver. This part is present if the content type is AUDIO or AUDIO_VIDEO type for a ScheduledMessage",
        },
        recipientVideoMessagesToDeliver: {
          required: ["deliveryRules", "videoTexts"],
          type: ["object", "null"],
          properties: {
            videoTexts: {
              type: "array",
              items: {
                required: ["language", "text"],
                type: ["object", "null"],
                properties: {
                  language: {
                    type: "string",
                    description: "identifies the language of the video content",
                  },
                  text: {
                    type: "string",
                  },
                },
                description: "information about video text",
              },
            },
            deliveryRules: {
              required: [
                "endDateTime",
                "startDateTime",
                "videoSchedulationType",
              ],
              type: ["object", "null"],
              properties: {
                videoSchedulationType: {
                  type: ["string", "null"],
                  description: "type of audio schedulation",
                  example: "WHEN",
                  enum: ["WHEN", "CONTINUOS_VISUALIZATION"],
                },
                startDateTime: {
                  type: "string",
                  nullable: true,
                  description: "scheduling start date",
                  format: "date-time",
                },
                endDateTime: {
                  type: "string",
                  nullable: true,
                  description: "scheduling end date",
                  format: "date-time",
                },
                startTime: {
                  type: "string",
                  nullable: true,
                  description:
                    "scheduling start time. Could be null for CONTINUOS_DELIVERY type scheduling",
                  format: "HH:MM",
                  example: 840,
                },
                endTime: {
                  type: "string",
                  nullable: true,
                  description:
                    "scheduling end time. Could be null for CONTINUOS_DELIVERY type scheduling",
                  format: "HH:MM",
                  example: 1020,
                },
                daysOfWeek: {
                  maxItems: 7,
                  type: "array",
                  nullable: true,
                  description:
                    "days of the week when the rule is valid. If the list is empty it is valid every day. It is only used for WHEN type scheduling",
                  items: {
                    type: ["string", "null"],
                    description: "Day of week",
                    enum: [
                      "SUNDAY",
                      "MONDAY",
                      "TUESDAY",
                      "WEDNESDAY",
                      "THURSDAY",
                      "FRIDAY",
                      "SATURDAY",
                    ],
                  },
                },
              },
              description:
                "The delivery rules can be of two types: \n  - WHEN the message must be delivered to the video from the _startDateTime_ date to the _endDateTime_ date only in the time interval between the _startTime_ time and _endTime_ time for each day in the _daysOfWeek_ list\n  - CONTINUOUS_VISUALIZATION the message must be delivered to the video from the _startDateTime_ date (at _startTime_ if exists) to the _endDateTime_ (at _endTime_ if exists)",
            },
          },
          description:
            "video message to deliver. This part is present if the content type is VIDEO or AUDIO_VIDEO type for a ScheduledMessage",
        },
      },
      description:
        "scheduled message to delivery at specified _vehicleJourneys_. This part is present if the scheduled message must be delivered on channel ONBOARD",
    },
    OnGroundRecipient: {
      required: ["deliveryPoints", "messageContentType"],
      type: ["object", "null"],
      properties: {
        messageContentType: {
          type: ["string", "null"],
          description: "message content type",
          example: "AUDIO",
          enum: ["AUDIO", "VIDEO", "AUDIO_VIDEO"],
        },
        deliveryPoints: {
          type: "array",
          items: {
            required: ["id"],
            type: ["object", "null"],
            properties: {
              id: {
                type: "string",
                description:
                  "**This refers to code external to Moova**. It is retrieved by invoking the SVCPLN-NetworkCode service",
                example: "LPV",
              },
              nameLong: {
                type: "string",
                nullable: true,
                example: "Milan Central FS",
              },
            },
            description: "point where to deliver the scheduled message",
          },
        },
        recipientAudioMessagesToDeliver: {
          required: ["audioContentType", "scheduledAudioDeliveryRules"],
          type: ["object", "null"],
          properties: {
            audioContentType: {
              type: ["string", "null"],
              description: "type of audio content",
              example: "AUDIO_TEXT",
              enum: ["AUDIO_TEXT", "AUDIO_FILE"],
            },
            audioText: {
              type: "array",
              nullable: true,
              items: {
                required: ["language", "text"],
                type: ["object", "null"],
                properties: {
                  language: {
                    type: "string",
                    description: "identifies the language of the audio content",
                    example: "en_GB",
                  },
                  text: {
                    type: "string",
                    description: "audio text used for tts system",
                  },
                },
                description:
                  "information about audio text. This part is present if the audio content type is AUDIO_TEXT",
              },
            },
            media: {
              type: "string",
              nullable: true,
              description:
                "used only for audio file, in this case audio content type is AUDIO_FILE",
              format: "byte",
            },
            scheduledAudioDeliveryRules: {
              required: ["audioSchedulationType"],
              type: ["object", "null"],
              properties: {
                audioSchedulationType: {
                  type: ["string", "null"],
                  description: "type of audio schedulation",
                  example: "NOW",
                  enum: ["NOW", "DELIVERY_AT", "REPEAT_EVERY"],
                },
                repetitions: {
                  minimum: 1,
                  type: "integer",
                  nullable: true,
                  description:
                    "number of times the audio message must be repeated each occurens. It is only used for REPEAT_EVERY type scheduling",
                  example: 1,
                },
                repeatEvery: {
                  type: "integer",
                  nullable: true,
                  description:
                    "period of time that must pass between an audio repetition and the next. This field is in seconds. It is only used for REPEAT_EVERY type scheduling",
                  example: 600,
                },
                startDateTime: {
                  type: "string",
                  nullable: true,
                  description:
                    "scheduling start date. It is only used for REPEAT_EVERY type scheduling",
                  format: "date-time",
                },
                endDateTime: {
                  type: "string",
                  nullable: true,
                  description:
                    "scheduling end date. It is only used for REPEAT_EVERY type scheduling",
                  format: "date-time",
                },
                startTime: {
                  type: "string",
                  nullable: true,
                  description:
                    "scheduling start time. It is only used for REPEAT_EVERY type scheduling",
                  format: "HH:MM",
                  example: 840,
                },
                endTime: {
                  type: "string",
                  nullable: true,
                  description:
                    "scheduling end time. It is only used for REPEAT_EVERY type scheduling",
                  format: "HH:MM",
                  example: 1020,
                },
                daysOfWeek: {
                  maxItems: 7,
                  type: "array",
                  nullable: true,
                  description:
                    "days of the week when the rule is valid. If the list is empty it is valid every day. It is only used for REPEAT_EVERY type scheduling",
                  items: {
                    type: ["string", "null"],
                    description: "Day of week",
                    enum: [
                      "SUNDAY",
                      "MONDAY",
                      "TUESDAY",
                      "WEDNESDAY",
                      "THURSDAY",
                      "FRIDAY",
                      "SATURDAY",
                    ],
                  },
                },
                deliveryAtDateTime: {
                  type: "string",
                  nullable: true,
                  description:
                    "message delivery date and time. It is only used for DELIVERY_AT type scheduling",
                  format: "date-time",
                },
              },
              description:
                "The delivery rules can be of three types: \n  - NOW the message must be delivered at the time of insertion. \n  - DELIVERY_AT the message must be delivered on the date-time _deliveryAtDateTime_. \n  - REPEAT_EVERY the message begins to be delivered from _startDateTime_ at _startTime_ to _endDateTime_ at _endTime_ evaluating the repetition conditions and _daysOfWeek_ conditions.",
            },
          },
          description:
            "audio message to deliver. This part is present if the content type is AUDIO or AUDIO_VIDEO type for a ScheduledMessage",
        },
        recipientVideoMessagesToDeliver: {
          required: ["deliveryRules", "videoTexts"],
          type: ["object", "null"],
          properties: {
            videoTexts: {
              type: "array",
              items: {
                required: ["language", "text"],
                type: ["object", "null"],
                properties: {
                  language: {
                    type: "string",
                    description: "identifies the language of the video content",
                  },
                  text: {
                    type: "string",
                  },
                },
                description: "information about video text",
              },
            },
            deliveryRules: {
              required: [
                "endDateTime",
                "startDateTime",
                "videoSchedulationType",
              ],
              type: ["object", "null"],
              properties: {
                videoSchedulationType: {
                  type: ["string", "null"],
                  description: "type of audio schedulation",
                  example: "WHEN",
                  enum: ["WHEN", "CONTINUOS_VISUALIZATION"],
                },
                startDateTime: {
                  type: "string",
                  nullable: true,
                  description: "scheduling start date",
                  format: "date-time",
                },
                endDateTime: {
                  type: "string",
                  nullable: true,
                  description: "scheduling end date",
                  format: "date-time",
                },
                startTime: {
                  type: "string",
                  nullable: true,
                  description:
                    "scheduling start time. Could be null for CONTINUOS_DELIVERY type scheduling",
                  format: "HH:MM",
                  example: 840,
                },
                endTime: {
                  type: "string",
                  nullable: true,
                  description:
                    "scheduling end time. Could be null for CONTINUOS_DELIVERY type scheduling",
                  format: "HH:MM",
                  example: 1020,
                },
                daysOfWeek: {
                  maxItems: 7,
                  type: "array",
                  nullable: true,
                  description:
                    "days of the week when the rule is valid. If the list is empty it is valid every day. It is only used for WHEN type scheduling",
                  items: {
                    type: ["string", "null"],
                    description: "Day of week",
                    enum: [
                      "SUNDAY",
                      "MONDAY",
                      "TUESDAY",
                      "WEDNESDAY",
                      "THURSDAY",
                      "FRIDAY",
                      "SATURDAY",
                    ],
                  },
                },
              },
              description:
                "The delivery rules can be of two types: \n  - WHEN the message must be delivered to the video from the _startDateTime_ date to the _endDateTime_ date only in the time interval between the _startTime_ time and _endTime_ time for each day in the _daysOfWeek_ list\n  - CONTINUOUS_VISUALIZATION the message must be delivered to the video from the _startDateTime_ date (at _startTime_ if exists) to the _endDateTime_ (at _endTime_ if exists)",
            },
          },
          description:
            "video message to deliver. This part is present if the content type is VIDEO or AUDIO_VIDEO type for a ScheduledMessage",
        },
      },
      description:
        "scheduled message to delivery at specified _deliveryPoints_. This part is present if the scheduled message must be delivered on channel ONGROUND",
    },
    OperationTypeEnum: {
      type: ["string", "null"],
      description: "type of operation performed by the user on the message",
      example: "INSERT",
      enum: ["INSERT", "UPDATE", "DELETE"],
    },
    Point: {
      required: ["id"],
      type: ["object", "null"],
      properties: {
        id: {
          type: "string",
          description:
            "**This refers to code external to Moova**. It is retrieved by invoking the SVCPLN-NetworkCode service",
          example: "LPV",
        },
        nameLong: {
          type: "string",
          nullable: true,
          example: "Milan Central FS",
        },
      },
      description: "point where to deliver the scheduled message",
    },
    RamiOperatorScheduledMessage: {
      required: [
        "creationDateTime",
        "endValidity",
        "messageId",
        "messageType",
        "messageVersion",
        "operation",
        "startValidity",
        "title",
      ],
      type: "object",
      properties: {
        messageId: {
          type: "string",
          description: "unique id of the message",
          example: "SHM20211217103239796",
        },
        messageVersion: {
          minimum: 1,
          type: "integer",
          description:
            "message versioning, it is incremented at each message update",
          example: 1,
        },
        title: {
          maxLength: 255,
          type: "string",
          description: "title of the message",
          example: "Title message",
        },
        messageType: {
          type: ["string", "null"],
          description:
            "type of the message. Indicates whether related with vehicle journey or not",
          example: "SCHEDULED_MESSAGE",
          enum: ["SCHEDULED_MESSAGE", "MONITORED_JOURNEY_SCHEDULED_MESSAGE"],
        },
        operation: {
          type: ["string", "null"],
          description: "type of operation performed by the user on the message",
          example: "INSERT",
          enum: ["INSERT", "UPDATE", "DELETE"],
        },
        creationDateTime: {
          type: "string",
          description: "datetime, in UTC ISO8601, creation date time",
          format: "date-time",
        },
        startValidity: {
          type: "string",
          description: "datetime, in UTC ISO8601, start validity",
          format: "date-time",
        },
        endValidity: {
          type: "string",
          description: "datetime, in UTC ISO8601, end validity",
          format: "date-time",
        },
        scheduledMessage: {
          required: ["deliveryChannels"],
          type: ["object", "null"],
          properties: {
            situations: {
              nullable: true,
              type: "array",
              items: {
                type: ["object", "null"],
                properties: {
                  id: {
                    type: "string",
                  },
                  name: {
                    type: "string",
                  },
                },
                description:
                  "a Scheduled message optionally can be related to a situation (SIRI)",
              },
            },
            deliveryChannels: {
              nullable: true,
              type: "array",
              items: {
                type: ["string", "null"],
                description:
                  "channel on which the message is delivered. EXTERNAL is not used for MonitoredJourneyScheduledMessage",
                example: "ONGROUND",
                enum: ["ONGROUND", "ONBOARD", "EXTERNAL"],
              },
            },
            onGroundRecipient: {
              required: ["deliveryPoints", "messageContentType"],
              type: ["object", "null"],
              properties: {
                messageContentType: {
                  type: ["string", "null"],
                  description: "message content type",
                  example: "AUDIO",
                  enum: ["AUDIO", "VIDEO", "AUDIO_VIDEO"],
                },
                deliveryPoints: {
                  type: "array",
                  items: {
                    required: ["id"],
                    type: ["object", "null"],
                    properties: {
                      id: {
                        type: "string",
                        description:
                          "**This refers to code external to Moova**. It is retrieved by invoking the SVCPLN-NetworkCode service",
                        example: "LPV",
                      },
                      nameLong: {
                        type: "string",
                        nullable: true,
                        example: "Milan Central FS",
                      },
                    },
                    description: "point where to deliver the scheduled message",
                  },
                },
                recipientAudioMessagesToDeliver: {
                  required: ["audioContentType", "scheduledAudioDeliveryRules"],
                  type: ["object", "null"],
                  properties: {
                    audioContentType: {
                      type: ["string", "null"],
                      description: "type of audio content",
                      example: "AUDIO_TEXT",
                      enum: ["AUDIO_TEXT", "AUDIO_FILE"],
                    },
                    audioText: {
                      type: "array",
                      nullable: true,
                      items: {
                        required: ["language", "text"],
                        type: ["object", "null"],
                        properties: {
                          language: {
                            type: "string",
                            description:
                              "identifies the language of the audio content",
                            example: "en_GB",
                          },
                          text: {
                            type: "string",
                            description: "audio text used for tts system",
                          },
                        },
                        description:
                          "information about audio text. This part is present if the audio content type is AUDIO_TEXT",
                      },
                    },
                    media: {
                      type: "string",
                      nullable: true,
                      description:
                        "used only for audio file, in this case audio content type is AUDIO_FILE",
                      format: "byte",
                    },
                    scheduledAudioDeliveryRules: {
                      required: ["audioSchedulationType"],
                      type: ["object", "null"],
                      properties: {
                        audioSchedulationType: {
                          type: ["string", "null"],
                          description: "type of audio schedulation",
                          example: "NOW",
                          enum: ["NOW", "DELIVERY_AT", "REPEAT_EVERY"],
                        },
                        repetitions: {
                          minimum: 1,
                          type: "integer",
                          nullable: true,
                          description:
                            "number of times the audio message must be repeated each occurens. It is only used for REPEAT_EVERY type scheduling",
                          example: 1,
                        },
                        repeatEvery: {
                          type: "integer",
                          nullable: true,
                          description:
                            "period of time that must pass between an audio repetition and the next. This field is in seconds. It is only used for REPEAT_EVERY type scheduling",
                          example: 600,
                        },
                        startDateTime: {
                          type: "string",
                          nullable: true,
                          description:
                            "scheduling start date. It is only used for REPEAT_EVERY type scheduling",
                          format: "date-time",
                        },
                        endDateTime: {
                          type: "string",
                          nullable: true,
                          description:
                            "scheduling end date. It is only used for REPEAT_EVERY type scheduling",
                          format: "date-time",
                        },
                        startTime: {
                          type: "string",
                          nullable: true,
                          description:
                            "scheduling start time. It is only used for REPEAT_EVERY type scheduling",
                          format: "HH:MM",
                          example: 840,
                        },
                        endTime: {
                          type: "string",
                          nullable: true,
                          description:
                            "scheduling end time. It is only used for REPEAT_EVERY type scheduling",
                          format: "HH:MM",
                          example: 1020,
                        },
                        daysOfWeek: {
                          maxItems: 7,
                          type: "array",
                          nullable: true,
                          description:
                            "days of the week when the rule is valid. If the list is empty it is valid every day. It is only used for REPEAT_EVERY type scheduling",
                          items: {
                            type: ["string", "null"],
                            description: "Day of week",
                            enum: [
                              "SUNDAY",
                              "MONDAY",
                              "TUESDAY",
                              "WEDNESDAY",
                              "THURSDAY",
                              "FRIDAY",
                              "SATURDAY",
                            ],
                          },
                        },
                        deliveryAtDateTime: {
                          type: "string",
                          nullable: true,
                          description:
                            "message delivery date and time. It is only used for DELIVERY_AT type scheduling",
                          format: "date-time",
                        },
                      },
                      description:
                        "The delivery rules can be of three types: \n  - NOW the message must be delivered at the time of insertion. \n  - DELIVERY_AT the message must be delivered on the date-time _deliveryAtDateTime_. \n  - REPEAT_EVERY the message begins to be delivered from _startDateTime_ at _startTime_ to _endDateTime_ at _endTime_ evaluating the repetition conditions and _daysOfWeek_ conditions.",
                    },
                  },
                  description:
                    "audio message to deliver. This part is present if the content type is AUDIO or AUDIO_VIDEO type for a ScheduledMessage",
                },
                recipientVideoMessagesToDeliver: {
                  required: ["deliveryRules", "videoTexts"],
                  type: ["object", "null"],
                  properties: {
                    videoTexts: {
                      type: "array",
                      items: {
                        required: ["language", "text"],
                        type: ["object", "null"],
                        properties: {
                          language: {
                            type: "string",
                            description:
                              "identifies the language of the video content",
                          },
                          text: {
                            type: "string",
                          },
                        },
                        description: "information about video text",
                      },
                    },
                    deliveryRules: {
                      required: [
                        "endDateTime",
                        "startDateTime",
                        "videoSchedulationType",
                      ],
                      type: ["object", "null"],
                      properties: {
                        videoSchedulationType: {
                          type: ["string", "null"],
                          description: "type of audio schedulation",
                          example: "WHEN",
                          enum: ["WHEN", "CONTINUOS_VISUALIZATION"],
                        },
                        startDateTime: {
                          type: "string",
                          nullable: true,
                          description: "scheduling start date",
                          format: "date-time",
                        },
                        endDateTime: {
                          type: "string",
                          nullable: true,
                          description: "scheduling end date",
                          format: "date-time",
                        },
                        startTime: {
                          type: "string",
                          nullable: true,
                          description:
                            "scheduling start time. Could be null for CONTINUOS_DELIVERY type scheduling",
                          format: "HH:MM",
                          example: 840,
                        },
                        endTime: {
                          type: "string",
                          nullable: true,
                          description:
                            "scheduling end time. Could be null for CONTINUOS_DELIVERY type scheduling",
                          format: "HH:MM",
                          example: 1020,
                        },
                        daysOfWeek: {
                          maxItems: 7,
                          type: "array",
                          nullable: true,
                          description:
                            "days of the week when the rule is valid. If the list is empty it is valid every day. It is only used for WHEN type scheduling",
                          items: {
                            type: ["string", "null"],
                            description: "Day of week",
                            enum: [
                              "SUNDAY",
                              "MONDAY",
                              "TUESDAY",
                              "WEDNESDAY",
                              "THURSDAY",
                              "FRIDAY",
                              "SATURDAY",
                            ],
                          },
                        },
                      },
                      description:
                        "The delivery rules can be of two types: \n  - WHEN the message must be delivered to the video from the _startDateTime_ date to the _endDateTime_ date only in the time interval between the _startTime_ time and _endTime_ time for each day in the _daysOfWeek_ list\n  - CONTINUOUS_VISUALIZATION the message must be delivered to the video from the _startDateTime_ date (at _startTime_ if exists) to the _endDateTime_ (at _endTime_ if exists)",
                    },
                  },
                  description:
                    "video message to deliver. This part is present if the content type is VIDEO or AUDIO_VIDEO type for a ScheduledMessage",
                },
              },
              description:
                "scheduled message to delivery at specified _deliveryPoints_. This part is present if the scheduled message must be delivered on channel ONGROUND",
            },
            onBoardRecipient: {
              required: ["messageContentType", "vehicleJourneys"],
              type: ["object", "null"],
              properties: {
                messageContentType: {
                  type: ["string", "null"],
                  description: "message content type",
                  example: "AUDIO",
                  enum: ["AUDIO", "VIDEO", "AUDIO_VIDEO"],
                },
                vehicleJourneys: {
                  type: "array",
                  items: {
                    required: [
                      "dataFrameRef",
                      "datedVehicleJourneyRef",
                      "vehicleJourneyName",
                    ],
                    type: ["object", "null"],
                    properties: {
                      datedVehicleJourneyRef: {
                        type: "string",
                        description: "id of vehicle journey",
                      },
                      dataFrameRef: {
                        type: "string",
                        description:
                          "unique identifier of data frame within participant service",
                      },
                      vehicleJourneyName: {
                        type: "string",
                        description: "name of vehicle journey",
                      },
                    },
                    description: "vehicle journey identifiers information",
                  },
                },
                recipientAudioMessagesToDeliver: {
                  required: ["audioContentType", "scheduledAudioDeliveryRules"],
                  type: ["object", "null"],
                  properties: {
                    audioContentType: {
                      type: ["string", "null"],
                      description: "type of audio content",
                      example: "AUDIO_TEXT",
                      enum: ["AUDIO_TEXT", "AUDIO_FILE"],
                    },
                    audioText: {
                      type: "array",
                      nullable: true,
                      items: {
                        required: ["language", "text"],
                        type: ["object", "null"],
                        properties: {
                          language: {
                            type: "string",
                            description:
                              "identifies the language of the audio content",
                            example: "en_GB",
                          },
                          text: {
                            type: "string",
                            description: "audio text used for tts system",
                          },
                        },
                        description:
                          "information about audio text. This part is present if the audio content type is AUDIO_TEXT",
                      },
                    },
                    media: {
                      type: "string",
                      nullable: true,
                      description:
                        "used only for audio file, in this case audio content type is AUDIO_FILE",
                      format: "byte",
                    },
                    scheduledAudioDeliveryRules: {
                      required: ["audioSchedulationType"],
                      type: ["object", "null"],
                      properties: {
                        audioSchedulationType: {
                          type: ["string", "null"],
                          description: "type of audio schedulation",
                          example: "NOW",
                          enum: ["NOW", "DELIVERY_AT", "REPEAT_EVERY"],
                        },
                        repetitions: {
                          minimum: 1,
                          type: "integer",
                          nullable: true,
                          description:
                            "number of times the audio message must be repeated each occurens. It is only used for REPEAT_EVERY type scheduling",
                          example: 1,
                        },
                        repeatEvery: {
                          type: "integer",
                          nullable: true,
                          description:
                            "period of time that must pass between an audio repetition and the next. This field is in seconds. It is only used for REPEAT_EVERY type scheduling",
                          example: 600,
                        },
                        startDateTime: {
                          type: "string",
                          nullable: true,
                          description:
                            "scheduling start date. It is only used for REPEAT_EVERY type scheduling",
                          format: "date-time",
                        },
                        endDateTime: {
                          type: "string",
                          nullable: true,
                          description:
                            "scheduling end date. It is only used for REPEAT_EVERY type scheduling",
                          format: "date-time",
                        },
                        startTime: {
                          type: "string",
                          nullable: true,
                          description:
                            "scheduling start time. It is only used for REPEAT_EVERY type scheduling",
                          format: "HH:MM",
                          example: 840,
                        },
                        endTime: {
                          type: "string",
                          nullable: true,
                          description:
                            "scheduling end time. It is only used for REPEAT_EVERY type scheduling",
                          format: "HH:MM",
                          example: 1020,
                        },
                        daysOfWeek: {
                          maxItems: 7,
                          type: "array",
                          nullable: true,
                          description:
                            "days of the week when the rule is valid. If the list is empty it is valid every day. It is only used for REPEAT_EVERY type scheduling",
                          items: {
                            type: ["string", "null"],
                            description: "Day of week",
                            enum: [
                              "SUNDAY",
                              "MONDAY",
                              "TUESDAY",
                              "WEDNESDAY",
                              "THURSDAY",
                              "FRIDAY",
                              "SATURDAY",
                            ],
                          },
                        },
                        deliveryAtDateTime: {
                          type: "string",
                          nullable: true,
                          description:
                            "message delivery date and time. It is only used for DELIVERY_AT type scheduling",
                          format: "date-time",
                        },
                      },
                      description:
                        "The delivery rules can be of three types: \n  - NOW the message must be delivered at the time of insertion. \n  - DELIVERY_AT the message must be delivered on the date-time _deliveryAtDateTime_. \n  - REPEAT_EVERY the message begins to be delivered from _startDateTime_ at _startTime_ to _endDateTime_ at _endTime_ evaluating the repetition conditions and _daysOfWeek_ conditions.",
                    },
                  },
                  description:
                    "audio message to deliver. This part is present if the content type is AUDIO or AUDIO_VIDEO type for a ScheduledMessage",
                },
                recipientVideoMessagesToDeliver: {
                  required: ["deliveryRules", "videoTexts"],
                  type: ["object", "null"],
                  properties: {
                    videoTexts: {
                      type: "array",
                      items: {
                        required: ["language", "text"],
                        type: ["object", "null"],
                        properties: {
                          language: {
                            type: "string",
                            description:
                              "identifies the language of the video content",
                          },
                          text: {
                            type: "string",
                          },
                        },
                        description: "information about video text",
                      },
                    },
                    deliveryRules: {
                      required: [
                        "endDateTime",
                        "startDateTime",
                        "videoSchedulationType",
                      ],
                      type: ["object", "null"],
                      properties: {
                        videoSchedulationType: {
                          type: ["string", "null"],
                          description: "type of audio schedulation",
                          example: "WHEN",
                          enum: ["WHEN", "CONTINUOS_VISUALIZATION"],
                        },
                        startDateTime: {
                          type: "string",
                          nullable: true,
                          description: "scheduling start date",
                          format: "date-time",
                        },
                        endDateTime: {
                          type: "string",
                          nullable: true,
                          description: "scheduling end date",
                          format: "date-time",
                        },
                        startTime: {
                          type: "string",
                          nullable: true,
                          description:
                            "scheduling start time. Could be null for CONTINUOS_DELIVERY type scheduling",
                          format: "HH:MM",
                          example: 840,
                        },
                        endTime: {
                          type: "string",
                          nullable: true,
                          description:
                            "scheduling end time. Could be null for CONTINUOS_DELIVERY type scheduling",
                          format: "HH:MM",
                          example: 1020,
                        },
                        daysOfWeek: {
                          maxItems: 7,
                          type: "array",
                          nullable: true,
                          description:
                            "days of the week when the rule is valid. If the list is empty it is valid every day. It is only used for WHEN type scheduling",
                          items: {
                            type: ["string", "null"],
                            description: "Day of week",
                            enum: [
                              "SUNDAY",
                              "MONDAY",
                              "TUESDAY",
                              "WEDNESDAY",
                              "THURSDAY",
                              "FRIDAY",
                              "SATURDAY",
                            ],
                          },
                        },
                      },
                      description:
                        "The delivery rules can be of two types: \n  - WHEN the message must be delivered to the video from the _startDateTime_ date to the _endDateTime_ date only in the time interval between the _startTime_ time and _endTime_ time for each day in the _daysOfWeek_ list\n  - CONTINUOUS_VISUALIZATION the message must be delivered to the video from the _startDateTime_ date (at _startTime_ if exists) to the _endDateTime_ (at _endTime_ if exists)",
                    },
                  },
                  description:
                    "video message to deliver. This part is present if the content type is VIDEO or AUDIO_VIDEO type for a ScheduledMessage",
                },
              },
              description:
                "scheduled message to delivery at specified _vehicleJourneys_. This part is present if the scheduled message must be delivered on channel ONBOARD",
            },
            externalSystemRecipient: {
              required: ["messageContents"],
              type: ["object", "null"],
              properties: {
                messageContents: {
                  type: "array",
                  items: {
                    required: ["language", "text"],
                    type: ["object", "null"],
                    properties: {
                      language: {
                        type: "string",
                        description:
                          "identifies the language of the external content",
                      },
                      text: {
                        type: "string",
                      },
                    },
                    description: "information about external text",
                  },
                },
                externalPoints: {
                  nullable: true,
                  type: "array",
                  items: {
                    required: ["id"],
                    type: ["object", "null"],
                    properties: {
                      id: {
                        type: "string",
                        description:
                          "**This refers to code external to Moova**. It is retrieved by invoking the SVCPLN-NetworkCode service",
                        example: "LPV",
                      },
                      nameLong: {
                        type: "string",
                        nullable: true,
                        example: "Milan Central FS",
                      },
                    },
                    description: "point where to deliver the scheduled message",
                  },
                },
                startDateTime: {
                  type: "string",
                  nullable: true,
                  description: "scheduling start date-time",
                  format: "date-time",
                },
                endDateTime: {
                  nullable: true,
                  type: "string",
                  description: "scheduling end date-time",
                  format: "date-time",
                },
              },
              description:
                "scheduled message to delivery to external system. It can delivered to _externalPoints_. This part is present if the scheduled message must be delivered on channel EXTERNAL",
            },
          },
          description:
            "it is filled only if the message is of type SCHEDULED_MESSAGE. The scheduled message can be delivered through one or more channels: ONGROUND, ONBOARD or EXTERNAL",
        },
        monitoredJourneyScheduledMessage: {
          required: ["deliveryPoints", "messageContentType", "vehicleJourney"],
          type: ["object", "null"],
          properties: {
            vehicleJourney: {
              required: [
                "dataFrameRef",
                "datedVehicleJourneyRef",
                "vehicleJourneyName",
              ],
              type: ["object", "null"],
              properties: {
                datedVehicleJourneyRef: {
                  type: "string",
                  description: "id of vehicle journey",
                },
                dataFrameRef: {
                  type: "string",
                  description:
                    "unique identifier of data frame within participant service",
                },
                vehicleJourneyName: {
                  type: "string",
                  description: "name of vehicle journey",
                },
              },
              description: "vehicle journey identifiers information",
            },
            messageContentType: {
              type: ["string", "null"],
              description: "message content type",
              example: "AUDIO",
              enum: ["AUDIO", "VIDEO", "AUDIO_VIDEO"],
            },
            deliveryPoints: {
              type: "array",
              items: {
                required: ["id"],
                type: ["object", "null"],
                properties: {
                  id: {
                    type: "string",
                    description:
                      "**This refers to code external to Moova**. It is retrieved by invoking the SVCPLN-NetworkCode service",
                    example: "LPV",
                  },
                  nameLong: {
                    type: "string",
                    nullable: true,
                    example: "Milan Central FS",
                  },
                },
                description: "point where to deliver the scheduled message",
              },
            },
            audioMessageContents: {
              required: ["audioTexts", "deliveryRules", "deliveryType"],
              type: ["object", "null"],
              properties: {
                audioTexts: {
                  type: "array",
                  description: "list of audio message text",
                  items: {
                    required: ["audioText", "language"],
                    type: ["object", "null"],
                    properties: {
                      language: {
                        type: "string",
                        description: "identifies the language of the content",
                        example: "en_GB",
                      },
                      audioText: {
                        type: "string",
                        description: "audio text used for tts system",
                      },
                    },
                    description:
                      "audio message content to be delivered for monitored journey scheduled message",
                  },
                },
                deliveryRules: {
                  type: ["object", "null"],
                  properties: {
                    repetitions: {
                      type: "integer",
                      nullable: true,
                    },
                    repeatEvery: {
                      type: "integer",
                      nullable: true,
                    },
                    scheduledArrival: {
                      type: "boolean",
                      nullable: true,
                    },
                    scheduledDeparture: {
                      type: "boolean",
                      nullable: true,
                    },
                    estimatedArrival: {
                      type: "boolean",
                      nullable: true,
                    },
                    estimatedDeparture: {
                      type: "boolean",
                      nullable: true,
                    },
                    eventType: {
                      type: ["string", "null"],
                      description:
                        "one of the event for messages to deliver on board ARRIVING DEPARTING ARRIVED DEPARTED\n  ",
                    },
                  },
                  description:
                    "Delivery Rule for monitored journey scheduled message",
                },
                deliveryType: {
                  type: ["string", "null"],
                  description:
                    "delivery type of message associated with vehicle journeys",
                  enum: ["ON_EVENT", "ON_SCHEDULE", null],
                },
              },
              description:
                "audio message content to be delivered for monitored journey scheduled message with delivery rules.\nAudio messages can be delivered in three delivery types specified in the _deliveryType_ field: \n- ON_EVENT the message is delivered for vehicle journey when that vehicle journey generates a specified event for a defined Point in _deliveryPoints_ (e.g. ARRIVING)\n- ON_SCHEDULE the message is delivered on a specific vehicle journey scheduling date happens for a defined Point in _deliveryPoints_ (e.g. estimated arrival time)",
            },
            videoTexts: {
              type: "array",
              nullable: true,
              description: "list of video message for vehicle journey",
              items: {
                required: ["language", "videoText"],
                type: ["object", "null"],
                properties: {
                  language: {
                    type: "string",
                    description: "identifies the language of the content",
                    example: "en_GB",
                  },
                  videoText: {
                    type: "string",
                    description: "audio text used for tts system",
                  },
                },
                description:
                  "video message content to be delivered for monitored journey scheduled message",
              },
            },
          },
          description:
            "is filled only if the message is of type MONITORED_JOURNEY_SCHEDULED_MESSAGE",
        },
      },
      description:
        "Object containing the information of a scheduled message inserted by an operator",
    },
    RamiOperatorScheduledMessageKafka: {
      required: ["headers", "payload"],
      type: "object",
      properties: {
        headers: {
          required: ["e2eId", "eventType", "recordedAtTime", "source"],
          type: "object",
          properties: {
            e2eId: {
              type: "string",
              description:
                "Correlational event unique identifier for logging and instrumentation",
              format: "uuid",
              example: "c45c7f92-5f96-4059-b0b3-20295388e4f6",
            },
            organisation: {
              type: "string",
              description: "Data Type for Identifier of an OrganisationCode.",
              example: "MOOVA",
            },
            source: {
              type: "string",
              description: "Module identifier that publishes the message",
              example: "scheduledmessagepublisher-adapter",
            },
            partitionKey: {
              type: ["string", "null"],
              description:
                "kafka partition key where the message is sent in the specific topic. The message id is used",
            },
            eventType: {
              type: ["string", "null"],
              description: "Type of event",
              example: "RamiOperatorScheduledMessage",
            },
            recordedAtTime: {
              type: "string",
              description: "Registration date",
              format: "date-time",
            },
          },
          description: "Mandatory header of the message",
        },
        payload: {
          required: [
            "creationDateTime",
            "endValidity",
            "messageId",
            "messageType",
            "messageVersion",
            "operation",
            "startValidity",
            "title",
          ],
          type: "object",
          properties: {
            messageId: {
              type: "string",
              description: "unique id of the message",
              example: "SHM20211217103239796",
            },
            messageVersion: {
              minimum: 1,
              type: "integer",
              description:
                "message versioning, it is incremented at each message update",
              example: 1,
            },
            title: {
              maxLength: 255,
              type: "string",
              description: "title of the message",
              example: "Title message",
            },
            messageType: {
              type: ["string", "null"],
              description:
                "type of the message. Indicates whether related with vehicle journey or not",
              example: "SCHEDULED_MESSAGE",
              enum: [
                "SCHEDULED_MESSAGE",
                "MONITORED_JOURNEY_SCHEDULED_MESSAGE",
              ],
            },
            operation: {
              type: ["string", "null"],
              description:
                "type of operation performed by the user on the message",
              example: "INSERT",
              enum: ["INSERT", "UPDATE", "DELETE"],
            },
            creationDateTime: {
              type: "string",
              description: "datetime, in UTC ISO8601, creation date time",
              format: "date-time",
            },
            startValidity: {
              type: "string",
              description: "datetime, in UTC ISO8601, start validity",
              format: "date-time",
            },
            endValidity: {
              type: "string",
              description: "datetime, in UTC ISO8601, end validity",
              format: "date-time",
            },
            scheduledMessage: {
              required: ["deliveryChannels"],
              type: ["object", "null"],
              properties: {
                situations: {
                  nullable: true,
                  type: "array",
                  items: {
                    type: ["object", "null"],
                    properties: {
                      id: {
                        type: "string",
                      },
                      name: {
                        type: "string",
                      },
                    },
                    description:
                      "a Scheduled message optionally can be related to a situation (SIRI)",
                  },
                },
                deliveryChannels: {
                  nullable: true,
                  type: "array",
                  items: {
                    type: ["string", "null"],
                    description:
                      "channel on which the message is delivered. EXTERNAL is not used for MonitoredJourneyScheduledMessage",
                    example: "ONGROUND",
                    enum: ["ONGROUND", "ONBOARD", "EXTERNAL"],
                  },
                },
                onGroundRecipient: {
                  required: ["deliveryPoints", "messageContentType"],
                  type: ["object", "null"],
                  properties: {
                    messageContentType: {
                      type: ["string", "null"],
                      description: "message content type",
                      example: "AUDIO",
                      enum: ["AUDIO", "VIDEO", "AUDIO_VIDEO"],
                    },
                    deliveryPoints: {
                      type: "array",
                      items: {
                        required: ["id"],
                        type: ["object", "null"],
                        properties: {
                          id: {
                            type: "string",
                            description:
                              "**This refers to code external to Moova**. It is retrieved by invoking the SVCPLN-NetworkCode service",
                            example: "LPV",
                          },
                          nameLong: {
                            type: "string",
                            nullable: true,
                            example: "Milan Central FS",
                          },
                        },
                        description:
                          "point where to deliver the scheduled message",
                      },
                    },
                    recipientAudioMessagesToDeliver: {
                      required: [
                        "audioContentType",
                        "scheduledAudioDeliveryRules",
                      ],
                      type: ["object", "null"],
                      properties: {
                        audioContentType: {
                          type: ["string", "null"],
                          description: "type of audio content",
                          example: "AUDIO_TEXT",
                          enum: ["AUDIO_TEXT", "AUDIO_FILE"],
                        },
                        audioText: {
                          type: "array",
                          nullable: true,
                          items: {
                            required: ["language", "text"],
                            type: ["object", "null"],
                            properties: {
                              language: {
                                type: "string",
                                description:
                                  "identifies the language of the audio content",
                                example: "en_GB",
                              },
                              text: {
                                type: "string",
                                description: "audio text used for tts system",
                              },
                            },
                            description:
                              "information about audio text. This part is present if the audio content type is AUDIO_TEXT",
                          },
                        },
                        media: {
                          type: "string",
                          nullable: true,
                          description:
                            "used only for audio file, in this case audio content type is AUDIO_FILE",
                          format: "byte",
                        },
                        scheduledAudioDeliveryRules: {
                          required: ["audioSchedulationType"],
                          type: ["object", "null"],
                          properties: {
                            audioSchedulationType: {
                              type: ["string", "null"],
                              description: "type of audio schedulation",
                              example: "NOW",
                              enum: ["NOW", "DELIVERY_AT", "REPEAT_EVERY"],
                            },
                            repetitions: {
                              minimum: 1,
                              type: "integer",
                              nullable: true,
                              description:
                                "number of times the audio message must be repeated each occurens. It is only used for REPEAT_EVERY type scheduling",
                              example: 1,
                            },
                            repeatEvery: {
                              type: "integer",
                              nullable: true,
                              description:
                                "period of time that must pass between an audio repetition and the next. This field is in seconds. It is only used for REPEAT_EVERY type scheduling",
                              example: 600,
                            },
                            startDateTime: {
                              type: "string",
                              nullable: true,
                              description:
                                "scheduling start date. It is only used for REPEAT_EVERY type scheduling",
                              format: "date-time",
                            },
                            endDateTime: {
                              type: "string",
                              nullable: true,
                              description:
                                "scheduling end date. It is only used for REPEAT_EVERY type scheduling",
                              format: "date-time",
                            },
                            startTime: {
                              type: "string",
                              nullable: true,
                              description:
                                "scheduling start time. It is only used for REPEAT_EVERY type scheduling",
                              format: "HH:MM",
                              example: 840,
                            },
                            endTime: {
                              type: "string",
                              nullable: true,
                              description:
                                "scheduling end time. It is only used for REPEAT_EVERY type scheduling",
                              format: "HH:MM",
                              example: 1020,
                            },
                            daysOfWeek: {
                              maxItems: 7,
                              type: "array",
                              nullable: true,
                              description:
                                "days of the week when the rule is valid. If the list is empty it is valid every day. It is only used for REPEAT_EVERY type scheduling",
                              items: {
                                type: ["string", "null"],
                                description: "Day of week",
                                enum: [
                                  "SUNDAY",
                                  "MONDAY",
                                  "TUESDAY",
                                  "WEDNESDAY",
                                  "THURSDAY",
                                  "FRIDAY",
                                  "SATURDAY",
                                ],
                              },
                            },
                            deliveryAtDateTime: {
                              type: "string",
                              nullable: true,
                              description:
                                "message delivery date and time. It is only used for DELIVERY_AT type scheduling",
                              format: "date-time",
                            },
                          },
                          description:
                            "The delivery rules can be of three types: \n  - NOW the message must be delivered at the time of insertion. \n  - DELIVERY_AT the message must be delivered on the date-time _deliveryAtDateTime_. \n  - REPEAT_EVERY the message begins to be delivered from _startDateTime_ at _startTime_ to _endDateTime_ at _endTime_ evaluating the repetition conditions and _daysOfWeek_ conditions.",
                        },
                      },
                      description:
                        "audio message to deliver. This part is present if the content type is AUDIO or AUDIO_VIDEO type for a ScheduledMessage",
                    },
                    recipientVideoMessagesToDeliver: {
                      required: ["deliveryRules", "videoTexts"],
                      type: ["object", "null"],
                      properties: {
                        videoTexts: {
                          type: "array",
                          items: {
                            required: ["language", "text"],
                            type: ["object", "null"],
                            properties: {
                              language: {
                                type: "string",
                                description:
                                  "identifies the language of the video content",
                              },
                              text: {
                                type: "string",
                              },
                            },
                            description: "information about video text",
                          },
                        },
                        deliveryRules: {
                          required: [
                            "endDateTime",
                            "startDateTime",
                            "videoSchedulationType",
                          ],
                          type: ["object", "null"],
                          properties: {
                            videoSchedulationType: {
                              type: ["string", "null"],
                              description: "type of audio schedulation",
                              example: "WHEN",
                              enum: ["WHEN", "CONTINUOS_VISUALIZATION"],
                            },
                            startDateTime: {
                              type: "string",
                              nullable: true,
                              description: "scheduling start date",
                              format: "date-time",
                            },
                            endDateTime: {
                              type: "string",
                              nullable: true,
                              description: "scheduling end date",
                              format: "date-time",
                            },
                            startTime: {
                              type: "string",
                              nullable: true,
                              description:
                                "scheduling start time. Could be null for CONTINUOS_DELIVERY type scheduling",
                              format: "HH:MM",
                              example: 840,
                            },
                            endTime: {
                              type: "string",
                              nullable: true,
                              description:
                                "scheduling end time. Could be null for CONTINUOS_DELIVERY type scheduling",
                              format: "HH:MM",
                              example: 1020,
                            },
                            daysOfWeek: {
                              maxItems: 7,
                              type: "array",
                              nullable: true,
                              description:
                                "days of the week when the rule is valid. If the list is empty it is valid every day. It is only used for WHEN type scheduling",
                              items: {
                                type: ["string", "null"],
                                description: "Day of week",
                                enum: [
                                  "SUNDAY",
                                  "MONDAY",
                                  "TUESDAY",
                                  "WEDNESDAY",
                                  "THURSDAY",
                                  "FRIDAY",
                                  "SATURDAY",
                                ],
                              },
                            },
                          },
                          description:
                            "The delivery rules can be of two types: \n  - WHEN the message must be delivered to the video from the _startDateTime_ date to the _endDateTime_ date only in the time interval between the _startTime_ time and _endTime_ time for each day in the _daysOfWeek_ list\n  - CONTINUOUS_VISUALIZATION the message must be delivered to the video from the _startDateTime_ date (at _startTime_ if exists) to the _endDateTime_ (at _endTime_ if exists)",
                        },
                      },
                      description:
                        "video message to deliver. This part is present if the content type is VIDEO or AUDIO_VIDEO type for a ScheduledMessage",
                    },
                  },
                  description:
                    "scheduled message to delivery at specified _deliveryPoints_. This part is present if the scheduled message must be delivered on channel ONGROUND",
                },
                onBoardRecipient: {
                  required: ["messageContentType", "vehicleJourneys"],
                  type: ["object", "null"],
                  properties: {
                    messageContentType: {
                      type: ["string", "null"],
                      description: "message content type",
                      example: "AUDIO",
                      enum: ["AUDIO", "VIDEO", "AUDIO_VIDEO"],
                    },
                    vehicleJourneys: {
                      type: "array",
                      items: {
                        required: [
                          "dataFrameRef",
                          "datedVehicleJourneyRef",
                          "vehicleJourneyName",
                        ],
                        type: ["object", "null"],
                        properties: {
                          datedVehicleJourneyRef: {
                            type: "string",
                            description: "id of vehicle journey",
                          },
                          dataFrameRef: {
                            type: "string",
                            description:
                              "unique identifier of data frame within participant service",
                          },
                          vehicleJourneyName: {
                            type: "string",
                            description: "name of vehicle journey",
                          },
                        },
                        description: "vehicle journey identifiers information",
                      },
                    },
                    recipientAudioMessagesToDeliver: {
                      required: [
                        "audioContentType",
                        "scheduledAudioDeliveryRules",
                      ],
                      type: ["object", "null"],
                      properties: {
                        audioContentType: {
                          type: ["string", "null"],
                          description: "type of audio content",
                          example: "AUDIO_TEXT",
                          enum: ["AUDIO_TEXT", "AUDIO_FILE"],
                        },
                        audioText: {
                          type: "array",
                          nullable: true,
                          items: {
                            required: ["language", "text"],
                            type: ["object", "null"],
                            properties: {
                              language: {
                                type: "string",
                                description:
                                  "identifies the language of the audio content",
                                example: "en_GB",
                              },
                              text: {
                                type: "string",
                                description: "audio text used for tts system",
                              },
                            },
                            description:
                              "information about audio text. This part is present if the audio content type is AUDIO_TEXT",
                          },
                        },
                        media: {
                          type: "string",
                          nullable: true,
                          description:
                            "used only for audio file, in this case audio content type is AUDIO_FILE",
                          format: "byte",
                        },
                        scheduledAudioDeliveryRules: {
                          required: ["audioSchedulationType"],
                          type: ["object", "null"],
                          properties: {
                            audioSchedulationType: {
                              type: ["string", "null"],
                              description: "type of audio schedulation",
                              example: "NOW",
                              enum: ["NOW", "DELIVERY_AT", "REPEAT_EVERY"],
                            },
                            repetitions: {
                              minimum: 1,
                              type: "integer",
                              nullable: true,
                              description:
                                "number of times the audio message must be repeated each occurens. It is only used for REPEAT_EVERY type scheduling",
                              example: 1,
                            },
                            repeatEvery: {
                              type: "integer",
                              nullable: true,
                              description:
                                "period of time that must pass between an audio repetition and the next. This field is in seconds. It is only used for REPEAT_EVERY type scheduling",
                              example: 600,
                            },
                            startDateTime: {
                              type: "string",
                              nullable: true,
                              description:
                                "scheduling start date. It is only used for REPEAT_EVERY type scheduling",
                              format: "date-time",
                            },
                            endDateTime: {
                              type: "string",
                              nullable: true,
                              description:
                                "scheduling end date. It is only used for REPEAT_EVERY type scheduling",
                              format: "date-time",
                            },
                            startTime: {
                              type: "string",
                              nullable: true,
                              description:
                                "scheduling start time. It is only used for REPEAT_EVERY type scheduling",
                              format: "HH:MM",
                              example: 840,
                            },
                            endTime: {
                              type: "string",
                              nullable: true,
                              description:
                                "scheduling end time. It is only used for REPEAT_EVERY type scheduling",
                              format: "HH:MM",
                              example: 1020,
                            },
                            daysOfWeek: {
                              maxItems: 7,
                              type: "array",
                              nullable: true,
                              description:
                                "days of the week when the rule is valid. If the list is empty it is valid every day. It is only used for REPEAT_EVERY type scheduling",
                              items: {
                                type: ["string", "null"],
                                description: "Day of week",
                                enum: [
                                  "SUNDAY",
                                  "MONDAY",
                                  "TUESDAY",
                                  "WEDNESDAY",
                                  "THURSDAY",
                                  "FRIDAY",
                                  "SATURDAY",
                                ],
                              },
                            },
                            deliveryAtDateTime: {
                              type: "string",
                              nullable: true,
                              description:
                                "message delivery date and time. It is only used for DELIVERY_AT type scheduling",
                              format: "date-time",
                            },
                          },
                          description:
                            "The delivery rules can be of three types: \n  - NOW the message must be delivered at the time of insertion. \n  - DELIVERY_AT the message must be delivered on the date-time _deliveryAtDateTime_. \n  - REPEAT_EVERY the message begins to be delivered from _startDateTime_ at _startTime_ to _endDateTime_ at _endTime_ evaluating the repetition conditions and _daysOfWeek_ conditions.",
                        },
                      },
                      description:
                        "audio message to deliver. This part is present if the content type is AUDIO or AUDIO_VIDEO type for a ScheduledMessage",
                    },
                    recipientVideoMessagesToDeliver: {
                      required: ["deliveryRules", "videoTexts"],
                      type: ["object", "null"],
                      properties: {
                        videoTexts: {
                          type: "array",
                          items: {
                            required: ["language", "text"],
                            type: ["object", "null"],
                            properties: {
                              language: {
                                type: "string",
                                description:
                                  "identifies the language of the video content",
                              },
                              text: {
                                type: "string",
                              },
                            },
                            description: "information about video text",
                          },
                        },
                        deliveryRules: {
                          required: [
                            "endDateTime",
                            "startDateTime",
                            "videoSchedulationType",
                          ],
                          type: ["object", "null"],
                          properties: {
                            videoSchedulationType: {
                              type: ["string", "null"],
                              description: "type of audio schedulation",
                              example: "WHEN",
                              enum: ["WHEN", "CONTINUOS_VISUALIZATION"],
                            },
                            startDateTime: {
                              type: "string",
                              nullable: true,
                              description: "scheduling start date",
                              format: "date-time",
                            },
                            endDateTime: {
                              type: "string",
                              nullable: true,
                              description: "scheduling end date",
                              format: "date-time",
                            },
                            startTime: {
                              type: "string",
                              nullable: true,
                              description:
                                "scheduling start time. Could be null for CONTINUOS_DELIVERY type scheduling",
                              format: "HH:MM",
                              example: 840,
                            },
                            endTime: {
                              type: "string",
                              nullable: true,
                              description:
                                "scheduling end time. Could be null for CONTINUOS_DELIVERY type scheduling",
                              format: "HH:MM",
                              example: 1020,
                            },
                            daysOfWeek: {
                              maxItems: 7,
                              type: "array",
                              nullable: true,
                              description:
                                "days of the week when the rule is valid. If the list is empty it is valid every day. It is only used for WHEN type scheduling",
                              items: {
                                type: ["string", "null"],
                                description: "Day of week",
                                enum: [
                                  "SUNDAY",
                                  "MONDAY",
                                  "TUESDAY",
                                  "WEDNESDAY",
                                  "THURSDAY",
                                  "FRIDAY",
                                  "SATURDAY",
                                ],
                              },
                            },
                          },
                          description:
                            "The delivery rules can be of two types: \n  - WHEN the message must be delivered to the video from the _startDateTime_ date to the _endDateTime_ date only in the time interval between the _startTime_ time and _endTime_ time for each day in the _daysOfWeek_ list\n  - CONTINUOUS_VISUALIZATION the message must be delivered to the video from the _startDateTime_ date (at _startTime_ if exists) to the _endDateTime_ (at _endTime_ if exists)",
                        },
                      },
                      description:
                        "video message to deliver. This part is present if the content type is VIDEO or AUDIO_VIDEO type for a ScheduledMessage",
                    },
                  },
                  description:
                    "scheduled message to delivery at specified _vehicleJourneys_. This part is present if the scheduled message must be delivered on channel ONBOARD",
                },
                externalSystemRecipient: {
                  required: ["messageContents"],
                  type: ["object", "null"],
                  properties: {
                    messageContents: {
                      type: "array",
                      items: {
                        required: ["language", "text"],
                        type: ["object", "null"],
                        properties: {
                          language: {
                            type: "string",
                            description:
                              "identifies the language of the external content",
                          },
                          text: {
                            type: "string",
                          },
                        },
                        description: "information about external text",
                      },
                    },
                    externalPoints: {
                      nullable: true,
                      type: "array",
                      items: {
                        required: ["id"],
                        type: ["object", "null"],
                        properties: {
                          id: {
                            type: "string",
                            description:
                              "**This refers to code external to Moova**. It is retrieved by invoking the SVCPLN-NetworkCode service",
                            example: "LPV",
                          },
                          nameLong: {
                            type: "string",
                            nullable: true,
                            example: "Milan Central FS",
                          },
                        },
                        description:
                          "point where to deliver the scheduled message",
                      },
                    },
                    startDateTime: {
                      type: "string",
                      nullable: true,
                      description: "scheduling start date-time",
                      format: "date-time",
                    },
                    endDateTime: {
                      nullable: true,
                      type: "string",
                      description: "scheduling end date-time",
                      format: "date-time",
                    },
                  },
                  description:
                    "scheduled message to delivery to external system. It can delivered to _externalPoints_. This part is present if the scheduled message must be delivered on channel EXTERNAL",
                },
              },
              description:
                "it is filled only if the message is of type SCHEDULED_MESSAGE. The scheduled message can be delivered through one or more channels: ONGROUND, ONBOARD or EXTERNAL",
            },
            monitoredJourneyScheduledMessage: {
              required: [
                "deliveryPoints",
                "messageContentType",
                "vehicleJourney",
              ],
              type: ["object", "null"],
              properties: {
                vehicleJourney: {
                  required: [
                    "dataFrameRef",
                    "datedVehicleJourneyRef",
                    "vehicleJourneyName",
                  ],
                  type: ["object", "null"],
                  properties: {
                    datedVehicleJourneyRef: {
                      type: "string",
                      description: "id of vehicle journey",
                    },
                    dataFrameRef: {
                      type: "string",
                      description:
                        "unique identifier of data frame within participant service",
                    },
                    vehicleJourneyName: {
                      type: "string",
                      description: "name of vehicle journey",
                    },
                  },
                  description: "vehicle journey identifiers information",
                },
                messageContentType: {
                  type: ["string", "null"],
                  description: "message content type",
                  example: "AUDIO",
                  enum: ["AUDIO", "VIDEO", "AUDIO_VIDEO"],
                },
                deliveryPoints: {
                  type: "array",
                  items: {
                    required: ["id"],
                    type: ["object", "null"],
                    properties: {
                      id: {
                        type: "string",
                        description:
                          "**This refers to code external to Moova**. It is retrieved by invoking the SVCPLN-NetworkCode service",
                        example: "LPV",
                      },
                      nameLong: {
                        type: "string",
                        nullable: true,
                        example: "Milan Central FS",
                      },
                    },
                    description: "point where to deliver the scheduled message",
                  },
                },
                audioMessageContents: {
                  required: ["audioTexts", "deliveryRules", "deliveryType"],
                  type: ["object", "null"],
                  properties: {
                    audioTexts: {
                      type: "array",
                      description: "list of audio message text",
                      items: {
                        required: ["audioText", "language"],
                        type: ["object", "null"],
                        properties: {
                          language: {
                            type: "string",
                            description:
                              "identifies the language of the content",
                            example: "en_GB",
                          },
                          audioText: {
                            type: "string",
                            description: "audio text used for tts system",
                          },
                        },
                        description:
                          "audio message content to be delivered for monitored journey scheduled message",
                      },
                    },
                    deliveryRules: {
                      type: ["object", "null"],
                      properties: {
                        repetitions: {
                          type: "integer",
                          nullable: true,
                        },
                        repeatEvery: {
                          type: "integer",
                          nullable: true,
                        },
                        scheduledArrival: {
                          type: "boolean",
                          nullable: true,
                        },
                        scheduledDeparture: {
                          type: "boolean",
                          nullable: true,
                        },
                        estimatedArrival: {
                          type: "boolean",
                          nullable: true,
                        },
                        estimatedDeparture: {
                          type: "boolean",
                          nullable: true,
                        },
                        eventType: {
                          type: ["string", "null"],
                          description:
                            "one of the event for messages to deliver on board ARRIVING DEPARTING ARRIVED DEPARTED\n  ",
                        },
                      },
                      description:
                        "Delivery Rule for monitored journey scheduled message",
                    },
                    deliveryType: {
                      type: ["string", "null"],
                      description:
                        "delivery type of message associated with vehicle journeys",
                      enum: ["ON_EVENT", "ON_SCHEDULE", null],
                    },
                  },
                  description:
                    "audio message content to be delivered for monitored journey scheduled message with delivery rules.\nAudio messages can be delivered in three delivery types specified in the _deliveryType_ field: \n- ON_EVENT the message is delivered for vehicle journey when that vehicle journey generates a specified event for a defined Point in _deliveryPoints_ (e.g. ARRIVING)\n- ON_SCHEDULE the message is delivered on a specific vehicle journey scheduling date happens for a defined Point in _deliveryPoints_ (e.g. estimated arrival time)",
                },
                videoTexts: {
                  type: "array",
                  nullable: true,
                  description: "list of video message for vehicle journey",
                  items: {
                    required: ["language", "videoText"],
                    type: ["object", "null"],
                    properties: {
                      language: {
                        type: "string",
                        description: "identifies the language of the content",
                        example: "en_GB",
                      },
                      videoText: {
                        type: "string",
                        description: "audio text used for tts system",
                      },
                    },
                    description:
                      "video message content to be delivered for monitored journey scheduled message",
                  },
                },
              },
              description:
                "is filled only if the message is of type MONITORED_JOURNEY_SCHEDULED_MESSAGE",
            },
          },
          description:
            "Object containing the information of a scheduled message inserted by an operator",
        },
        extraPayload: {
          type: ["object", "null"],
          properties: {},
          description: "Optional extention of payload object",
        },
      },
      description: "Container of the message",
    },
    RecipientAudioMessagesToDeliver: {
      required: ["audioContentType", "scheduledAudioDeliveryRules"],
      type: ["object", "null"],
      properties: {
        audioContentType: {
          type: ["string", "null"],
          description: "type of audio content",
          example: "AUDIO_TEXT",
          enum: ["AUDIO_TEXT", "AUDIO_FILE"],
        },
        audioText: {
          type: "array",
          nullable: true,
          items: {
            required: ["language", "text"],
            type: ["object", "null"],
            properties: {
              language: {
                type: "string",
                description: "identifies the language of the audio content",
                example: "en_GB",
              },
              text: {
                type: "string",
                description: "audio text used for tts system",
              },
            },
            description:
              "information about audio text. This part is present if the audio content type is AUDIO_TEXT",
          },
        },
        media: {
          type: "string",
          nullable: true,
          description:
            "used only for audio file, in this case audio content type is AUDIO_FILE",
          format: "byte",
        },
        scheduledAudioDeliveryRules: {
          required: ["audioSchedulationType"],
          type: ["object", "null"],
          properties: {
            audioSchedulationType: {
              type: ["string", "null"],
              description: "type of audio schedulation",
              example: "NOW",
              enum: ["NOW", "DELIVERY_AT", "REPEAT_EVERY"],
            },
            repetitions: {
              minimum: 1,
              type: "integer",
              nullable: true,
              description:
                "number of times the audio message must be repeated each occurens. It is only used for REPEAT_EVERY type scheduling",
              example: 1,
            },
            repeatEvery: {
              type: "integer",
              nullable: true,
              description:
                "period of time that must pass between an audio repetition and the next. This field is in seconds. It is only used for REPEAT_EVERY type scheduling",
              example: 600,
            },
            startDateTime: {
              type: "string",
              nullable: true,
              description:
                "scheduling start date. It is only used for REPEAT_EVERY type scheduling",
              format: "date-time",
            },
            endDateTime: {
              type: "string",
              nullable: true,
              description:
                "scheduling end date. It is only used for REPEAT_EVERY type scheduling",
              format: "date-time",
            },
            startTime: {
              type: "string",
              nullable: true,
              description:
                "scheduling start time. It is only used for REPEAT_EVERY type scheduling",
              format: "HH:MM",
              example: 840,
            },
            endTime: {
              type: "string",
              nullable: true,
              description:
                "scheduling end time. It is only used for REPEAT_EVERY type scheduling",
              format: "HH:MM",
              example: 1020,
            },
            daysOfWeek: {
              maxItems: 7,
              type: "array",
              nullable: true,
              description:
                "days of the week when the rule is valid. If the list is empty it is valid every day. It is only used for REPEAT_EVERY type scheduling",
              items: {
                type: ["string", "null"],
                description: "Day of week",
                enum: [
                  "SUNDAY",
                  "MONDAY",
                  "TUESDAY",
                  "WEDNESDAY",
                  "THURSDAY",
                  "FRIDAY",
                  "SATURDAY",
                ],
              },
            },
            deliveryAtDateTime: {
              type: "string",
              nullable: true,
              description:
                "message delivery date and time. It is only used for DELIVERY_AT type scheduling",
              format: "date-time",
            },
          },
          description:
            "The delivery rules can be of three types: \n  - NOW the message must be delivered at the time of insertion. \n  - DELIVERY_AT the message must be delivered on the date-time _deliveryAtDateTime_. \n  - REPEAT_EVERY the message begins to be delivered from _startDateTime_ at _startTime_ to _endDateTime_ at _endTime_ evaluating the repetition conditions and _daysOfWeek_ conditions.",
        },
      },
      description:
        "audio message to deliver. This part is present if the content type is AUDIO or AUDIO_VIDEO type for a ScheduledMessage",
    },
    RecipientVideoMessagesToDeliver: {
      required: ["deliveryRules", "videoTexts"],
      type: ["object", "null"],
      properties: {
        videoTexts: {
          type: "array",
          items: {
            required: ["language", "text"],
            type: ["object", "null"],
            properties: {
              language: {
                type: "string",
                description: "identifies the language of the video content",
              },
              text: {
                type: "string",
              },
            },
            description: "information about video text",
          },
        },
        deliveryRules: {
          required: ["endDateTime", "startDateTime", "videoSchedulationType"],
          type: ["object", "null"],
          properties: {
            videoSchedulationType: {
              type: ["string", "null"],
              description: "type of audio schedulation",
              example: "WHEN",
              enum: ["WHEN", "CONTINUOS_VISUALIZATION"],
            },
            startDateTime: {
              type: "string",
              nullable: true,
              description: "scheduling start date",
              format: "date-time",
            },
            endDateTime: {
              type: "string",
              nullable: true,
              description: "scheduling end date",
              format: "date-time",
            },
            startTime: {
              type: "string",
              nullable: true,
              description:
                "scheduling start time. Could be null for CONTINUOS_DELIVERY type scheduling",
              format: "HH:MM",
              example: 840,
            },
            endTime: {
              type: "string",
              nullable: true,
              description:
                "scheduling end time. Could be null for CONTINUOS_DELIVERY type scheduling",
              format: "HH:MM",
              example: 1020,
            },
            daysOfWeek: {
              maxItems: 7,
              type: "array",
              nullable: true,
              description:
                "days of the week when the rule is valid. If the list is empty it is valid every day. It is only used for WHEN type scheduling",
              items: {
                type: ["string", "null"],
                description: "Day of week",
                enum: [
                  "SUNDAY",
                  "MONDAY",
                  "TUESDAY",
                  "WEDNESDAY",
                  "THURSDAY",
                  "FRIDAY",
                  "SATURDAY",
                ],
              },
            },
          },
          description:
            "The delivery rules can be of two types: \n  - WHEN the message must be delivered to the video from the _startDateTime_ date to the _endDateTime_ date only in the time interval between the _startTime_ time and _endTime_ time for each day in the _daysOfWeek_ list\n  - CONTINUOUS_VISUALIZATION the message must be delivered to the video from the _startDateTime_ date (at _startTime_ if exists) to the _endDateTime_ (at _endTime_ if exists)",
        },
      },
      description:
        "video message to deliver. This part is present if the content type is VIDEO or AUDIO_VIDEO type for a ScheduledMessage",
    },
    ScheduledAudioDeliveryRules: {
      required: ["audioSchedulationType"],
      type: ["object", "null"],
      properties: {
        audioSchedulationType: {
          type: ["string", "null"],
          description: "type of audio schedulation",
          example: "NOW",
          enum: ["NOW", "DELIVERY_AT", "REPEAT_EVERY"],
        },
        repetitions: {
          minimum: 1,
          type: "integer",
          nullable: true,
          description:
            "number of times the audio message must be repeated each occurens. It is only used for REPEAT_EVERY type scheduling",
          example: 1,
        },
        repeatEvery: {
          type: "integer",
          nullable: true,
          description:
            "period of time that must pass between an audio repetition and the next. This field is in seconds. It is only used for REPEAT_EVERY type scheduling",
          example: 600,
        },
        startDateTime: {
          type: "string",
          nullable: true,
          description:
            "scheduling start date. It is only used for REPEAT_EVERY type scheduling",
          format: "date-time",
        },
        endDateTime: {
          type: "string",
          nullable: true,
          description:
            "scheduling end date. It is only used for REPEAT_EVERY type scheduling",
          format: "date-time",
        },
        startTime: {
          type: "string",
          nullable: true,
          description:
            "scheduling start time. It is only used for REPEAT_EVERY type scheduling",
          format: "HH:MM",
          example: 840,
        },
        endTime: {
          type: "string",
          nullable: true,
          description:
            "scheduling end time. It is only used for REPEAT_EVERY type scheduling",
          format: "HH:MM",
          example: 1020,
        },
        daysOfWeek: {
          maxItems: 7,
          type: "array",
          nullable: true,
          description:
            "days of the week when the rule is valid. If the list is empty it is valid every day. It is only used for REPEAT_EVERY type scheduling",
          items: {
            type: ["string", "null"],
            description: "Day of week",
            enum: [
              "SUNDAY",
              "MONDAY",
              "TUESDAY",
              "WEDNESDAY",
              "THURSDAY",
              "FRIDAY",
              "SATURDAY",
            ],
          },
        },
        deliveryAtDateTime: {
          type: "string",
          nullable: true,
          description:
            "message delivery date and time. It is only used for DELIVERY_AT type scheduling",
          format: "date-time",
        },
      },
      description:
        "The delivery rules can be of three types: \n  - NOW the message must be delivered at the time of insertion. \n  - DELIVERY_AT the message must be delivered on the date-time _deliveryAtDateTime_. \n  - REPEAT_EVERY the message begins to be delivered from _startDateTime_ at _startTime_ to _endDateTime_ at _endTime_ evaluating the repetition conditions and _daysOfWeek_ conditions.",
    },
    ScheduledMessage: {
      required: ["deliveryChannels"],
      type: ["object", "null"],
      properties: {
        situations: {
          nullable: true,
          type: "array",
          items: {
            type: ["object", "null"],
            properties: {
              id: {
                type: "string",
              },
              name: {
                type: "string",
              },
            },
            description:
              "a Scheduled message optionally can be related to a situation (SIRI)",
          },
        },
        deliveryChannels: {
          nullable: true,
          type: "array",
          items: {
            type: ["string", "null"],
            description:
              "channel on which the message is delivered. EXTERNAL is not used for MonitoredJourneyScheduledMessage",
            example: "ONGROUND",
            enum: ["ONGROUND", "ONBOARD", "EXTERNAL"],
          },
        },
        onGroundRecipient: {
          required: ["deliveryPoints", "messageContentType"],
          type: ["object", "null"],
          properties: {
            messageContentType: {
              type: ["string", "null"],
              description: "message content type",
              example: "AUDIO",
              enum: ["AUDIO", "VIDEO", "AUDIO_VIDEO"],
            },
            deliveryPoints: {
              type: "array",
              items: {
                required: ["id"],
                type: ["object", "null"],
                properties: {
                  id: {
                    type: "string",
                    description:
                      "**This refers to code external to Moova**. It is retrieved by invoking the SVCPLN-NetworkCode service",
                    example: "LPV",
                  },
                  nameLong: {
                    type: "string",
                    nullable: true,
                    example: "Milan Central FS",
                  },
                },
                description: "point where to deliver the scheduled message",
              },
            },
            recipientAudioMessagesToDeliver: {
              required: ["audioContentType", "scheduledAudioDeliveryRules"],
              type: ["object", "null"],
              properties: {
                audioContentType: {
                  type: ["string", "null"],
                  description: "type of audio content",
                  example: "AUDIO_TEXT",
                  enum: ["AUDIO_TEXT", "AUDIO_FILE"],
                },
                audioText: {
                  type: "array",
                  nullable: true,
                  items: {
                    required: ["language", "text"],
                    type: ["object", "null"],
                    properties: {
                      language: {
                        type: "string",
                        description:
                          "identifies the language of the audio content",
                        example: "en_GB",
                      },
                      text: {
                        type: "string",
                        description: "audio text used for tts system",
                      },
                    },
                    description:
                      "information about audio text. This part is present if the audio content type is AUDIO_TEXT",
                  },
                },
                media: {
                  type: "string",
                  nullable: true,
                  description:
                    "used only for audio file, in this case audio content type is AUDIO_FILE",
                  format: "byte",
                },
                scheduledAudioDeliveryRules: {
                  required: ["audioSchedulationType"],
                  type: ["object", "null"],
                  properties: {
                    audioSchedulationType: {
                      type: ["string", "null"],
                      description: "type of audio schedulation",
                      example: "NOW",
                      enum: ["NOW", "DELIVERY_AT", "REPEAT_EVERY"],
                    },
                    repetitions: {
                      minimum: 1,
                      type: "integer",
                      nullable: true,
                      description:
                        "number of times the audio message must be repeated each occurens. It is only used for REPEAT_EVERY type scheduling",
                      example: 1,
                    },
                    repeatEvery: {
                      type: "integer",
                      nullable: true,
                      description:
                        "period of time that must pass between an audio repetition and the next. This field is in seconds. It is only used for REPEAT_EVERY type scheduling",
                      example: 600,
                    },
                    startDateTime: {
                      type: "string",
                      nullable: true,
                      description:
                        "scheduling start date. It is only used for REPEAT_EVERY type scheduling",
                      format: "date-time",
                    },
                    endDateTime: {
                      type: "string",
                      nullable: true,
                      description:
                        "scheduling end date. It is only used for REPEAT_EVERY type scheduling",
                      format: "date-time",
                    },
                    startTime: {
                      type: "string",
                      nullable: true,
                      description:
                        "scheduling start time. It is only used for REPEAT_EVERY type scheduling",
                      format: "HH:MM",
                      example: 840,
                    },
                    endTime: {
                      type: "string",
                      nullable: true,
                      description:
                        "scheduling end time. It is only used for REPEAT_EVERY type scheduling",
                      format: "HH:MM",
                      example: 1020,
                    },
                    daysOfWeek: {
                      maxItems: 7,
                      type: "array",
                      nullable: true,
                      description:
                        "days of the week when the rule is valid. If the list is empty it is valid every day. It is only used for REPEAT_EVERY type scheduling",
                      items: {
                        type: ["string", "null"],
                        description: "Day of week",
                        enum: [
                          "SUNDAY",
                          "MONDAY",
                          "TUESDAY",
                          "WEDNESDAY",
                          "THURSDAY",
                          "FRIDAY",
                          "SATURDAY",
                        ],
                      },
                    },
                    deliveryAtDateTime: {
                      type: "string",
                      nullable: true,
                      description:
                        "message delivery date and time. It is only used for DELIVERY_AT type scheduling",
                      format: "date-time",
                    },
                  },
                  description:
                    "The delivery rules can be of three types: \n  - NOW the message must be delivered at the time of insertion. \n  - DELIVERY_AT the message must be delivered on the date-time _deliveryAtDateTime_. \n  - REPEAT_EVERY the message begins to be delivered from _startDateTime_ at _startTime_ to _endDateTime_ at _endTime_ evaluating the repetition conditions and _daysOfWeek_ conditions.",
                },
              },
              description:
                "audio message to deliver. This part is present if the content type is AUDIO or AUDIO_VIDEO type for a ScheduledMessage",
            },
            recipientVideoMessagesToDeliver: {
              required: ["deliveryRules", "videoTexts"],
              type: ["object", "null"],
              properties: {
                videoTexts: {
                  type: "array",
                  items: {
                    required: ["language", "text"],
                    type: ["object", "null"],
                    properties: {
                      language: {
                        type: "string",
                        description:
                          "identifies the language of the video content",
                      },
                      text: {
                        type: "string",
                      },
                    },
                    description: "information about video text",
                  },
                },
                deliveryRules: {
                  required: [
                    "endDateTime",
                    "startDateTime",
                    "videoSchedulationType",
                  ],
                  type: ["object", "null"],
                  properties: {
                    videoSchedulationType: {
                      type: ["string", "null"],
                      description: "type of audio schedulation",
                      example: "WHEN",
                      enum: ["WHEN", "CONTINUOS_VISUALIZATION"],
                    },
                    startDateTime: {
                      type: "string",
                      nullable: true,
                      description: "scheduling start date",
                      format: "date-time",
                    },
                    endDateTime: {
                      type: "string",
                      nullable: true,
                      description: "scheduling end date",
                      format: "date-time",
                    },
                    startTime: {
                      type: "string",
                      nullable: true,
                      description:
                        "scheduling start time. Could be null for CONTINUOS_DELIVERY type scheduling",
                      format: "HH:MM",
                      example: 840,
                    },
                    endTime: {
                      type: "string",
                      nullable: true,
                      description:
                        "scheduling end time. Could be null for CONTINUOS_DELIVERY type scheduling",
                      format: "HH:MM",
                      example: 1020,
                    },
                    daysOfWeek: {
                      maxItems: 7,
                      type: "array",
                      nullable: true,
                      description:
                        "days of the week when the rule is valid. If the list is empty it is valid every day. It is only used for WHEN type scheduling",
                      items: {
                        type: ["string", "null"],
                        description: "Day of week",
                        enum: [
                          "SUNDAY",
                          "MONDAY",
                          "TUESDAY",
                          "WEDNESDAY",
                          "THURSDAY",
                          "FRIDAY",
                          "SATURDAY",
                        ],
                      },
                    },
                  },
                  description:
                    "The delivery rules can be of two types: \n  - WHEN the message must be delivered to the video from the _startDateTime_ date to the _endDateTime_ date only in the time interval between the _startTime_ time and _endTime_ time for each day in the _daysOfWeek_ list\n  - CONTINUOUS_VISUALIZATION the message must be delivered to the video from the _startDateTime_ date (at _startTime_ if exists) to the _endDateTime_ (at _endTime_ if exists)",
                },
              },
              description:
                "video message to deliver. This part is present if the content type is VIDEO or AUDIO_VIDEO type for a ScheduledMessage",
            },
          },
          description:
            "scheduled message to delivery at specified _deliveryPoints_. This part is present if the scheduled message must be delivered on channel ONGROUND",
        },
        onBoardRecipient: {
          required: ["messageContentType", "vehicleJourneys"],
          type: ["object", "null"],
          properties: {
            messageContentType: {
              type: ["string", "null"],
              description: "message content type",
              example: "AUDIO",
              enum: ["AUDIO", "VIDEO", "AUDIO_VIDEO"],
            },
            vehicleJourneys: {
              type: "array",
              items: {
                required: [
                  "dataFrameRef",
                  "datedVehicleJourneyRef",
                  "vehicleJourneyName",
                ],
                type: ["object", "null"],
                properties: {
                  datedVehicleJourneyRef: {
                    type: "string",
                    description: "id of vehicle journey",
                  },
                  dataFrameRef: {
                    type: "string",
                    description:
                      "unique identifier of data frame within participant service",
                  },
                  vehicleJourneyName: {
                    type: "string",
                    description: "name of vehicle journey",
                  },
                },
                description: "vehicle journey identifiers information",
              },
            },
            recipientAudioMessagesToDeliver: {
              required: ["audioContentType", "scheduledAudioDeliveryRules"],
              type: ["object", "null"],
              properties: {
                audioContentType: {
                  type: ["string", "null"],
                  description: "type of audio content",
                  example: "AUDIO_TEXT",
                  enum: ["AUDIO_TEXT", "AUDIO_FILE"],
                },
                audioText: {
                  type: "array",
                  nullable: true,
                  items: {
                    required: ["language", "text"],
                    type: ["object", "null"],
                    properties: {
                      language: {
                        type: "string",
                        description:
                          "identifies the language of the audio content",
                        example: "en_GB",
                      },
                      text: {
                        type: "string",
                        description: "audio text used for tts system",
                      },
                    },
                    description:
                      "information about audio text. This part is present if the audio content type is AUDIO_TEXT",
                  },
                },
                media: {
                  type: "string",
                  nullable: true,
                  description:
                    "used only for audio file, in this case audio content type is AUDIO_FILE",
                  format: "byte",
                },
                scheduledAudioDeliveryRules: {
                  required: ["audioSchedulationType"],
                  type: ["object", "null"],
                  properties: {
                    audioSchedulationType: {
                      type: ["string", "null"],
                      description: "type of audio schedulation",
                      example: "NOW",
                      enum: ["NOW", "DELIVERY_AT", "REPEAT_EVERY"],
                    },
                    repetitions: {
                      minimum: 1,
                      type: "integer",
                      nullable: true,
                      description:
                        "number of times the audio message must be repeated each occurens. It is only used for REPEAT_EVERY type scheduling",
                      example: 1,
                    },
                    repeatEvery: {
                      type: "integer",
                      nullable: true,
                      description:
                        "period of time that must pass between an audio repetition and the next. This field is in seconds. It is only used for REPEAT_EVERY type scheduling",
                      example: 600,
                    },
                    startDateTime: {
                      type: "string",
                      nullable: true,
                      description:
                        "scheduling start date. It is only used for REPEAT_EVERY type scheduling",
                      format: "date-time",
                    },
                    endDateTime: {
                      type: "string",
                      nullable: true,
                      description:
                        "scheduling end date. It is only used for REPEAT_EVERY type scheduling",
                      format: "date-time",
                    },
                    startTime: {
                      type: "string",
                      nullable: true,
                      description:
                        "scheduling start time. It is only used for REPEAT_EVERY type scheduling",
                      format: "HH:MM",
                      example: 840,
                    },
                    endTime: {
                      type: "string",
                      nullable: true,
                      description:
                        "scheduling end time. It is only used for REPEAT_EVERY type scheduling",
                      format: "HH:MM",
                      example: 1020,
                    },
                    daysOfWeek: {
                      maxItems: 7,
                      type: "array",
                      nullable: true,
                      description:
                        "days of the week when the rule is valid. If the list is empty it is valid every day. It is only used for REPEAT_EVERY type scheduling",
                      items: {
                        type: ["string", "null"],
                        description: "Day of week",
                        enum: [
                          "SUNDAY",
                          "MONDAY",
                          "TUESDAY",
                          "WEDNESDAY",
                          "THURSDAY",
                          "FRIDAY",
                          "SATURDAY",
                        ],
                      },
                    },
                    deliveryAtDateTime: {
                      type: "string",
                      nullable: true,
                      description:
                        "message delivery date and time. It is only used for DELIVERY_AT type scheduling",
                      format: "date-time",
                    },
                  },
                  description:
                    "The delivery rules can be of three types: \n  - NOW the message must be delivered at the time of insertion. \n  - DELIVERY_AT the message must be delivered on the date-time _deliveryAtDateTime_. \n  - REPEAT_EVERY the message begins to be delivered from _startDateTime_ at _startTime_ to _endDateTime_ at _endTime_ evaluating the repetition conditions and _daysOfWeek_ conditions.",
                },
              },
              description:
                "audio message to deliver. This part is present if the content type is AUDIO or AUDIO_VIDEO type for a ScheduledMessage",
            },
            recipientVideoMessagesToDeliver: {
              required: ["deliveryRules", "videoTexts"],
              type: ["object", "null"],
              properties: {
                videoTexts: {
                  type: "array",
                  items: {
                    required: ["language", "text"],
                    type: ["object", "null"],
                    properties: {
                      language: {
                        type: "string",
                        description:
                          "identifies the language of the video content",
                      },
                      text: {
                        type: "string",
                      },
                    },
                    description: "information about video text",
                  },
                },
                deliveryRules: {
                  required: [
                    "endDateTime",
                    "startDateTime",
                    "videoSchedulationType",
                  ],
                  type: ["object", "null"],
                  properties: {
                    videoSchedulationType: {
                      type: ["string", "null"],
                      description: "type of audio schedulation",
                      example: "WHEN",
                      enum: ["WHEN", "CONTINUOS_VISUALIZATION"],
                    },
                    startDateTime: {
                      type: "string",
                      nullable: true,
                      description: "scheduling start date",
                      format: "date-time",
                    },
                    endDateTime: {
                      type: "string",
                      nullable: true,
                      description: "scheduling end date",
                      format: "date-time",
                    },
                    startTime: {
                      type: "string",
                      nullable: true,
                      description:
                        "scheduling start time. Could be null for CONTINUOS_DELIVERY type scheduling",
                      format: "HH:MM",
                      example: 840,
                    },
                    endTime: {
                      type: "string",
                      nullable: true,
                      description:
                        "scheduling end time. Could be null for CONTINUOS_DELIVERY type scheduling",
                      format: "HH:MM",
                      example: 1020,
                    },
                    daysOfWeek: {
                      maxItems: 7,
                      type: "array",
                      nullable: true,
                      description:
                        "days of the week when the rule is valid. If the list is empty it is valid every day. It is only used for WHEN type scheduling",
                      items: {
                        type: ["string", "null"],
                        description: "Day of week",
                        enum: [
                          "SUNDAY",
                          "MONDAY",
                          "TUESDAY",
                          "WEDNESDAY",
                          "THURSDAY",
                          "FRIDAY",
                          "SATURDAY",
                        ],
                      },
                    },
                  },
                  description:
                    "The delivery rules can be of two types: \n  - WHEN the message must be delivered to the video from the _startDateTime_ date to the _endDateTime_ date only in the time interval between the _startTime_ time and _endTime_ time for each day in the _daysOfWeek_ list\n  - CONTINUOUS_VISUALIZATION the message must be delivered to the video from the _startDateTime_ date (at _startTime_ if exists) to the _endDateTime_ (at _endTime_ if exists)",
                },
              },
              description:
                "video message to deliver. This part is present if the content type is VIDEO or AUDIO_VIDEO type for a ScheduledMessage",
            },
          },
          description:
            "scheduled message to delivery at specified _vehicleJourneys_. This part is present if the scheduled message must be delivered on channel ONBOARD",
        },
        externalSystemRecipient: {
          required: ["messageContents"],
          type: ["object", "null"],
          properties: {
            messageContents: {
              type: "array",
              items: {
                required: ["language", "text"],
                type: ["object", "null"],
                properties: {
                  language: {
                    type: "string",
                    description:
                      "identifies the language of the external content",
                  },
                  text: {
                    type: "string",
                  },
                },
                description: "information about external text",
              },
            },
            externalPoints: {
              nullable: true,
              type: "array",
              items: {
                required: ["id"],
                type: ["object", "null"],
                properties: {
                  id: {
                    type: "string",
                    description:
                      "**This refers to code external to Moova**. It is retrieved by invoking the SVCPLN-NetworkCode service",
                    example: "LPV",
                  },
                  nameLong: {
                    type: "string",
                    nullable: true,
                    example: "Milan Central FS",
                  },
                },
                description: "point where to deliver the scheduled message",
              },
            },
            startDateTime: {
              type: "string",
              nullable: true,
              description: "scheduling start date-time",
              format: "date-time",
            },
            endDateTime: {
              nullable: true,
              type: "string",
              description: "scheduling end date-time",
              format: "date-time",
            },
          },
          description:
            "scheduled message to delivery to external system. It can delivered to _externalPoints_. This part is present if the scheduled message must be delivered on channel EXTERNAL",
        },
      },
      description:
        "it is filled only if the message is of type SCHEDULED_MESSAGE. The scheduled message can be delivered through one or more channels: ONGROUND, ONBOARD or EXTERNAL",
    },
    ScheduledVideoDeliveryRules: {
      required: ["endDateTime", "startDateTime", "videoSchedulationType"],
      type: ["object", "null"],
      properties: {
        videoSchedulationType: {
          type: ["string", "null"],
          description: "type of audio schedulation",
          example: "WHEN",
          enum: ["WHEN", "CONTINUOS_VISUALIZATION"],
        },
        startDateTime: {
          type: "string",
          nullable: true,
          description: "scheduling start date",
          format: "date-time",
        },
        endDateTime: {
          type: "string",
          nullable: true,
          description: "scheduling end date",
          format: "date-time",
        },
        startTime: {
          type: "string",
          nullable: true,
          description:
            "scheduling start time. Could be null for CONTINUOS_DELIVERY type scheduling",
          format: "HH:MM",
          example: 840,
        },
        endTime: {
          type: "string",
          nullable: true,
          description:
            "scheduling end time. Could be null for CONTINUOS_DELIVERY type scheduling",
          format: "HH:MM",
          example: 1020,
        },
        daysOfWeek: {
          maxItems: 7,
          type: "array",
          nullable: true,
          description:
            "days of the week when the rule is valid. If the list is empty it is valid every day. It is only used for WHEN type scheduling",
          items: {
            type: ["string", "null"],
            description: "Day of week",
            enum: [
              "SUNDAY",
              "MONDAY",
              "TUESDAY",
              "WEDNESDAY",
              "THURSDAY",
              "FRIDAY",
              "SATURDAY",
            ],
          },
        },
      },
      description:
        "The delivery rules can be of two types: \n  - WHEN the message must be delivered to the video from the _startDateTime_ date to the _endDateTime_ date only in the time interval between the _startTime_ time and _endTime_ time for each day in the _daysOfWeek_ list\n  - CONTINUOUS_VISUALIZATION the message must be delivered to the video from the _startDateTime_ date (at _startTime_ if exists) to the _endDateTime_ (at _endTime_ if exists)",
    },
    Situation: {
      type: ["object", "null"],
      properties: {
        id: {
          type: "string",
        },
        name: {
          type: "string",
        },
      },
      description:
        "a Scheduled message optionally can be related to a situation (SIRI)",
    },
    SpecificEventTypeEnum: {
      type: ["string", "null"],
      description:
        "one of the event for messages to deliver on board ARRIVING DEPARTING ARRIVED DEPARTED\n  ",
    },
    VehicleJourney: {
      required: [
        "dataFrameRef",
        "datedVehicleJourneyRef",
        "vehicleJourneyName",
      ],
      type: ["object", "null"],
      properties: {
        datedVehicleJourneyRef: {
          type: "string",
          description: "id of vehicle journey",
        },
        dataFrameRef: {
          type: "string",
          description:
            "unique identifier of data frame within participant service",
        },
        vehicleJourneyName: {
          type: "string",
          description: "name of vehicle journey",
        },
      },
      description: "vehicle journey identifiers information",
    },
    VideoSchedulationTypeEnum: {
      type: ["string", "null"],
      description: "type of audio schedulation",
      example: "WHEN",
      enum: ["WHEN", "CONTINUOS_VISUALIZATION"],
    },
    VideoText: {
      required: ["language", "text"],
      type: ["object", "null"],
      properties: {
        language: {
          type: "string",
          description: "identifies the language of the video content",
        },
        text: {
          type: "string",
        },
      },
      description: "information about video text",
    },
  },
};
