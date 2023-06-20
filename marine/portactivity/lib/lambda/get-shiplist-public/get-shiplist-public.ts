import { getShiplist } from "../../service/shiplist";
import { DTDatabase, inDatabaseReadonly } from "@digitraffic/common/dist/database/database";
import * as IdUtils from "@digitraffic/common/dist/marine/id_utils";
import { MediaType } from "@digitraffic/common/dist/aws/types/mediatypes";
import { ProxyLambdaRequest, ProxyLambdaResponse } from "@digitraffic/common/dist/aws/types/proxytypes";
import { SecretHolder } from "@digitraffic/common/dist/aws/runtime/secrets/secret-holder";
import { RdsHolder } from "@digitraffic/common/dist/aws/runtime/secrets/rds-holder";
import { GenericSecret } from "@digitraffic/common/dist/aws/runtime/secrets/secret";
import { PublicApiTimestamp } from "../../model/timestamp";

const rdsHolder = RdsHolder.create();
const secretHolder = SecretHolder.create<ShiplistSecret>("shiplist");

export interface ShiplistSecret extends GenericSecret {
    readonly auth: string;
}

function response(
    statusCode: number,
    message: string,
    contentType: MediaType = MediaType.TEXT_PLAIN
): ProxyLambdaResponse {
    return {
        statusCode,
        body: message,
        headers: {
            "content-type": contentType
        }
    };
}

interface ShiplistParameters {
    auth: string;
    locode: string;
    interval?: string;
}

class ValidationError extends Error {
    statusCode: number;

    constructor(statusCode: number, body: string) {
        super(body);
        this.statusCode = statusCode;
    }
}

function validateParameters(
    parameters: Partial<ShiplistParameters>,
    secret: ShiplistSecret
): ShiplistParameters {
    if (!parameters.auth) {
        throw new ValidationError(401, "Missing authentication");
    }
    if (parameters.auth !== secret.auth) {
        throw new ValidationError(403, "Invalid authentication");
    }
    if (!parameters.locode) {
        throw new ValidationError(400, "Missing LOCODE");
    }
    if (!IdUtils.isValidLOCODE(parameters.locode)) {
        throw new ValidationError(400, "Invalid LOCODE");
    }

    return {
        auth: parameters.auth,
        locode: parameters.locode,
        interval: parameters.interval
    };
}

export const handler = (event: ProxyLambdaRequest): Promise<ProxyLambdaResponse> => {
    return rdsHolder
        .setCredentials()
        .then(() => secretHolder.get())
        .then((secret: ShiplistSecret) => {
            const parameters = validateParameters(event.queryStringParameters, secret);
            const interval = Number.parseInt(parameters.interval ?? "4*24");

            return inDatabaseReadonly(async (db: DTDatabase): Promise<ProxyLambdaResponse> => {
                const shiplist = await getShiplist(db, parameters.locode, interval);

                return response(200, getPageSource(shiplist), MediaType.TEXT_HTML);
            });
        })
        .catch((error) => {
            if (error instanceof ValidationError) {
                return response(error.statusCode, error.message);
            }

            return response(500, "internal error");
        });
};

