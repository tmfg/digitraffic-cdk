import { z } from "zod";

// only onGroundRecipient recipient type is used in practice with scheduledMessages

export const recipientAudioMessagesToDeliver = z
    .object({
        audioContentType: z.enum(["AUDIO_TEXT", "AUDIO_FILE"]).describe("type of audio content"),
        audioText: z
            .array(
                z
                    .object({
                        language: z.string().describe("identifies the language of the audio content"),
                        text: z.string().describe("audio text used for tts system")
                    })
                    .describe(
                        "information about audio text. This part is present if the audio content type is AUDIO_TEXT"
                    )
            )
            .nullable()
            .optional(),
        media: z
            .string()
            .describe("used only for audio file, in this case audio content type is AUDIO_FILE")
            .nullable()
            .describe("used only for audio file, in this case audio content type is AUDIO_FILE")
            .optional(),
        scheduledAudioDeliveryRules: z
            .object({
                audioSchedulationType: z
                    .enum(["NOW", "DELIVERY_AT", "REPEAT_EVERY"])
                    .describe("type of audio schedulation"),
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
                    .describe("scheduling start date. It is only used for REPEAT_EVERY type scheduling")
                    .nullable()
                    .describe("scheduling start date. It is only used for REPEAT_EVERY type scheduling")
                    .optional(),
                endDateTime: z
                    .string()
                    .describe("scheduling end date. It is only used for REPEAT_EVERY type scheduling")
                    .nullable()
                    .describe("scheduling end date. It is only used for REPEAT_EVERY type scheduling")
                    .optional(),
                startTime: z
                    .string()
                    .describe("scheduling start time. It is only used for REPEAT_EVERY type scheduling")
                    .nullable()
                    .describe("scheduling start time. It is only used for REPEAT_EVERY type scheduling")
                    .optional(),
                endTime: z
                    .string()
                    .describe("scheduling end time. It is only used for REPEAT_EVERY type scheduling")
                    .nullable()
                    .describe("scheduling end time. It is only used for REPEAT_EVERY type scheduling")
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
                            .describe("Day of week")
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
                    .optional()
            })
            .describe(
                "The delivery rules can be of three types: \n  - NOW the message must be delivered at the time of insertion. \n  - DELIVERY_AT the message must be delivered on the date-time _deliveryAtDateTime_. \n  - REPEAT_EVERY the message begins to be delivered from _startDateTime_ at _startTime_ to _endDateTime_ at _endTime_ evaluating the repetition conditions and _daysOfWeek_ conditions."
            )
    })
    .describe(
        "audio message to deliver. This part is present if the content type is AUDIO or AUDIO_VIDEO type for a ScheduledMessage"
    )
    .nullable()
    .optional();

export const recipientVideoMessagesToDeliver = z
    .object({
        videoTexts: z.array(
            z
                .object({
                    language: z.string().describe("identifies the language of the video content"),
                    text: z.string()
                })
                .describe("information about video text")
        ),
        deliveryRules: z
            .object({
                videoSchedulationType: z
                    .enum(["WHEN", "CONTINUOS_VISUALIZATION"])
                    .describe("type of audio schedulation"),
                startDateTime: z.string().nullable().describe("scheduling start date"),
                endDateTime: z.string().nullable().describe("scheduling end date"),
                startTime: z
                    .string()
                    .nullable()
                    .describe("scheduling start time. Could be null for CONTINUOS_DELIVERY type scheduling")
                    .optional(),
                endTime: z
                    .string()
                    .nullable()
                    .describe("scheduling end time. Could be null for CONTINUOS_DELIVERY type scheduling")
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
                            .describe("Day of week")
                    )
                    .max(7)
                    .describe(
                        "days of the week when the rule is valid. If the list is empty it is valid every day. It is only used for WHEN type scheduling"
                    )
                    .nullable()
                    .optional()
            })
            .describe(
                "The delivery rules can be of two types: \n  - WHEN the message must be delivered to the video from the _startDateTime_ date to the _endDateTime_ date only in the time interval between the _startTime_ time and _endTime_ time for each day in the _daysOfWeek_ list\n  - CONTINUOUS_VISUALIZATION the message must be delivered to the video from the _startDateTime_ date (at _startTime_ if exists) to the _endDateTime_ (at _endTime_ if exists)"
            )
            .optional()
            .nullable()
    })
    .describe(
        "video message to deliver. This part is present if the content type is VIDEO or AUDIO_VIDEO type for a ScheduledMessage"
    )
    .optional()
    .nullable();

export const onGroundRecipient = z
    .object({
        messageContentType: z.enum(["AUDIO", "VIDEO", "AUDIO_VIDEO"]).describe("message content type"),
        deliveryPoints: z
            .array(
                z
                    .object({
                        id: z
                            .string()
                            .describe(
                                "**This refers to code external to Moova**. It is retrieved by invoking the SVCPLN-NetworkCode service"
                            ),
                        nameLong: z.string().optional()
                    })
                    .describe("point where to deliver the scheduled message")
            )
            .nullable(),
        recipientAudioMessagesToDeliver,
        recipientVideoMessagesToDeliver
    })
    .describe(
        "scheduled message to delivery at specified _deliveryPoints_. This part is present if the scheduled message must be delivered on channel ONGROUND"
    )
    .optional();

