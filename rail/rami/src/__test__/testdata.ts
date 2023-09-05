export const validRamiMonitoredJourneyScheduledMessage = {
    headers: {
        e2eId: "5639fbde-f91e-4b5d-bb28-34061b557b37",
        organisation: "MOOVA",
        source: "ihbinf-infomobilityschedule-prc-messagepublisher",
        eventType: "OperatorScheduledMessage",
        partitionKey: "MVM20230521610102170",
        recordedAtTime: "2023-05-21T06:10:10.425660994Z"
    },
    payload: {
        messageId: "MVM20230521610102170",
        messageVersion: 1,
        title: "xhm",
        messageType: "MONITORED_JOURNEY_SCHEDULED_MESSAGE",
        operation: "INSERT",
        creationDateTime: "2023-05-21T06:10:10.217Z",
        startValidity: "2023-06-12T06:10:10.217Z",
        endValidity: "2023-06-20T00:00:00Z",
        scheduledMessage: null,
        monitoredJourneyScheduledMessage: {
            vehicleJourney: {
                datedVehicleJourneyRef: "100274",
                dataFrameRef: "2023-05-21",
                vehicleJourneyName: "274"
            },
            messageContentType: "AUDIO_VIDEO",
            deliveryPoints: [
                {
                    id: "KJÄ",
                    nameLong: "kemijärvi"
                },
                {
                    id: "MIS",
                    nameLong: "misi"
                }
            ],
            audioMessageContents: {
                audioTexts: [
                    {
                        language: "fi_FI",
                        audioText:
                            "Huomio! InterCity juna 274 Helsinkiin on korvattu linja-autolla välillä Kemijärvi-Rovaniemi. Linja-auto lähtee aseman edestä."
                    },
                    {
                        language: "sv_SE",
                        audioText:
                            "Observera! InterCity-tåg 274 till Helsingfors har ersatts av en buss mellan Kemijärvi och Rovaniemi. Bussen går framför stationen."
                    },
                    {
                        language: "en_GB",
                        audioText:
                            " Attention! InterCity train 274 to Helsinki has been replaced by a bus between Kemijärvi and Rovaniemi. The bus leaves in front of the station."
                    }
                ],
                deliveryRules: {
                    repetitions: 1,
                    repeatEvery: 5,
                    scheduledArrival: false,
                    scheduledDeparture: false,
                    estimatedArrival: false,
                    estimatedDeparture: false,
                    eventType: ""
                },
                deliveryType: "ON_SCHEDULE"
            },
            videoTexts: [
                {
                    language: "fi_FI",
                    videoText:
                        "Huomio! InterCity juna 274 Helsinkiin on korvattu linja-autolla välillä Kemijärvi-Rovaniemi. Linja-auto lähtee aseman edestä."
                },
                {
                    language: "sv_SE",
                    videoText:
                        "Observera! InterCity-tåg 274 till Helsingfors har ersatts av en buss mellan Kemijärvi och Rovaniemi. Bussen går framför stationen."
                },
                {
                    language: "en_GB",
                    videoText:
                        " Attention! InterCity train 274 to Helsinki has been replaced by a bus between Kemijärvi and Rovaniemi. The bus leaves in front of the station."
                }
            ]
        }
    }
};

export const validRamiScheduledMessage = {
    headers: {
        e2eId: "0ab4a9b8-1304-4e2d-aeab-cd2c528b1d3e",
        organisation: "MOOVA",
        source: "ihbinf-infomobilityschedule-prc-messagepublisher",
        eventType: "OperatorScheduledMessage",
        partitionKey: "SHM20230428163829804",
        recordedAtTime: "2023-05-24T05:16:04.946619997Z"
    },
    payload: {
        messageId: "SHM20230428163829804",
        messageVersion: 3,
        title: "Palokellojen kuulutus + teksti Hki",
        messageType: "SCHEDULED_MESSAGE",
        operation: "UPDATE",
        creationDateTime: "2023-05-24T05:16:03.704Z",
        startValidity: "2023-05-23T21:00:00Z",
        endValidity: "2023-05-24T20:59:59Z",
        scheduledMessage: {
            situations: [],
            deliveryChannels: ["ONGROUND"],
            onGroundRecipient: {
                messageContentType: "AUDIO_VIDEO",
                deliveryPoints: [
                    {
                        id: "HKI",
                        nameLong: "Helsinki"
                    }
                ],
                recipientAudioMessagesToDeliver: {
                    audioContentType: "AUDIO_TEXT",
                    audioText: [
                        {
                            language: "en_GB",
                            text: "Attention. We perform monthly tests of the fire alarm system at the railway station. In connection with the tests, the alarm bells will soon ring for a short time. The fire alarm test does not require leaving the building. We apologize for the disturbance."
                        },
                        {
                            language: "fi_FI",
                            text: "Huomio! Suoritamme rautatieasemalla paloilmoitinjärjestelmän kuukausitestejä. Testien yhteydessä hälytyskellot soivat hetken kuluttua lyhyen ajan. Palokellojen testi ei edellytä rakennuksesta poistumista. Pahoittelemme häiriötä."
                        },
                        {
                            language: "sv_SE",
                            text: "Observera. Vi utför månatliga tester av brandlarmsystemet på järnvägsstationen. I samband med testerna ringer varningsklockorna snart en kort stund. Brandlarmtestet kräver inte att man lämnar byggnaden. Vi ber om ursäkt för störningen."
                        }
                    ],
                    media: null,
                    scheduledAudioDeliveryRules: {
                        audioSchedulationType: "REPEAT_EVERY",
                        repetitions: 1,
                        repeatEvery: 5,
                        startDateTime: "2023-05-23T21:00:00Z",
                        endDateTime: "2023-05-24T20:59:59Z",
                        startTime: "09:45",
                        endTime: "10:30",
                        daysOfWeek: [
                            "SUNDAY",
                            "MONDAY",
                            "TUESDAY",
                            "WEDNESDAY",
                            "THURSDAY",
                            "FRIDAY",
                            "SATURDAY"
                        ],
                        deliveryAtDateTime: null
                    }
                },
                recipientVideoMessagesToDeliver: {
                    videoTexts: [
                        {
                            language: "en_GB",
                            text: "We perform monthly tests of the fire alarm system at the railway station. In connection with the tests, the alarm bells will soon ring for a short time. The fire alarm test does not require leaving the building. We apologize for the disturbance."
                        },
                        {
                            language: "fi_FI",
                            text: "Suoritamme rautatieasemalla paloilmoitinjärjestelmän kuukausitestejä. Testien yhteydessä hälytyskellot soivat hetken kuluttua lyhyen ajan. Palokellojen testi ei edellytä rakennuksesta poistumista. Pahoittelemme häiriötä."
                        },
                        {
                            language: "sv_SE",
                            text: " Vi utför månatliga tester av brandlarmsystemet på järnvägsstationen. I samband med testerna ringer varningsklockorna snart en kort stund. Brandlarmtestet kräver inte att man lämnar byggnaden. Vi ber om ursäkt för störningen."
                        }
                    ],
                    deliveryRules: {
                        videoSchedulationType: "WHEN",
                        startDateTime: "2023-05-23T21:00:00Z",
                        endDateTime: "2023-05-24T20:59:59Z",
                        startTime: "09:45",
                        endTime: "10:30",
                        daysOfWeek: ["SUNDAY", "MONDAY", "TUESDAY", "THURSDAY", "FRIDAY", "SATURDAY"]
                    }
                }
            },
            onBoardRecipient: null,
            externalSystemRecipient: null
        },
        monitoredJourneyScheduledMessage: null
    }
};
