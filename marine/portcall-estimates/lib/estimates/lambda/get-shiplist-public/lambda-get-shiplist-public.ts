import {DbPublicShiplist, findByLocodePublicShiplist} from '../../db/db-shiplist-public';
import {inDatabase} from 'digitraffic-lambda-postgres/database';
import {IDatabase} from 'pg-promise';
import moment from 'moment-timezone';
import * as R from 'ramda';
import {getDisplayableNameForEventSource} from "../../../event-sourceutil";

export const handler = async (
    event: any
): Promise<any> => {
    if (!event.queryStringParameters.locode) {
        return {statusCode: 400, body: 'Missing locode'};
    }
    return await inDatabase(async (db: IDatabase<any, any>) => {
        const shiplist: DbPublicShiplist[] =
            (await findByLocodePublicShiplist(db, (event.queryStringParameters.locode as string).toUpperCase()))
                .map(e => Object.assign(e, {
                    event_source: getDisplayableNameForEventSource(e.event_source)
                }));
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'text/html'
            },
            body:
                `
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
            width: 50px;
        }

        .logo-name {
            width: 150px;
        }
    
    </style>
</head>

<body>

    <header class="header">
        <div class="row">
            <div class="col-1">
                <img class="logo" src="https://www.digitraffic.fi/img/tmfg_logo-originaali_valkoinen.svg" />
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
                field: 'estimates',
                class: 'col-2',
                title: 'Type',
                formatter: (e) => {
                    return timestampsToString(
                        R.map(R.prop('event_type'), e.etas),
                        R.map(R.prop('event_type'), e.atas),
                        R.map(R.prop('event_type'), e.etds)
                    );
                }
            }, {
                field: 'estimates',
                class: 'col-3',
                title: 'Time',
                formatter: (e) => {
                    return timestampsToString(
                        R.map(timeToString, e.etas),
                        R.map(timeToString, e.atas),
                        R.map(timeToString, e.etds)
                    )
                }
            }, {
                field: 'estimates',
                class: 'col-3',
                title: 'Source',
                formatter: (e) => {
                    return timestampsToString(
                        R.map(sourceToString, e.etas),
                        R.map(sourceToString, e.atas),
                        R.map(sourceToString, e.etds)
                    )
                }
            }],
            data: shipRows
        }).removeClass('table-bordered');

        function toShipRow([name, subRows]) {
            return {
                name,
                estimates: {
                    etas: R.filter(R.propEq('event_type', 'ETA'), subRows),
                    atas: R.filter(R.propEq('event_type', 'ATA'), subRows),
                    etds: R.filter(R.propEq('event_type', 'ETD'), subRows),
                }
            };
        }

        function timestampsToString(etas, atas, etds) {
            return etas.concat(atas).concat(etds).join('<br/>');
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
                field: 'event_source',
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
            timestring = eventTime.format("D.MM HH:mm")
        }
        return timestring;
    }


    function sourceToString(e) {
        var source = e.event_source == 'Portnet' ? 'PNET' : e.event_source;
        var hoursAgo = Math.floor((moment().valueOf() - moment(e.record_time).valueOf()) / 1000 / 60 / 60);
        return source + ' (-' + hoursAgo + ' h)';
    }


    buildShiplist();
    buildTimelist();

</script>

</html>    
`
        }
    });
};