export const scheduledMessage = z
    .object({
        situations: z
            .array(
                z
                    .object({
                        id: z.string().optional(),
                        name: z.string().optional()
                    })

                    .describe("a Scheduled message optionally can be related to a situation (SIRI)")
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
        onGroundRecipient,
        onBoardRecipient: z
            .object({
                messageContentType: z
                    .enum(["AUDIO", "VIDEO", "AUDIO_VIDEO"])
                    .describe("message content type"),
                vehicleJourneys: z.array(
                    z
                        .object({
                            datedVehicleJourneyRef: z.string().describe("id of vehicle journey"),
                            dataFrameRef: z
                                .string()
                                .describe("unique identifier of data frame within participant service"),
                            vehicleJourneyName: z.string().describe("name of vehicle journey")
                        })
                        .describe("vehicle journey identifiers information")
                ),
                recipientAudioMessagesToDeliver: z
                    .object({
                        audioContentType: z
                            .enum(["AUDIO_TEXT", "AUDIO_FILE"])
                            .describe("type of audio content"),
                        audioText: z
                            .array(
                                z
                                    .object({
                                        language: z
                                            .string()
                                            .describe("identifies the language of the audio content"),
                                        text: z.string().describe("audio text used for tts system")
                                    })
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
                            .object({
                                audioSchedulationType: z
                                    .enum(["NOW", "DELIVERY_AT", "REPEAT_EVERY"])
                                    .describe("type of audio schedulation"),
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
                                            .describe("Day of week")
                                    )
                                    .max(7)
                                    .describe(
                                        "days of the week when the rule is valid. If the list is empty it is valid every day. It is only used for REPEAT_EVERY type scheduling"
                                    )
                                    .nullable()
                                    .optional(),
                                deliveryAtDateTime: z
                                    .string()
                                    .describe(
                                        "message delivery date and time. It is only used for DELIVERY_AT type scheduling"
                                    )
                                    .nullable()
                                    .optional()
                            })
                            .describe(
                                "The delivery rules can be of three types: \n  - NOW the message must be delivered at the time of insertion. \n  - DELIVERY_AT the message must be delivered on the date-time _deliveryAtDateTime_. \n  - REPEAT_EVERY the message begins to be delivered from _startDateTime_ at _startTime_ to _endDateTime_ at _endTime_ evaluating the repetition conditions and _daysOfWeek_ conditions."
                            )
                    })
                    .describe(
                        "audio message to deliver. This part is present if the content type is AUDIO or AUDIO_VIDEO type for a ScheduledMessage"
                    )
                    .nullable()
                    .optional(),
                recipientVideoMessagesToDeliver: z
                    .object({
                        videoTexts: z.array(
                            z
                                .object({
                                    language: z
                                        .string()
                                        .describe("identifies the language of the video content"),
                                    text: z.string()
                                })
                                .describe("information about video text")
                        ),
                        deliveryRules: z
                            .object({
                                videoSchedulationType: z
                                    .enum(["WHEN", "CONTINUOS_VISUALIZATION"])
                                    .describe("type of audio schedulation"),
                                startDateTime: z
                                    .string()
                                    .nullable()
                                    .optional()
                                    .describe("scheduling start date"),
                                endDateTime: z.string().nullable().optional().describe("scheduling end date"),
                                startTime: z
                                    .string()
                                    .describe(
                                        "scheduling start time. Could be null for CONTINUOS_DELIVERY type scheduling"
                                    )
                                    .nullable()
                                    .optional(),
                                endTime: z
                                    .string()
                                    .describe(
                                        "scheduling end time. Could be null for CONTINUOS_DELIVERY type scheduling"
                                    )
                                    .nullable()
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
                                            .describe("Day of week")
                                    )
                                    .max(7)
                                    .describe(
                                        "days of the week when the rule is valid. If the list is empty it is valid every day. It is only used for WHEN type scheduling"
                                    )
                                    .nullable()
                                    .optional()
                            })
                            .describe(
                                "The delivery rules can be of two types: \n  - WHEN the message must be delivered to the video from the _startDateTime_ date to the _endDateTime_ date only in the time interval between the _startTime_ time and _endTime_ time for each day in the _daysOfWeek_ list\n  - CONTINUOUS_VISUALIZATION the message must be delivered to the video from the _startDateTime_ date (at _startTime_ if exists) to the _endDateTime_ (at _endTime_ if exists)"
                            )
                    })
                    .describe(
                        "video message to deliver. This part is present if the content type is VIDEO or AUDIO_VIDEO type for a ScheduledMessage"
                    )
                    .optional()
                    .nullable()
            })
            .describe(
                "scheduled message to delivery at specified _vehicleJourneys_. This part is present if the scheduled message must be delivered on channel ONBOARD"
            )
            .optional()
            .nullable(),
        externalSystemRecipient: z
            .object({
                messageContents: z.array(
                    z
                        .object({
                            language: z.string().describe("identifies the language of the external content"),
                            text: z.string()
                        })
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
                                nameLong: z.string().optional()
                            })
                            .describe("point where to deliver the scheduled message")
                    )
                    .nullable()
                    .optional(),
                startDateTime: z.string().describe("scheduling start date-time").nullable().optional(),
                endDateTime: z.string().describe("scheduling end date-time").nullable().optional()
            })
            .describe(
                "scheduled message to delivery to external system. It can delivered to _externalPoints_. This part is present if the scheduled message must be delivered on channel EXTERNAL"
            )
            .optional()
            .nullable()
    })
    .describe(
        "it is filled only if the message is of type SCHEDULED_MESSAGE. The scheduled message can be delivered through one or more channels: ONGROUND, ONBOARD or EXTERNAL"
    )
    .optional()
    .nullable();
