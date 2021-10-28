import {Location} from "../model/timestamp";

let pilotwebToPortnetLocodeMap: {[key: string]: string} = {};

function needInit(): boolean {
    return Object.keys(pilotwebToPortnetLocodeMap).length === 0;
}

function initMap() {
    pilotwebToPortnetLocodeMap = {};

    pilotwebToPortnetLocodeMap['FIKOY'] = 'FIKOK';

    pilotwebToPortnetLocodeMap['FIPIE'] = 'FIPRS';

    pilotwebToPortnetLocodeMap['FIVAS'] = 'FIVAA';

    pilotwebToPortnetLocodeMap['FIKAK'] = 'FIKAS';

    pilotwebToPortnetLocodeMap['FIMAN'] = 'FIPOR';
    pilotwebToPortnetLocodeMap['FITHK'] = 'FIPOR';

    pilotwebToPortnetLocodeMap['FIHEP'] = 'FIUKI';
    pilotwebToPortnetLocodeMap['FIKMR'] = 'FIUKI';

    pilotwebToPortnetLocodeMap['FILEV'] = 'FIHKO';
    pilotwebToPortnetLocodeMap['FIKVH'] = 'FIHKO';

    pilotwebToPortnetLocodeMap['FIVUH'] = 'FIHEL';
    pilotwebToPortnetLocodeMap['FI401'] = 'FIHEL';
    pilotwebToPortnetLocodeMap['FI402'] = 'FIHEL';
    pilotwebToPortnetLocodeMap['FI403'] = 'FIHEL';
    pilotwebToPortnetLocodeMap['FI404'] = 'FIHEL';
    pilotwebToPortnetLocodeMap['FI405'] = 'FIHEL';

    pilotwebToPortnetLocodeMap['FIKHA'] = 'FIKTK';
    pilotwebToPortnetLocodeMap['FIKMU'] = 'FIKTK';
    pilotwebToPortnetLocodeMap['FIHMN'] = 'FIKTK';

    pilotwebToPortnetLocodeMap['FITRY'] = 'FITOR';

    pilotwebToPortnetLocodeMap['FIKAU'] = 'FILPP';
    pilotwebToPortnetLocodeMap['FILPM'] = 'FILPP';
    pilotwebToPortnetLocodeMap['FIMES'] = 'FILPP';
    pilotwebToPortnetLocodeMap['FIMUS'] = 'FILPP';

    pilotwebToPortnetLocodeMap['FILPP'] = 'FINUI';

    pilotwebToPortnetLocodeMap['FIVRA'] = 'FIVRK';

    // TODO: FIEUR -> FIEJO
}

export function convertLocation(route: any): Location {
    return {
        port: convertPilotwebCodeToPortnetLocode(route.end.code),
        from: convertPilotwebCodeToPortnetLocode(route.start.code),
        berth: route.end.berth?.code
    }
}

function convertPilotwebCodeToPortnetLocode(code: string): string {
    if(needInit()) {
        initMap();
    }

    const newCode = pilotwebToPortnetLocodeMap[code];

    if(newCode) {
        return newCode;
    }

    return code;
}
