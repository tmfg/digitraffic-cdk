export type GmlEnvelope = {
    'gml:Envelope': {
        '$': {
            'srsName': string,
        },
        'gml:lowerCorner': string,
        'gml:upperCorner': string,
    },
}

export type S124Member = {
    'S124:S124_NavigationalWarningPart': {
        '$': {
            'gml:id' : string,
        },
        id: string,
        geometry: unknown,
        Subject?: {
            text: string,
        },
        header: {
            '$': {
                'owns': string,
            },
        },
    },
}

export type S124MessageSeriesIdentifier = {
    NameOfSeries: string,
    typeOfWarning : string,
    warningNumber : number,
    year : number,
    productionAgency: {
        language: string,
        text: string,
    },
    country: string,
}

export type S124FixedDateRange = {
    timeOfDayStart?: string,
    timeOfDayEnd?: string,
    dateStart: {
        date: string,
    },
    dateEnd?: {
        date: string,
    },
}

export type S124IMember = {
    'S124:S124_NWPreamble': {
        '$': {
            'gml:id' : string,
        },
        id: string,
        messageSeriesIdentifier : S124MessageSeriesIdentifier,
        sourceDate: string,
        generalArea: string,
        locality : {
            text: string,
        },
        title:  {
            text : string,
        },
        fixedDateRange? : S124FixedDateRange,
        theWarningPart: {
            '$': {
                'xlink:href': string,
            },
        },
    },

}

export type S124DataSet = {
    'S124:DataSet' : {
        '$': {
            'xmlns:S124': string,
            'xsi:schemaLocation': string,
            'xmlns:xsi': string,
            'xmlns:gml': string,
            'xmlns:S100': string,
            'xmlns:xlink': string,
            'gml:id': string,
        },
        "gml:boundedBy": GmlEnvelope,
        "member" : S124Member,
        "imember" : S124IMember,
    },
};