function getPageSource(shiplist: PublicApiTimestamp[]): string {
    return `
<html>

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">
    <link rel="stylesheet" href="https://unpkg.com/bootstrap-table@1.18.0/dist/bootstrap-table.min.css">
    <script src="https://code.jquery.com/jquery-3.5.1.slim.min.js"
        integrity="sha256-4+XzXVhsDmqanXGHaHvgh1gMQKX40OUvDEBTu8JcmNs=" crossorigin="anonymous"></script>
    <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js"></script>
    <script src="https://unpkg.com/bootstrap-table@1.18.0/dist/bootstrap-table.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/ramda/0.27.1/ramda.min.js"
        integrity="sha512-rZHvUXcc1zWKsxm7rJ8lVQuIr1oOmm7cShlvpV0gWf0RvbcJN6x96al/Rp2L2BI4a4ZkT2/YfVe/8YvB2UHzQw=="
        crossorigin="anonymous"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.29.1/moment.min.js"
        integrity="sha512-qTXRIMyZIFb8iQcfjXWCO8+M5Tbc38Qi5WzdPOYZHIlZpzBHG3L3by84BBBOiRGiEb7KKtAOAs5qYdUiZiQNNQ=="
        crossorigin="anonymous"></script>
    <style>
        .nav-link:not(.active) {
            background-color: #e6e6e6;
            color: #aaaaaa;
        }
        .nav-link:hover, .nav-link {
            font-weight: bold;
            text-decoration: inherit;
            color: inherit;
        }
        td,th {
            font-size: 14px;
        }
        .table th {
            border-top: 0;
            padding-top: 1px;
        }
        /* Override Bootstrap row negative margins */
        thead .row,
        tbody .row {
            margin-left: 0px;
            margin-right: 0px;
        }

        /* Try to prevent time wrapping */
        td.col-3 {
            padding-left: 0.25rem;
            padding-right: 0.25rem;
        }

        .header {
            background-color: #444444;
        }

        .header .col-1:first-child {
            padding-left: 2rem;
        }

        .header img {
            height: 50px;
        }

        .logo {
            display: flex;
        }
        
        .logo svg {
            width: 106px;
        }

        .logo-name {
            width: 150px;
        }
    
    </style>
</head>

<body>

    <header class="header">
        <div class="row">
            <div class="col-1 logo">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 252.2 41.76"><title>Fintraffic logo</title><path d="M102.58,3.92H82.69a.58.58,0,0,0-.57.57V35.64a.57.57,0,0,0,.57.56h5.52a.56.56,0,0,0,.56-.56V23.29a.29.29,0,0,1,.29-.28H101a.56.56,0,0,0,.56-.56V18.21a.56.56,0,0,0-.56-.56H89.06a.29.29,0,0,1-.29-.28V9.59a.29.29,0,0,1,.29-.28h13.52a.56.56,0,0,0,.56-.56V4.49A.57.57,0,0,0,102.58,3.92Z" fill="#fff"></path><path d="M129.3,11.77a6.79,6.79,0,0,0-6.63,4.3.28.28,0,0,1-.5.05l-2.08-3.49a.86.86,0,0,0-.73-.42h-2.62a.57.57,0,0,0-.56.57V35.64a.56.56,0,0,0,.56.56H122a.56.56,0,0,0,.57-.56v-13c0-4.38,2.25-5.64,4-5.64,2.3,0,3.84,1.36,3.84,5.58V35.64a.56.56,0,0,0,.56.56h5.28a.56.56,0,0,0,.56-.56V20.71C136.88,15.56,133.88,11.77,129.3,11.77Z" fill="#fff"></path><path d="M151.84,31.29a11.89,11.89,0,0,1-1.4.08,2.54,2.54,0,0,1-1.95-.58,2.84,2.84,0,0,1-.51-1.9V17.2a.28.28,0,0,1,.28-.29h3.26a.56.56,0,0,0,.56-.56V12.78a.57.57,0,0,0-.56-.57h-3.26a.27.27,0,0,1-.28-.28V5.24a.43.43,0,0,0-.64-.37L142,8a.84.84,0,0,0-.42.73v3.23a.27.27,0,0,1-.28.28h-2.66a.57.57,0,0,0-.56.57v3.57a.56.56,0,0,0,.56.56h2.66a.28.28,0,0,1,.28.29V29.84q.13,6.81,6.87,6.8a13,13,0,0,0,3.36-.43.7.7,0,0,0,.52-.68V31.7A.41.41,0,0,0,151.84,31.29Z" fill="#fff"></path><path d="M168.2,12c-1.33-.15-4.74,0-6.69,4.16a.28.28,0,0,1-.5,0l-2.11-3.54a.84.84,0,0,0-.73-.42h-2.48a.57.57,0,0,0-.56.57V35.64a.56.56,0,0,0,.56.56H161a.56.56,0,0,0,.56-.56V21.89c0-3,3.07-4.85,6.61-3.85a.42.42,0,0,0,.55-.39V12.53A.55.55,0,0,0,168.2,12Z" fill="#fff"></path><path d="M189.74,30.66V20.26a7.8,7.8,0,0,0-2.6-6.26,10.47,10.47,0,0,0-7-2.23,13.33,13.33,0,0,0-5.28,1,8.47,8.47,0,0,0-3.63,2.78A6.41,6.41,0,0,0,169.92,19a.43.43,0,0,0,.43.45h5.44a.56.56,0,0,0,.55-.46,2.51,2.51,0,0,1,.89-1.67,3.8,3.8,0,0,1,2.54-.77,3.37,3.37,0,0,1,2.69,1,4,4,0,0,1,.85,2.66v1.1a.29.29,0,0,1-.28.28h-2.67q-5.34,0-8.16,2.06a6.68,6.68,0,0,0-2.82,5.46,7,7,0,0,0,2.28,5.51,8.48,8.48,0,0,0,5.87,2.06A7.7,7.7,0,0,0,183.32,34a.2.2,0,0,1,.36.08l.43,1.72a.59.59,0,0,0,.57.45h5.37a.44.44,0,0,0,.42-.58A16.9,16.9,0,0,1,189.74,30.66Zm-6.43-3.1a4.08,4.08,0,0,1-4.39,4.37c-1.86,0-3.14-.92-3.14-2.93s1.54-3.71,5.14-3.71H183a.28.28,0,0,1,.28.28Z" fill="#fff"></path><path d="M251.62,27.91h-4.89a.57.57,0,0,0-.56.51,3.36,3.36,0,0,1-1.11,2.08,4.22,4.22,0,0,1-2.89,1,3.9,3.9,0,0,1-3.43-1.62q-1.12-1.62-1.13-5.33v-.67q0-3.66,1.14-5.29a4.29,4.29,0,0,1,6.31-.46,4.18,4.18,0,0,1,1.11,2.52.58.58,0,0,0,.56.52h4.9a.57.57,0,0,0,.57-.59,8.93,8.93,0,0,0-2.74-6.23,10.13,10.13,0,0,0-7.22-2.56,10.3,10.3,0,0,0-8.09,3.3,12.85,12.85,0,0,0-3,8.85v.42q0,5.76,3,9a10.42,10.42,0,0,0,8.12,3.27,11.18,11.18,0,0,0,5-1.12,8.75,8.75,0,0,0,3.58-3.14,8.19,8.19,0,0,0,1.3-3.88A.56.56,0,0,0,251.62,27.91Z" fill="#fff"></path> <rect x="105.7" y="12.21" width="6.43" height="23.99" rx="0.56" fill="#fff"></rect> <circle cx="108.92" cy="6.56" r="3.59" fill="#fff"></circle><path d="M228,12.21H214.24a.27.27,0,0,1-.28-.28V10.29c0-2.26,1.2-3.4,3.61-3.4a10.46,10.46,0,0,1,1.55.11.41.41,0,0,0,.47-.42v-4a.57.57,0,0,0-.45-.55,13.9,13.9,0,0,0-2.81-.34,9,9,0,0,0-6.49,2.22,8.32,8.32,0,0,0-2.31,6.27v1.75a.28.28,0,0,1-.28.28h-7a.27.27,0,0,1-.28-.28V10.29c0-2.26,1.2-3.4,3.61-3.4a10.22,10.22,0,0,1,1.54.11.42.42,0,0,0,.48-.42v-4a.57.57,0,0,0-.45-.55,14,14,0,0,0-2.81-.34,9,9,0,0,0-6.49,2.22,8.32,8.32,0,0,0-2.31,6.27V35.64a.56.56,0,0,0,.56.56h5.3a.57.57,0,0,0,.57-.56V17.2a.28.28,0,0,1,.28-.29h7a.29.29,0,0,1,.28.29V35.64a.56.56,0,0,0,.56.56h5.31a.56.56,0,0,0,.56-.56V17.2a.28.28,0,0,1,.28-.29h3.55a3.35,3.35,0,0,0,1.7-.45l2.22-1.28a.29.29,0,0,1,.44.26v20.2a.57.57,0,0,0,.57.56H228a.56.56,0,0,0,.56-.56V12.78A.57.57,0,0,0,228,12.21Z" fill="#fff"></path><path d="M225.37,3A3.59,3.59,0,1,0,229,6.56,3.59,3.59,0,0,0,225.37,3Z" fill="#fff"></path><path d="M33.55,38.63l-13.82-8a2.86,2.86,0,0,0-2.86,0l-4.29,2.47a2.82,2.82,0,0,1-2.86,0L1.81,28.56a.37.37,0,0,0-.38,0l-1,.6a.77.77,0,0,0,0,1.33l9.34,5.39a2.86,2.86,0,0,0,2.86,0l4.29-2.48a2.86,2.86,0,0,1,2.86,0l13.82,8a2.86,2.86,0,0,0,2.86,0L45.75,36a.76.76,0,0,0,0-1.32l-1-.61a.37.37,0,0,0-.38,0l-7.91,4.57A2.86,2.86,0,0,1,33.55,38.63Z" fill="#fff"></path><path d="M63.38,28.56l-7.9,4.56a2.84,2.84,0,0,1-2.87,0L44.7,28.56a.37.37,0,0,0-.38,0l-7.91,4.56a2.82,2.82,0,0,1-2.86,0l-13.82-8a2.86,2.86,0,0,0-2.86,0l-4.29,2.47a2.86,2.86,0,0,1-2.86,0L1.81,23.06a.37.37,0,0,0-.38,0l-1,.6A.76.76,0,0,0,.38,25l9.34,5.39a2.86,2.86,0,0,0,2.86,0l4.29-2.47a2.86,2.86,0,0,1,2.86,0l13.82,8a2.86,2.86,0,0,0,2.86,0l7.91-4.57a.37.37,0,0,1,.38,0l7.91,4.57a2.88,2.88,0,0,0,2.87,0l9.33-5.39a.77.77,0,0,0,0-1.33l-1-.6A.39.39,0,0,0,63.38,28.56Z" fill="#fff"></path><path d="M52.61,27.62,31.17,15.24a.63.63,0,0,1,0-1.1h0a2.86,2.86,0,0,1,2.86,0L52.61,24.87a2.88,2.88,0,0,0,2.87,0l9.33-5.39a.76.76,0,0,0,0-1.32L34,.38a2.86,2.86,0,0,0-2.86,0L.38,18.16a.76.76,0,0,0,0,1.32l9.34,5.39a2.86,2.86,0,0,0,2.86,0l4.29-2.47a2.82,2.82,0,0,1,2.86,0l13.82,8a2.86,2.86,0,0,0,2.86,0l7.91-4.56a.37.37,0,0,1,.38,0l7.91,4.56a2.88,2.88,0,0,0,2.87,0L64.81,25a.76.76,0,0,0,0-1.32l-1-.61a.41.41,0,0,0-.39,0l-7.9,4.56A2.88,2.88,0,0,1,52.61,27.62Z" fill="#fff"></path> </svg>
            </div>
            <div class="col-1">
                <img class="logo-name" src="https://www.digitraffic.fi/img/digitraffic-logo.svg" />
            </div>
        </div>
    </header>

    <ul class="nav nav-tabs nav-fill" role="tablist">
        <li class="nav-item">
            <a class="nav-link active" id="aluslista-tab" data-toggle="tab" href="#aluslista" role="tab">List by ship</a>
        </li>
        <li class="nav-item">
            <a class="nav-link" id="aikalista-tab" data-toggle="tab" href="#aikalista" role="tab">List by time</a>
        </li>
    </ul>

    <div class="tab-content">

        <div class="tab-pane active" id="aluslista" role="tabpanel">

            <table id="aluslista-table" data-toggle="table">
                <thead>
                    <tr class="row">
                        <th class="col-4">Ship</th>
                        <th class="col-2">Type</th>
                        <th class="col-3">Time</th>
                        <th class="col-3">Source</th>
                    </tr>
                </thead>
            </table>

        </div>
        <div class="tab-pane" id="aikalista" role="tabpanel">

            <table id="aikalista-table" data-toggle="table">
                <thead>
                    <tr class="row">
                        <th class="col-4">Ship</th>
                        <th class="col-2">Type</th>
                        <th class="col-3">Time</th>
                        <th class="col-3">Source</th>
                    </tr>
                </thead>
            </table>

        </div>
    </div>

</body>
<script>
    var shiplist = ${JSON.stringify(shiplist)};

    var currentDate = new Date();

    function buildShiplist() {
        var shipRows = R.compose(R.sortBy(R.prop('name')), R.map(toShipRow), R.toPairs, R.groupBy(R.prop('ship_name')))(shiplist);

        $('#aluslista-table').bootstrapTable({
            rowStyle: () => {
                return {
                    classes: 'row'
                }
            },
            columns: [{
                field: 'name',
                class: 'col-4',
                title: 'Ship',
                sortable: true
            }, {
                field: 'timestamps',
                class: 'col-2',
                title: 'Type',
                formatter: (timestamps) => {
                    return R.map(R.prop('event_type'), timestamps).join('<br/>');
                }
            }, {
                field: 'timestamps',
                class: 'col-3',
                title: 'Time',
                formatter: (timestamps) => {
                    return R.map(timeToString, timestamps).join('<br/>');
                }
            }, {
                field: 'timestamps',
                class: 'col-3',
                title: 'Source',
                formatter: (timestamps) => {
                    return R.map(sourceToString, timestamps).join('<br/>');
                }
            }],
            data: shipRows
        }).removeClass('table-bordered');

        function toShipRow([name, subRows]) {
            return {
                name,
                timestamps: subRows
            };
        }
    }
        
    function buildTimelist() {
        $('#aikalista-table').bootstrapTable({
            rowStyle: () => {
                return {
                    classes: 'row'
                }
            },
            columns: [{
                field: 'ship_name',
                class: 'col-4',
                title: 'Ship'
            }, {
                field: 'event_type',
                class: 'col-2',
                title: 'Type'
            }, {
                field: 'event_time',
                class: 'col-3',
                title: 'Time',
                formatter: timeToString
            }, {
                field: 'source',
                class: 'col-3',
                title: 'Source',
                formatter: (source, obj) => {
                    return sourceToString(obj);
                }
            }],
            data: shiplist
        }).removeClass('table-bordered');
    }

    function isSameDate(date1, date2) {
        return moment(date1).format("D.MM") === moment(date2).format("D.MM");
    }

    function timeToString(e) {
        var eventTime = moment(typeof e === 'string' ? e : e.event_time).local();
        var timestring = eventTime.format("HH:mm");
        if (!isSameDate(moment(currentDate), eventTime)) {
            timestring = eventTime.format("DD.MM HH:mm")
        }
        return timestring;
    }


    function sourceToString(e) {
        var source = e.source === 'Portnet' ? 'PNET' : e.source;
        var hoursAgo = Math.floor((moment().valueOf() - moment(e.record_time).valueOf()) / 1000 / 60 / 60);
        return source + ' (-' + hoursAgo + ' h)';
    }


    buildShiplist();
    buildTimelist();

</script>

</html>    
`;
}
