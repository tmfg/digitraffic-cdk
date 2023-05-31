import { z } from "zod";

export const ramiMessageSchema = z
    .object({
        headers: z
            .object({
                e2eId: z
                    .string()
                    .describe("Correlational event unique identifier for logging and instrumentation"),
                organisation: z
                    .string()
                    .describe("Data Type for Identifier of an OrganisationCode.")
                    .optional(),
                source: z.string().describe("Module identifier that publishes the message"),
                partitionKey: z
                    .union([
                        z
                            .string()
                            .describe(
                                "kafka partition key where the message is sent in the specific topic. The message id is used"
                            ),
                        z
                            .null()
                            .describe(
                                "kafka partition key where the message is sent in the specific topic. The message id is used"
                            )
                    ])
                    .describe(
                        "kafka partition key where the message is sent in the specific topic. The message id is used"
                    )
                    .optional(),
                eventType: z
                    .union([z.string().describe("Type of event"), z.null().describe("Type of event")])
                    .describe("Type of event"),
                recordedAtTime: z.string().describe("Registration date")
            })
            .describe("Mandatory header of the message"),
        payload: z
            .object({
                messageId: z.string().describe("unique id of the message"),
                messageVersion: z
                    .number()
                    .int()
                    .gte(1)
                    .describe("message versioning, it is incremented at each message update"),
                title: z.string().max(255).describe("title of the message"),
                messageType: z
                    .enum(["SCHEDULED_MESSAGE", "MONITORED_JOURNEY_SCHEDULED_MESSAGE"])
                    .describe("type of the message. Indicates whether related with vehicle journey or not"),
                operation: z
                    .enum(["INSERT", "UPDATE", "DELETE"])
                    .describe("type of operation performed by the user on the message"),
                creationDateTime: z.string().describe("datetime, in UTC ISO8601, creation date time"),
                startValidity: z.string().describe("datetime, in UTC ISO8601, start validity"),
                endValidity: z.string().describe("datetime, in UTC ISO8601, end validity"),
                scheduledMessage: z
                    .union([
                        z
                            .object({
                                situations: z
                                    .array(
                                        z
                                            .union([
                                                z
                                                    .object({
                                                        id: z.string().optional(),
                                                        name: z.string().optional()
                                                    })
                                                    .describe(
                                                        "a Scheduled message optionally can be related to a situation (SIRI)"
                                                    ),
                                                z
                                                    .null()
                                                    .describe(
                                                        "a Scheduled message optionally can be related to a situation (SIRI)"
                                                    )
                                            ])
                                            .describe(
                                                "a Scheduled message optionally can be related to a situation (SIRI)"
                                            )
                                    )
                                    .nullable()
                                    .optional(),
                                deliveryChannels: z
                                    .array(
                                        z
                                            .enum(["ONGROUND", "ONBOARD", "EXTERNAL"])
                                            .describe(
                                                "channel on which the message is delivered. EXTERNAL is not used for MonitoredJourneyScheduledMessage"
                                            )
                                    )
                                    .nullable(),
                                onGroundRecipient: z
                                    .union([
                                        z
                                            .object({
                                                messageContentType: z
                                                    .enum(["AUDIO", "VIDEO", "AUDIO_VIDEO"])
                                                    .describe("message content type"),
                                                deliveryPoints: z
                                                    .array(
                                                        z
                                                            .object({
                                                                id: z
                                                                    .string()
                                                                    .describe(
                                                                        "**This refers to code external to Moova**. It is retrieved by invoking the SVCPLN-NetworkCode service"
                                                                    ),
                                                                nameLong: z
                                                                    .union([z.string(), z.null()])
                                                                    .optional()
                                                            })
                                                            .describe(
                                                                "point where to deliver the scheduled message"
                                                            )
                                                    )
                                                    .nullable(),
                                                recipientAudioMessagesToDeliver: z
                                                    .union([
                                                        z
                                                            .object({
                                                                audioContentType: z
                                                                    .enum(["AUDIO_TEXT", "AUDIO_FILE"])
                                                                    .describe("type of audio content"),
                                                                audioText: z
                                                                    .array(
                                                                        z
                                                                            .union([
                                                                                z
                                                                                    .object({
                                                                                        language: z
                                                                                            .string()
                                                                                            .describe(
                                                                                                "identifies the language of the audio content"
                                                                                            ),
                                                                                        text: z
                                                                                            .string()
                                                                                            .describe(
                                                                                                "audio text used for tts system"
                                                                                            )
                                                                                    })
                                                                                    .describe(
                                                                                        "information about audio text. This part is present if the audio content type is AUDIO_TEXT"
                                                                                    ),
                                                                                z
                                                                                    .null()
                                                                                    .describe(
                                                                                        "information about audio text. This part is present if the audio content type is AUDIO_TEXT"
                                                                                    )
                                                                            ])
                                                                            .describe(
                                                                                "information about audio text. This part is present if the audio content type is AUDIO_TEXT"
                                                                            )
                                                                    )
                                                                    .nullable()
                                                                    .optional(),
                                                                media: z
                                                                    .string()
                                                                    .describe(
                                                                        "used only for audio file, in this case audio content type is AUDIO_FILE"
                                                                    )
                                                                    .nullable()
                                                                    .describe(
                                                                        "used only for audio file, in this case audio content type is AUDIO_FILE"
                                                                    )
                                                                    .optional(),
                                                                scheduledAudioDeliveryRules: z
                                                                    .union([
                                                                        z
                                                                            .object({
                                                                                audioSchedulationType: z
                                                                                    .enum([
                                                                                        "NOW",
                                                                                        "DELIVERY_AT",
                                                                                        "REPEAT_EVERY"
                                                                                    ])
                                                                                    .describe(
                                                                                        "type of audio schedulation"
                                                                                    ),
                                                                                repetitions: z
                                                                                    .number()
                                                                                    .int()
                                                                                    .gte(0)
                                                                                    .describe(
                                                                                        "number of times the audio message must be repeated each occurens. It is only used for REPEAT_EVERY type scheduling"
                                                                                    )
                                                                                    .nullable()
                                                                                    .describe(
                                                                                        "number of times the audio message must be repeated each occurens. It is only used for REPEAT_EVERY type scheduling"
                                                                                    )
                                                                                    .optional(),
                                                                                repeatEvery: z
                                                                                    .number()
                                                                                    .int()
                                                                                    .describe(
                                                                                        "period of time that must pass between an audio repetition and the next. This field is in seconds. It is only used for REPEAT_EVERY type scheduling"
                                                                                    )
                                                                                    .nullable()
                                                                                    .describe(
                                                                                        "period of time that must pass between an audio repetition and the next. This field is in seconds. It is only used for REPEAT_EVERY type scheduling"
                                                                                    )
                                                                                    .optional(),
                                                                                startDateTime: z
                                                                                    .string()
                                                                                    .describe(
                                                                                        "scheduling start date. It is only used for REPEAT_EVERY type scheduling"
                                                                                    )
                                                                                    .nullable()
                                                                                    .describe(
                                                                                        "scheduling start date. It is only used for REPEAT_EVERY type scheduling"
                                                                                    )
                                                                                    .optional(),
                                                                                endDateTime: z
                                                                                    .string()
                                                                                    .describe(
                                                                                        "scheduling end date. It is only used for REPEAT_EVERY type scheduling"
                                                                                    )
                                                                                    .nullable()
                                                                                    .describe(
                                                                                        "scheduling end date. It is only used for REPEAT_EVERY type scheduling"
                                                                                    )
                                                                                    .optional(),
                                                                                startTime: z
                                                                                    .string()
                                                                                    .describe(
                                                                                        "scheduling start time. It is only used for REPEAT_EVERY type scheduling"
                                                                                    )
                                                                                    .nullable()
                                                                                    .describe(
                                                                                        "scheduling start time. It is only used for REPEAT_EVERY type scheduling"
                                                                                    )
                                                                                    .optional(),
                                                                                endTime: z
                                                                                    .string()
                                                                                    .describe(
                                                                                        "scheduling end time. It is only used for REPEAT_EVERY type scheduling"
                                                                                    )
                                                                                    .nullable()
                                                                                    .describe(
                                                                                        "scheduling end time. It is only used for REPEAT_EVERY type scheduling"
                                                                                    )
                                                                                    .optional(),
                                                                                daysOfWeek: z
                                                                                    .array(
                                                                                        z
                                                                                            .enum([
                                                                                                "SUNDAY",
                                                                                                "MONDAY",
                                                                                                "TUESDAY",
                                                                                                "WEDNESDAY",
                                                                                                "THURSDAY",
                                                                                                "FRIDAY",
                                                                                                "SATURDAY"
                                                                                            ])
                                                                                            .describe(
                                                                                                "Day of week"
                                                                                            )
                                                                                    )
                                                                                    .max(7)
                                                                                    .describe(
                                                                                        "days of the week when the rule is valid. If the list is empty it is valid every day. It is only used for REPEAT_EVERY type scheduling"
                                                                                    )
                                                                                    .nullable()
                                                                                    .describe(
                                                                                        "days of the week when the rule is valid. If the list is empty it is valid every day. It is only used for REPEAT_EVERY type scheduling"
                                                                                    )
                                                                                    .optional(),
                                                                                deliveryAtDateTime: z
                                                                                    .string()
                                                                                    .describe(
                                                                                        "message delivery date and time. It is only used for DELIVERY_AT type scheduling"
                                                                                    )
                                                                                    .nullable()
                                                                                    .describe(
                                                                                        "message delivery date and time. It is only used for DELIVERY_AT type scheduling"
                                                                                    )
                                                                                    .optional()
                                                                            })
                                                                            .describe(
                                                                                "The delivery rules can be of three types: \n  - NOW the message must be delivered at the time of insertion. \n  - DELIVERY_AT the message must be delivered on the date-time _deliveryAtDateTime_. \n  - REPEAT_EVERY the message begins to be delivered from _startDateTime_ at _startTime_ to _endDateTime_ at _endTime_ evaluating the repetition conditions and _daysOfWeek_ conditions."
                                                                            ),
                                                                        z
                                                                            .null()
                                                                            .describe(
                                                                                "The delivery rules can be of three types: \n  - NOW the message must be delivered at the time of insertion. \n  - DELIVERY_AT the message must be delivered on the date-time _deliveryAtDateTime_. \n  - REPEAT_EVERY the message begins to be delivered from _startDateTime_ at _startTime_ to _endDateTime_ at _endTime_ evaluating the repetition conditions and _daysOfWeek_ conditions."
                                                                            )
                                                                    ])
                                                                    .describe(
                                                                        "The delivery rules can be of three types: \n  - NOW the message must be delivered at the time of insertion. \n  - DELIVERY_AT the message must be delivered on the date-time _deliveryAtDateTime_. \n  - REPEAT_EVERY the message begins to be delivered from _startDateTime_ at _startTime_ to _endDateTime_ at _endTime_ evaluating the repetition conditions and _daysOfWeek_ conditions."
                                                                    )
                                                            })
                                                            .describe(
                                                                "audio message to deliver. This part is present if the content type is AUDIO or AUDIO_VIDEO type for a ScheduledMessage"
                                                            ),
                                                        z
                                                            .null()
                                                            .describe(
                                                                "audio message to deliver. This part is present if the content type is AUDIO or AUDIO_VIDEO type for a ScheduledMessage"
                                                            )
                                                    ])
                                                    .describe(
                                                        "audio message to deliver. This part is present if the content type is AUDIO or AUDIO_VIDEO type for a ScheduledMessage"
                                                    )
                                                    .optional(),
                                                recipientVideoMessagesToDeliver: z
                                                    .union([
                                                        z
                                                            .object({
                                                                videoTexts: z.array(
                                                                    z
                                                                        .object({
                                                                            language: z
                                                                                .string()
                                                                                .describe(
                                                                                    "identifies the language of the video content"
                                                                                ),
                                                                            text: z.string()
                                                                        })
                                                                        .describe(
                                                                            "information about video text"
                                                                        )
                                                                ),
                                                                deliveryRules: z
                                                                    .union([
                                                                        z
                                                                            .object({
                                                                                videoSchedulationType: z
                                                                                    .enum([
                                                                                        "WHEN",
                                                                                        "CONTINUOS_VISUALIZATION"
                                                                                    ])
                                                                                    .describe(
                                                                                        "type of audio schedulation"
                                                                                    ),
                                                                                startDateTime: z
                                                                                    .string()
                                                                                    .describe(
                                                                                        "scheduling start date"
                                                                                    )
                                                                                    .nullable()
                                                                                    .describe(
                                                                                        "scheduling start date"
                                                                                    ),
                                                                                endDateTime: z
                                                                                    .string()
                                                                                    .describe(
                                                                                        "scheduling end date"
                                                                                    )
                                                                                    .nullable()
                                                                                    .describe(
                                                                                        "scheduling end date"
                                                                                    ),
                                                                                startTime: z
                                                                                    .string()
                                                                                    .describe(
                                                                                        "scheduling start time. Could be null for CONTINUOS_DELIVERY type scheduling"
                                                                                    )
                                                                                    .nullable()
                                                                                    .describe(
                                                                                        "scheduling start time. Could be null for CONTINUOS_DELIVERY type scheduling"
                                                                                    )
                                                                                    .optional(),
                                                                                endTime: z
                                                                                    .string()
                                                                                    .describe(
                                                                                        "scheduling end time. Could be null for CONTINUOS_DELIVERY type scheduling"
                                                                                    )
                                                                                    .nullable()
                                                                                    .describe(
                                                                                        "scheduling end time. Could be null for CONTINUOS_DELIVERY type scheduling"
                                                                                    )
                                                                                    .optional(),
                                                                                daysOfWeek: z
                                                                                    .array(
                                                                                        z
                                                                                            .enum([
                                                                                                "SUNDAY",
                                                                                                "MONDAY",
                                                                                                "TUESDAY",
                                                                                                "WEDNESDAY",
                                                                                                "THURSDAY",
                                                                                                "FRIDAY",
                                                                                                "SATURDAY"
                                                                                            ])
                                                                                            .describe(
                                                                                                "Day of week"
                                                                                            )
                                                                                    )
                                                                                    .max(7)
                                                                                    .describe(
                                                                                        "days of the week when the rule is valid. If the list is empty it is valid every day. It is only used for WHEN type scheduling"
                                                                                    )
                                                                                    .nullable()
                                                                                    .describe(
                                                                                        "days of the week when the rule is valid. If the list is empty it is valid every day. It is only used for WHEN type scheduling"
                                                                                    )
                                                                                    .optional()
                                                                            })
                                                                            .describe(
                                                                                "The delivery rules can be of two types: \n  - WHEN the message must be delivered to the video from the _startDateTime_ date to the _endDateTime_ date only in the time interval between the _startTime_ time and _endTime_ time for each day in the _daysOfWeek_ list\n  - CONTINUOUS_VISUALIZATION the message must be delivered to the video from the _startDateTime_ date (at _startTime_ if exists) to the _endDateTime_ (at _endTime_ if exists)"
                                                                            ),
                                                                        z
                                                                            .null()
                                                                            .describe(
                                                                                "The delivery rules can be of two types: \n  - WHEN the message must be delivered to the video from the _startDateTime_ date to the _endDateTime_ date only in the time interval between the _startTime_ time and _endTime_ time for each day in the _daysOfWeek_ list\n  - CONTINUOUS_VISUALIZATION the message must be delivered to the video from the _startDateTime_ date (at _startTime_ if exists) to the _endDateTime_ (at _endTime_ if exists)"
                                                                            )
                                                                    ])
                                                                    .describe(
                                                                        "The delivery rules can be of two types: \n  - WHEN the message must be delivered to the video from the _startDateTime_ date to the _endDateTime_ date only in the time interval between the _startTime_ time and _endTime_ time for each day in the _daysOfWeek_ list\n  - CONTINUOUS_VISUALIZATION the message must be delivered to the video from the _startDateTime_ date (at _startTime_ if exists) to the _endDateTime_ (at _endTime_ if exists)"
                                                                    )
                                                            })
                                                            .describe(
                                                                "video message to deliver. This part is present if the content type is VIDEO or AUDIO_VIDEO type for a ScheduledMessage"
                                                            ),
                                                        z
                                                            .null()
                                                            .describe(
                                                                "video message to deliver. This part is present if the content type is VIDEO or AUDIO_VIDEO type for a ScheduledMessage"
                                                            )
                                                    ])
                                                    .describe(
                                                        "video message to deliver. This part is present if the content type is VIDEO or AUDIO_VIDEO type for a ScheduledMessage"
                                                    )
                                                    .optional()
                                            })
                                            .describe(
                                                "scheduled message to delivery at specified _deliveryPoints_. This part is present if the scheduled message must be delivered on channel ONGROUND"
                                            ),
                                        z
                                            .null()
                                            .describe(
                                                "scheduled message to delivery at specified _deliveryPoints_. This part is present if the scheduled message must be delivered on channel ONGROUND"
                                            )
                                    ])
                                    .describe(
                                        "scheduled message to delivery at specified _deliveryPoints_. This part is present if the scheduled message must be delivered on channel ONGROUND"
                                    )
                                    .optional(),
                                onBoardRecipient: z
                                    .union([
                                        z
                                            .object({
                                                messageContentType: z
                                                    .enum(["AUDIO", "VIDEO", "AUDIO_VIDEO"])
                                                    .describe("message content type"),
                                                vehicleJourneys: z.array(
                                                    z
                                                        .union([
                                                            z
                                                                .object({
                                                                    datedVehicleJourneyRef: z
                                                                        .string()
                                                                        .describe("id of vehicle journey"),
                                                                    dataFrameRef: z
                                                                        .string()
                                                                        .describe(
                                                                            "unique identifier of data frame within participant service"
                                                                        ),
                                                                    vehicleJourneyName: z
                                                                        .string()
                                                                        .describe("name of vehicle journey")
                                                                })
                                                                .describe(
                                                                    "vehicle journey identifiers information"
                                                                ),
                                                            z
                                                                .null()
                                                                .describe(
                                                                    "vehicle journey identifiers information"
                                                                )
                                                        ])
                                                        .describe("vehicle journey identifiers information")
                                                ),
                                                recipientAudioMessagesToDeliver: z
                                                    .union([
                                                        z
                                                            .object({
                                                                audioContentType: z
                                                                    .enum(["AUDIO_TEXT", "AUDIO_FILE"])
                                                                    .describe("type of audio content"),
                                                                audioText: z
                                                                    .array(
                                                                        z
                                                                            .union([
                                                                                z
                                                                                    .object({
                                                                                        language: z
                                                                                            .string()
                                                                                            .describe(
                                                                                                "identifies the language of the audio content"
                                                                                            ),
                                                                                        text: z
                                                                                            .string()
                                                                                            .describe(
                                                                                                "audio text used for tts system"
                                                                                            )
                                                                                    })
                                                                                    .describe(
                                                                                        "information about audio text. This part is present if the audio content type is AUDIO_TEXT"
                                                                                    ),
                                                                                z
                                                                                    .null()
                                                                                    .describe(
                                                                                        "information about audio text. This part is present if the audio content type is AUDIO_TEXT"
                                                                                    )
                                                                            ])
                                                                            .describe(
                                                                                "information about audio text. This part is present if the audio content type is AUDIO_TEXT"
                                                                            )
                                                                    )
                                                                    .nullable()
                                                                    .optional(),
                                                                media: z
                                                                    .string()
                                                                    .describe(
                                                                        "used only for audio file, in this case audio content type is AUDIO_FILE"
                                                                    )
                                                                    .nullable()
                                                                    .describe(
                                                                        "used only for audio file, in this case audio content type is AUDIO_FILE"
                                                                    )
                                                                    .optional(),
                                                                scheduledAudioDeliveryRules: z
                                                                    .union([
                                                                        z
                                                                            .object({
                                                                                audioSchedulationType: z
                                                                                    .enum([
                                                                                        "NOW",
                                                                                        "DELIVERY_AT",
                                                                                        "REPEAT_EVERY"
                                                                                    ])
                                                                                    .describe(
                                                                                        "type of audio schedulation"
                                                                                    ),
                                                                                repetitions: z
                                                                                    .number()
                                                                                    .int()
                                                                                    .gte(0)
                                                                                    .describe(
                                                                                        "number of times the audio message must be repeated each occurens. It is only used for REPEAT_EVERY type scheduling"
                                                                                    )
                                                                                    .nullable()
                                                                                    .describe(
                                                                                        "number of times the audio message must be repeated each occurens. It is only used for REPEAT_EVERY type scheduling"
                                                                                    )
                                                                                    .optional(),
                                                                                repeatEvery: z
                                                                                    .number()
                                                                                    .int()
                                                                                    .describe(
                                                                                        "period of time that must pass between an audio repetition and the next. This field is in seconds. It is only used for REPEAT_EVERY type scheduling"
                                                                                    )
                                                                                    .nullable()
                                                                                    .describe(
                                                                                        "period of time that must pass between an audio repetition and the next. This field is in seconds. It is only used for REPEAT_EVERY type scheduling"
                                                                                    )
                                                                                    .optional(),
                                                                                startDateTime: z
                                                                                    .string()
                                                                                    .describe(
                                                                                        "scheduling start date. It is only used for REPEAT_EVERY type scheduling"
                                                                                    )
                                                                                    .nullable()
                                                                                    .describe(
                                                                                        "scheduling start date. It is only used for REPEAT_EVERY type scheduling"
                                                                                    )
                                                                                    .optional(),
                                                                                endDateTime: z
                                                                                    .string()
                                                                                    .describe(
                                                                                        "scheduling end date. It is only used for REPEAT_EVERY type scheduling"
                                                                                    )
                                                                                    .nullable()
                                                                                    .describe(
                                                                                        "scheduling end date. It is only used for REPEAT_EVERY type scheduling"
                                                                                    )
                                                                                    .optional(),
                                                                                startTime: z
                                                                                    .string()
                                                                                    .describe(
                                                                                        "scheduling start time. It is only used for REPEAT_EVERY type scheduling"
                                                                                    )
                                                                                    .nullable()
                                                                                    .describe(
                                                                                        "scheduling start time. It is only used for REPEAT_EVERY type scheduling"
                                                                                    )
                                                                                    .optional(),
                                                                                endTime: z
                                                                                    .string()
                                                                                    .describe(
                                                                                        "scheduling end time. It is only used for REPEAT_EVERY type scheduling"
                                                                                    )
                                                                                    .nullable()
                                                                                    .describe(
                                                                                        "scheduling end time. It is only used for REPEAT_EVERY type scheduling"
                                                                                    )
                                                                                    .optional(),
                                                                                daysOfWeek: z
                                                                                    .array(
                                                                                        z
                                                                                            .enum([
                                                                                                "SUNDAY",
                                                                                                "MONDAY",
                                                                                                "TUESDAY",
                                                                                                "WEDNESDAY",
                                                                                                "THURSDAY",
                                                                                                "FRIDAY",
                                                                                                "SATURDAY"
                                                                                            ])
                                                                                            .describe(
                                                                                                "Day of week"
                                                                                            )
                                                                                    )
                                                                                    .max(7)
                                                                                    .describe(
                                                                                        "days of the week when the rule is valid. If the list is empty it is valid every day. It is only used for REPEAT_EVERY type scheduling"
                                                                                    )
                                                                                    .nullable()
                                                                                    .describe(
                                                                                        "days of the week when the rule is valid. If the list is empty it is valid every day. It is only used for REPEAT_EVERY type scheduling"
                                                                                    )
                                                                                    .optional(),
                                                                                deliveryAtDateTime: z
                                                                                    .string()
                                                                                    .describe(
                                                                                        "message delivery date and time. It is only used for DELIVERY_AT type scheduling"
                                                                                    )
                                                                                    .nullable()
                                                                                    .describe(
                                                                                        "message delivery date and time. It is only used for DELIVERY_AT type scheduling"
                                                                                    )
                                                                                    .optional()
                                                                            })
                                                                            .describe(
                                                                                "The delivery rules can be of three types: \n  - NOW the message must be delivered at the time of insertion. \n  - DELIVERY_AT the message must be delivered on the date-time _deliveryAtDateTime_. \n  - REPEAT_EVERY the message begins to be delivered from _startDateTime_ at _startTime_ to _endDateTime_ at _endTime_ evaluating the repetition conditions and _daysOfWeek_ conditions."
                                                                            ),
                                                                        z
                                                                            .null()
                                                                            .describe(
                                                                                "The delivery rules can be of three types: \n  - NOW the message must be delivered at the time of insertion. \n  - DELIVERY_AT the message must be delivered on the date-time _deliveryAtDateTime_. \n  - REPEAT_EVERY the message begins to be delivered from _startDateTime_ at _startTime_ to _endDateTime_ at _endTime_ evaluating the repetition conditions and _daysOfWeek_ conditions."
                                                                            )
                                                                    ])
                                                                    .describe(
                                                                        "The delivery rules can be of three types: \n  - NOW the message must be delivered at the time of insertion. \n  - DELIVERY_AT the message must be delivered on the date-time _deliveryAtDateTime_. \n  - REPEAT_EVERY the message begins to be delivered from _startDateTime_ at _startTime_ to _endDateTime_ at _endTime_ evaluating the repetition conditions and _daysOfWeek_ conditions."
                                                                    )
                                                            })
                                                            .describe(
                                                                "audio message to deliver. This part is present if the content type is AUDIO or AUDIO_VIDEO type for a ScheduledMessage"
                                                            ),
                                                        z
                                                            .null()
                                                            .describe(
                                                                "audio message to deliver. This part is present if the content type is AUDIO or AUDIO_VIDEO type for a ScheduledMessage"
                                                            )
                                                    ])
                                                    .describe(
                                                        "audio message to deliver. This part is present if the content type is AUDIO or AUDIO_VIDEO type for a ScheduledMessage"
                                                    )
                                                    .optional(),
                                                recipientVideoMessagesToDeliver: z
                                                    .union([
                                                        z
                                                            .object({
                                                                videoTexts: z.array(
                                                                    z
                                                                        .object({
                                                                            language: z
                                                                                .string()
                                                                                .describe(
                                                                                    "identifies the language of the video content"
                                                                                ),
                                                                            text: z.string()
                                                                        })
                                                                        .describe(
                                                                            "information about video text"
                                                                        )
                                                                ),
                                                                deliveryRules: z
                                                                    .union([
                                                                        z
                                                                            .object({
                                                                                videoSchedulationType: z
                                                                                    .enum([
                                                                                        "WHEN",
                                                                                        "CONTINUOS_VISUALIZATION"
                                                                                    ])
                                                                                    .describe(
                                                                                        "type of audio schedulation"
                                                                                    ),
                                                                                startDateTime: z
                                                                                    .string()
                                                                                    .describe(
                                                                                        "scheduling start date"
                                                                                    )
                                                                                    .nullable()
                                                                                    .describe(
                                                                                        "scheduling start date"
                                                                                    ),
                                                                                endDateTime: z
                                                                                    .string()
                                                                                    .describe(
                                                                                        "scheduling end date"
                                                                                    )
                                                                                    .nullable()
                                                                                    .describe(
                                                                                        "scheduling end date"
                                                                                    ),
                                                                                startTime: z
                                                                                    .string()
                                                                                    .describe(
                                                                                        "scheduling start time. Could be null for CONTINUOS_DELIVERY type scheduling"
                                                                                    )
                                                                                    .nullable()
                                                                                    .describe(
                                                                                        "scheduling start time. Could be null for CONTINUOS_DELIVERY type scheduling"
                                                                                    )
                                                                                    .optional(),
                                                                                endTime: z
                                                                                    .string()
                                                                                    .describe(
                                                                                        "scheduling end time. Could be null for CONTINUOS_DELIVERY type scheduling"
                                                                                    )
                                                                                    .nullable()
                                                                                    .describe(
                                                                                        "scheduling end time. Could be null for CONTINUOS_DELIVERY type scheduling"
                                                                                    )
                                                                                    .optional(),
                                                                                daysOfWeek: z
                                                                                    .array(
                                                                                        z
                                                                                            .enum([
                                                                                                "SUNDAY",
                                                                                                "MONDAY",
                                                                                                "TUESDAY",
                                                                                                "WEDNESDAY",
                                                                                                "THURSDAY",
                                                                                                "FRIDAY",
                                                                                                "SATURDAY"
                                                                                            ])
                                                                                            .describe(
                                                                                                "Day of week"
                                                                                            )
                                                                                    )
                                                                                    .max(7)
                                                                                    .describe(
                                                                                        "days of the week when the rule is valid. If the list is empty it is valid every day. It is only used for WHEN type scheduling"
                                                                                    )
                                                                                    .nullable()
                                                                                    .describe(
                                                                                        "days of the week when the rule is valid. If the list is empty it is valid every day. It is only used for WHEN type scheduling"
                                                                                    )
                                                                                    .optional()
                                                                            })
                                                                            .describe(
                                                                                "The delivery rules can be of two types: \n  - WHEN the message must be delivered to the video from the _startDateTime_ date to the _endDateTime_ date only in the time interval between the _startTime_ time and _endTime_ time for each day in the _daysOfWeek_ list\n  - CONTINUOUS_VISUALIZATION the message must be delivered to the video from the _startDateTime_ date (at _startTime_ if exists) to the _endDateTime_ (at _endTime_ if exists)"
                                                                            ),
                                                                        z
                                                                            .null()
                                                                            .describe(
                                                                                "The delivery rules can be of two types: \n  - WHEN the message must be delivered to the video from the _startDateTime_ date to the _endDateTime_ date only in the time interval between the _startTime_ time and _endTime_ time for each day in the _daysOfWeek_ list\n  - CONTINUOUS_VISUALIZATION the message must be delivered to the video from the _startDateTime_ date (at _startTime_ if exists) to the _endDateTime_ (at _endTime_ if exists)"
                                                                            )
                                                                    ])
                                                                    .describe(
                                                                        "The delivery rules can be of two types: \n  - WHEN the message must be delivered to the video from the _startDateTime_ date to the _endDateTime_ date only in the time interval between the _startTime_ time and _endTime_ time for each day in the _daysOfWeek_ list\n  - CONTINUOUS_VISUALIZATION the message must be delivered to the video from the _startDateTime_ date (at _startTime_ if exists) to the _endDateTime_ (at _endTime_ if exists)"
                                                                    )
                                                            })
                                                            .describe(
                                                                "video message to deliver. This part is present if the content type is VIDEO or AUDIO_VIDEO type for a ScheduledMessage"
                                                            ),
                                                        z
                                                            .null()
                                                            .describe(
                                                                "video message to deliver. This part is present if the content type is VIDEO or AUDIO_VIDEO type for a ScheduledMessage"
                                                            )
                                                    ])
                                                    .describe(
                                                        "video message to deliver. This part is present if the content type is VIDEO or AUDIO_VIDEO type for a ScheduledMessage"
                                                    )
                                                    .optional()
                                            })
                                            .describe(
                                                "scheduled message to delivery at specified _vehicleJourneys_. This part is present if the scheduled message must be delivered on channel ONBOARD"
                                            ),
                                        z
                                            .null()
                                            .describe(
                                                "scheduled message to delivery at specified _vehicleJourneys_. This part is present if the scheduled message must be delivered on channel ONBOARD"
                                            )
                                    ])
                                    .describe(
                                        "scheduled message to delivery at specified _vehicleJourneys_. This part is present if the scheduled message must be delivered on channel ONBOARD"
                                    )
                                    .optional(),
                                externalSystemRecipient: z
                                    .union([
                                        z
                                            .object({
                                                messageContents: z.array(
                                                    z
                                                        .union([
                                                            z
                                                                .object({
                                                                    language: z
                                                                        .string()
                                                                        .describe(
                                                                            "identifies the language of the external content"
                                                                        ),
                                                                    text: z.string()
                                                                })
                                                                .describe("information about external text"),
                                                            z
                                                                .null()
                                                                .describe("information about external text")
                                                        ])
                                                        .describe("information about external text")
                                                ),
                                                externalPoints: z
                                                    .array(
                                                        z
                                                            .object({
                                                                id: z
                                                                    .string()
                                                                    .describe(
                                                                        "**This refers to code external to Moova**. It is retrieved by invoking the SVCPLN-NetworkCode service"
                                                                    ),
                                                                nameLong: z
                                                                    .union([z.string(), z.null()])
                                                                    .optional()
                                                            })
                                                            .describe(
                                                                "point where to deliver the scheduled message"
                                                            )
                                                    )
                                                    .nullable()
                                                    .optional(),
                                                startDateTime: z
                                                    .string()
                                                    .describe("scheduling start date-time")
                                                    .nullable()
                                                    .describe("scheduling start date-time")
                                                    .optional(),
                                                endDateTime: z
                                                    .string()
                                                    .describe("scheduling end date-time")
                                                    .nullable()
                                                    .describe("scheduling end date-time")
                                                    .optional()
                                            })
                                            .describe(
                                                "scheduled message to delivery to external system. It can delivered to _externalPoints_. This part is present if the scheduled message must be delivered on channel EXTERNAL"
                                            ),
                                        z
                                            .null()
                                            .describe(
                                                "scheduled message to delivery to external system. It can delivered to _externalPoints_. This part is present if the scheduled message must be delivered on channel EXTERNAL"
                                            )
                                    ])
                                    .describe(
                                        "scheduled message to delivery to external system. It can delivered to _externalPoints_. This part is present if the scheduled message must be delivered on channel EXTERNAL"
                                    )
                                    .optional()
                            })
                            .describe(
                                "it is filled only if the message is of type SCHEDULED_MESSAGE. The scheduled message can be delivered through one or more channels: ONGROUND, ONBOARD or EXTERNAL"
                            ),
                        z
                            .null()
                            .describe(
                                "it is filled only if the message is of type SCHEDULED_MESSAGE. The scheduled message can be delivered through one or more channels: ONGROUND, ONBOARD or EXTERNAL"
                            )
                    ])
                    .describe(
                        "it is filled only if the message is of type SCHEDULED_MESSAGE. The scheduled message can be delivered through one or more channels: ONGROUND, ONBOARD or EXTERNAL"
                    )
                    .optional(),
                monitoredJourneyScheduledMessage: z
                    .union([
                        z
                            .object({
                                vehicleJourney: z
                                    .union([
                                        z
                                            .object({
                                                datedVehicleJourneyRef: z
                                                    .string()
                                                    .describe("id of vehicle journey"),
                                                dataFrameRef: z
                                                    .string()
                                                    .describe(
                                                        "unique identifier of data frame within participant service"
                                                    ),
                                                vehicleJourneyName: z
                                                    .string()
                                                    .describe("name of vehicle journey")
                                            })
                                            .describe("vehicle journey identifiers information"),
                                        z.null().describe("vehicle journey identifiers information")
                                    ])
                                    .describe("vehicle journey identifiers information"),
                                messageContentType: z
                                    .enum(["AUDIO", "VIDEO", "AUDIO_VIDEO"])
                                    .describe("message content type"),
                                deliveryPoints: z
                                    .array(
                                        z
                                            .object({
                                                id: z
                                                    .string()
                                                    .describe(
                                                        "**This refers to code external to Moova**. It is retrieved by invoking the SVCPLN-NetworkCode service"
                                                    ),
                                                nameLong: z.union([z.string(), z.null()]).optional()
                                            })
                                            .describe("point where to deliver the scheduled message")
                                    )
                                    .nullable(),
                                audioMessageContents: z
                                    .union([
                                        z
                                            .object({
                                                audioTexts: z
                                                    .array(
                                                        z
                                                            .union([
                                                                z
                                                                    .object({
                                                                        language: z
                                                                            .string()
                                                                            .describe(
                                                                                "identifies the language of the content"
                                                                            ),
                                                                        audioText: z
                                                                            .string()
                                                                            .describe(
                                                                                "audio text used for tts system"
                                                                            )
                                                                    })
                                                                    .describe(
                                                                        "audio message content to be delivered for monitored journey scheduled message"
                                                                    ),
                                                                z
                                                                    .null()
                                                                    .describe(
                                                                        "audio message content to be delivered for monitored journey scheduled message"
                                                                    )
                                                            ])
                                                            .describe(
                                                                "audio message content to be delivered for monitored journey scheduled message"
                                                            )
                                                    )
                                                    .describe("list of audio message text"),
                                                deliveryRules: z
                                                    .union([
                                                        z
                                                            .object({
                                                                repetitions: z
                                                                    .number()
                                                                    .int()
                                                                    .nullable()
                                                                    .optional(),
                                                                repeatEvery: z
                                                                    .number()
                                                                    .int()
                                                                    .nullable()
                                                                    .optional(),
                                                                scheduledArrival: z
                                                                    .boolean()
                                                                    .nullable()
                                                                    .optional(),
                                                                scheduledDeparture: z
                                                                    .boolean()
                                                                    .nullable()
                                                                    .optional(),
                                                                estimatedArrival: z
                                                                    .boolean()
                                                                    .nullable()
                                                                    .optional(),
                                                                estimatedDeparture: z
                                                                    .boolean()
                                                                    .nullable()
                                                                    .optional(),
                                                                eventType: z
                                                                    .union([
                                                                        z
                                                                            .string()
                                                                            .describe(
                                                                                "one of the event for messages to deliver on board ARRIVING DEPARTING ARRIVED DEPARTED\n  "
                                                                            ),
                                                                        z
                                                                            .null()
                                                                            .describe(
                                                                                "one of the event for messages to deliver on board ARRIVING DEPARTING ARRIVED DEPARTED\n  "
                                                                            )
                                                                    ])
                                                                    .describe(
                                                                        "one of the event for messages to deliver on board ARRIVING DEPARTING ARRIVED DEPARTED\n  "
                                                                    )
                                                                    .optional()
                                                            })
                                                            .describe(
                                                                "Delivery Rule for monitored journey scheduled message"
                                                            ),
                                                        z
                                                            .null()
                                                            .describe(
                                                                "Delivery Rule for monitored journey scheduled message"
                                                            )
                                                    ])
                                                    .describe(
                                                        "Delivery Rule for monitored journey scheduled message"
                                                    ),
                                                deliveryType: z
                                                    .union([
                                                        z.literal("ON_EVENT"),
                                                        z.literal("ON_SCHEDULE"),
                                                        z.literal(null)
                                                    ])
                                                    .describe(
                                                        "delivery type of message associated with vehicle journeys"
                                                    )
                                            })
                                            .describe(
                                                "audio message content to be delivered for monitored journey scheduled message with delivery rules.\nAudio messages can be delivered in three delivery types specified in the _deliveryType_ field: \n- ON_EVENT the message is delivered for vehicle journey when that vehicle journey generates a specified event for a defined Point in _deliveryPoints_ (e.g. ARRIVING)\n- ON_SCHEDULE the message is delivered on a specific vehicle journey scheduling date happens for a defined Point in _deliveryPoints_ (e.g. estimated arrival time)"
                                            ),
                                        z
                                            .null()
                                            .describe(
                                                "audio message content to be delivered for monitored journey scheduled message with delivery rules.\nAudio messages can be delivered in three delivery types specified in the _deliveryType_ field: \n- ON_EVENT the message is delivered for vehicle journey when that vehicle journey generates a specified event for a defined Point in _deliveryPoints_ (e.g. ARRIVING)\n- ON_SCHEDULE the message is delivered on a specific vehicle journey scheduling date happens for a defined Point in _deliveryPoints_ (e.g. estimated arrival time)"
                                            )
                                    ])
                                    .describe(
                                        "audio message content to be delivered for monitored journey scheduled message with delivery rules.\nAudio messages can be delivered in three delivery types specified in the _deliveryType_ field: \n- ON_EVENT the message is delivered for vehicle journey when that vehicle journey generates a specified event for a defined Point in _deliveryPoints_ (e.g. ARRIVING)\n- ON_SCHEDULE the message is delivered on a specific vehicle journey scheduling date happens for a defined Point in _deliveryPoints_ (e.g. estimated arrival time)"
                                    )
                                    .optional(),
                                videoTexts: z
                                    .array(
                                        z
                                            .object({
                                                language: z
                                                    .string()
                                                    .describe("identifies the language of the content"),
                                                videoText: z
                                                    .string()
                                                    .describe("audio text used for tts system")
                                            })
                                            .describe(
                                                "video message content to be delivered for monitored journey scheduled message"
                                            )
                                    )
                                    .describe("list of video message for vehicle journey")
                                    .nullable()
                                    .describe("list of video message for vehicle journey")
                                    .optional()
                            })
                            .describe(
                                "is filled only if the message is of type MONITORED_JOURNEY_SCHEDULED_MESSAGE"
                            ),
                        z
                            .null()
                            .describe(
                                "is filled only if the message is of type MONITORED_JOURNEY_SCHEDULED_MESSAGE"
                            )
                    ])
                    .describe("is filled only if the message is of type MONITORED_JOURNEY_SCHEDULED_MESSAGE")
                    .optional()
            })
            .describe("Object containing the information of a scheduled message inserted by an operator"),
        extraPayload: z
            .union([
                z.object({}).describe("Optional extention of payload object"),
                z.null().describe("Optional extention of payload object")
            ])
            .describe("Optional extention of payload object")
            .optional()
    })
    .strict();

export type RamiMessage = z.infer<typeof ramiMessageSchema>;

// only onGroundRecipient recipient type is used in practice with scheduledMessages
type RamiScheduledMessageRecipient = Pick<
    NonNullable<RamiMessage["payload"]["scheduledMessage"]>,
    "onGroundRecipient"
>["onGroundRecipient"];

export type RamiMessageVideoContent = NonNullable<
    Pick<
        NonNullable<RamiScheduledMessageRecipient>,
        "recipientVideoMessagesToDeliver"
    >["recipientVideoMessagesToDeliver"]
>;
