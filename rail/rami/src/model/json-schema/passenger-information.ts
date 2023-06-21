import { JsonSchema, JsonSchemaType, JsonSchemaVersion } from "aws-cdk-lib/aws-apigateway";
import { WEEKDAYS } from "../dt-rami-message.js";

export const TextSchema: JsonSchema = {
    schema: JsonSchemaVersion.DRAFT4,
    type: JsonSchemaType.OBJECT,
    description: "PassengerInformation message text content schema",
    properties: {
        fi: {
            type: JsonSchemaType.STRING,
            description: "Message text content in Finnish"
        },
        sv: {
            type: JsonSchemaType.STRING,
            description: "Message text content in Swedish"
        },
        en: {
            type: JsonSchemaType.STRING,
            description: "Message text content in English"
        }
    }
};

export function createVideoSchema(textReference: string): JsonSchema {
    return {
        schema: JsonSchemaVersion.DRAFT4,
        type: JsonSchemaType.OBJECT,
        description: "PassengerInformation message video content schema",
        properties: {
            text: {
                ref: textReference
            },
            deliveryRules: {
                type: JsonSchemaType.OBJECT,
                properties: {
                    startDateTime: {
                        type: JsonSchemaType.STRING,
                        description: "Video delivery start date"
                    },
                    endDateTime: {
                        type: JsonSchemaType.STRING,
                        description: "Video delivery end date"
                    },
                    startTime: {
                        type: JsonSchemaType.STRING,
                        description: "Video delivery start time"
                    },
                    endTime: {
                        type: JsonSchemaType.STRING,
                        description: "Video delivery end time"
                    },
                    weekDays: {
                        type: JsonSchemaType.ARRAY,
                        items: {
                            type: JsonSchemaType.STRING,
                            enum: Object.values(WEEKDAYS)
                        },
                        description: "Days of week on which video is delivered"
                    },
                    deliveryType: {
                        type: JsonSchemaType.STRING,
                        enum: ["WHEN", "CONTINUOS_VISUALIZATION"],
                        description:
                            "CONTINUOS_VISUALIZATION: the message is delivered from _startDateTime_ (at _startTime_ if exists) to _endDateTime_ (at _endTime_ if exists) \n WHEN: the message is delivered  from  _startDateTime_ to _endDateTime_ only in the time interval between _startTime_ and _endTime_ for each day in _weekDays_"
                    }
                }
            }
        }
    };
}

export function createAudioSchema(textReference: string): JsonSchema {
    return {
        schema: JsonSchemaVersion.DRAFT4,
        type: JsonSchemaType.OBJECT,
        description: "PassengerInformation message audio content schema",
        properties: {
            text: {
                ref: textReference
            },
            deliveryRules: {
                type: JsonSchemaType.OBJECT,
                properties: {
                    startDateTime: {
                        type: JsonSchemaType.STRING,
                        description: "Audio delivery start date"
                    },
                    endDateTime: {
                        type: JsonSchemaType.STRING,
                        description: "Audio delivery end date"
                    },
                    startTime: {
                        type: JsonSchemaType.STRING,
                        description: "Audio delivery start time"
                    },
                    endTime: {
                        type: JsonSchemaType.STRING,
                        description: "Audio delivery end time"
                    },
                    weekDays: {
                        type: JsonSchemaType.ARRAY,
                        items: {
                            type: JsonSchemaType.STRING,
                            enum: Object.values(WEEKDAYS)
                        },
                        description: "Days of week on which audio is delivered"
                    },
                    deliveryType: {
                        type: JsonSchemaType.STRING,
                        enum: ["NOW", "DELIVERY_AT", "REPEAT_EVERY", "ON_EVENT", "ON_SCHEDULE"],
                        description:
                            "NOW: the message is delivered at the time of insertion \n DELIVERY_AT: the message is delivered on the date-time _deliveryAt_ \n REPEAT_EVERY: the message is delivered from _startDateTime_ at _startTime_ to _endDateTime_ at _endTime_ evaluating the repetition conditions and _weekDays_ conditions \n ON_SCHEDULE: the message is delivered for a specific vehicle journey when a scheduling date happens at a station (e.g. estimated arrival time) \n ON_EVENT: the message is delivered for a vehicle journey when an event specified in _eventType_ (e.g. ARRIVING) happens for a station defined in _stations_"
                    },
                    eventType: {
                        type: JsonSchemaType.STRING,
                        enum: ["ARRIVING", "DEPARTING"],
                        description:
                            "Event type on which message is delivered when _deliveryType_ is ON_EVENT"
                    },
                    deliveryAt: {
                        type: JsonSchemaType.STRING,
                        description:
                            "Date and time on which message is delivered when _deliveryType_ is DELIVERY_AT"
                    },
                    repetitions: {
                        type: JsonSchemaType.INTEGER,
                        description:
                            "Number of times message is repeated on each occurrence when  _deliveryType_ is REPEAT_EVERY"
                    },
                    repeatEvery: {
                        type: JsonSchemaType.INTEGER,
                        description:
                            "Period of time in seconds between repetitions of message when  _deliveryType_ is REPEAT_EVERY"
                    }
                }
            }
        }
    };
}

export function createPassengerInformationMessageSchema(
    audioReference: string,
    videoReference: string
): JsonSchema {
    return {
        schema: JsonSchemaVersion.DRAFT4,
        type: JsonSchemaType.OBJECT,
        description: "PassengerInformation message schema",
        required: ["id", "version", "creationDateTime", "startValidity", "endValidity"],
        properties: {
            id: {
                type: JsonSchemaType.STRING
            },
            version: {
                type: JsonSchemaType.NUMBER
            },
            creationDateTime: {
                type: JsonSchemaType.STRING,
                description: "Date and time when message version was created"
            },
            startValidity: {
                type: JsonSchemaType.STRING,
                description: "Message validity start date and time"
            },
            endValidity: {
                type: JsonSchemaType.STRING,
                description: "Message validity end date and time"
            },
            stations: {
                type: JsonSchemaType.ARRAY,
                items: {
                    type: JsonSchemaType.STRING
                },
                description: "List of stations where message is delivered"
            },
            trainNumber: {
                type: JsonSchemaType.STRING,
                description: "Number of train to which message relates"
            },
            trainDepartureDate: {
                type: JsonSchemaType.STRING,
                description: "Date of departure as a local date for train to which message relates"
            },
            audio: {
                ref: audioReference
            },
            video: {
                ref: videoReference
            }
        }
    };
}
