import {Location} from "../model/timestamp";
import {PilotageRoute} from "../model/pilotage";

const pilotwebToPortnetLocodeMap: Record<string, string> = {};

function needInit(): boolean {
    return Object.keys(pilotwebToPortnetLocodeMap).length === 0;
}

function initMap() {
    pilotwebToPortnetLocodeMap.FIKOY = 'FIKOK';

    pilotwebToPortnetLocodeMap.FIPIE = 'FIPRS';

    pilotwebToPortnetLocodeMap.FIVAS = 'FIVAA';

    pilotwebToPortnetLocodeMap.FIKAK = 'FIKAS';

    pilotwebToPortnetLocodeMap.FIMAN = 'FIPOR';
    pilotwebToPortnetLocodeMap.FITHK = 'FIPOR';

    pilotwebToPortnetLocodeMap.FIHEP = 'FIUKI';
    pilotwebToPortnetLocodeMap.FIKMR = 'FIUKI';

    pilotwebToPortnetLocodeMap.FILEV = 'FIHKO';
    pilotwebToPortnetLocodeMap.FIKVH = 'FIHKO';

    pilotwebToPortnetLocodeMap.FIVUH = 'FIHEL';
    pilotwebToPortnetLocodeMap.FI401 = 'FIHEL';
    pilotwebToPortnetLocodeMap.FI402 = 'FIHEL';
    pilotwebToPortnetLocodeMap.FI403 = 'FIHEL';
    pilotwebToPortnetLocodeMap.FI404 = 'FIHEL';
    pilotwebToPortnetLocodeMap.FI405 = 'FIHEL';
    pilotwebToPortnetLocodeMap.FIVAL = 'FIHEL';

    pilotwebToPortnetLocodeMap.FIKHA = 'FIKTK';
    pilotwebToPortnetLocodeMap.FIKMU = 'FIKTK';
    pilotwebToPortnetLocodeMap.FIHMN = 'FIKTK';

    pilotwebToPortnetLocodeMap.FITRY = 'FITOR';

    pilotwebToPortnetLocodeMap.FIKAU = 'FILPP';
    pilotwebToPortnetLocodeMap.FILPM = 'FILPP';
    pilotwebToPortnetLocodeMap.FIMES = 'FILPP';
    pilotwebToPortnetLocodeMap.FIMUS = 'FILPP';

    pilotwebToPortnetLocodeMap.FILPP = 'FINUI';

    pilotwebToPortnetLocodeMap.FIVRA = 'FIVRK';

    pilotwebToPortnetLocodeMap.FIEUR = 'FIEJO';
    pilotwebToPortnetLocodeMap.FIOLK = 'FIEJO';

    pilotwebToPortnetLocodeMap.FIKEA = 'FIKEM';
    pilotwebToPortnetLocodeMap.FIKEV = 'FIKEM';
}

export function convertLocation(route: PilotageRoute): Location {
    return {
        port: convertPilotwebCodeToPortnetLocode(route.end.code),
        from: convertPilotwebCodeToPortnetLocode(route.start.code),
        berth: route.end.berth?.code,
    };
}

function convertPilotwebCodeToPortnetLocode(code: string): string {
    if (needInit()) {
        initMap();
    }

    const newCode = pilotwebToPortnetLocodeMap[code];

    if (newCode) {
        return newCode;
    }

    return code;
}
