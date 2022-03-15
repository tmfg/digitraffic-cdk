import * as sinon from 'sinon';
import {PermitsApi} from "../../lib/api/permits";
import {findPermitsInD2Light, findPermitsInGeojson, getPermitsFromSource} from "../../lib/service/permits";
import {dbTestBase, insertPermit, insertPermitOrUpdateGeometry} from "../db-testutil";
import {DTDatabase} from "digitraffic-common/database/database";
import {GeometryCollection} from "geojson";

const TEST_XML_PERMITS = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?> <wfs:FeatureCollection xmlns:wfs=\"http://www.opengis.net/wfs\" xmlns:gml=\"http://www.opengis.net/gml\" xmlns:ogc=\"http://www.opengis.net/ogc\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:GIS=\"http://www.tekla.com/schemas/GIS\" xmlns=\"http://www.tekla.com/schemas/GIS\" xsi:schemaLocation=\"http://www.opengis.net/wfs http://schemas.opengis.net/wfs/1.1.0/wfs.xsd http://www.tekla.com/schemas/GIS https://kartta.lahti.fi/teklaogcweb/WFS.ashx?SERVICE=WFS&amp;VERSION=1.1.0&amp;REQUEST=DescribeFeatureType&amp;typeName=GIS:YlAlLuvat \" timeStamp=\"2022-01-17T13:21:24+02:00\" numberOfFeatures=\"100\"> <gml:boundedBy> <gml:Envelope srsName=\"http://www.opengis.net/gml/srs/epsg.xml#3880\"> <gml:lowerCorner>26476117.000 6757843.000</gml:lowerCorner> <gml:upperCorner>26498649.000 6767775.317</gml:upperCorner> </gml:Envelope> </gml:boundedBy> <gml:featureMember> <GIS:YlAlLuvat> <GIS:Id>1035732674</GIS:Id> <GIS:Lupanumero>398-2021-201</GIS:Lupanumero> <GIS:Lupatyyppi>Kaivulupa</GIS:Lupatyyppi> <GIS:Lupatyyppi_koodi>2</GIS:Lupatyyppi_koodi> <GIS:Hakemuspaiva>11.06.2021</GIS:Hakemuspaiva> <GIS:Kasittelyvaihe>Lupa myönnetty</GIS:Kasittelyvaihe> <GIS:Kasittelyvaihe_koodi>2</GIS:Kasittelyvaihe_koodi> <GIS:Nimi>VIITE 2408035, Loviisankatu 8</GIS:Nimi> <GIS:Voimassaoloaika>12.07.2021 - 16.07.2021</GIS:Voimassaoloaika> <GIS:VoimassaolonAlkamispaiva>12.07.2021</GIS:VoimassaolonAlkamispaiva> <GIS:VoimassaolonAlkamisaika>00:00</GIS:VoimassaolonAlkamisaika> <GIS:VoimassaolonPaattymispaiva>16.07.2021</GIS:VoimassaolonPaattymispaiva> <GIS:VoimassaolonPaattymissaika>23:59</GIS:VoimassaolonPaattymissaika> <GIS:LuvanTarkoitus>Telekaapeli</GIS:LuvanTarkoitus> <GIS:LuvanTarkoitusKoodi>2</GIS:LuvanTarkoitusKoodi> <GIS:LuvanTarkoitusKuvaus>FZOMVDMU-SD2X12SML</GIS:LuvanTarkoitusKuvaus> <GIS:PintaAla>25</GIS:PintaAla> <GIS:Geometry> <gml:Point srsName=\"http://www.opengis.net/gml/srs/epsg.xml#3880\"> <gml:pos>26481435.000 6763183.000</gml:pos> </gml:Point> </GIS:Geometry> </GIS:YlAlLuvat> </gml:featureMember> <gml:featureMember> <GIS:YlAlLuvat> <GIS:Id>877305694</GIS:Id> <GIS:Lupanumero>398-2017-126</GIS:Lupanumero> <GIS:Lupatyyppi>abc</GIS:Lupatyyppi> <GIS:Lupatyyppi_koodi>2</GIS:Lupatyyppi_koodi> <GIS:Hakemuspaiva>30.05.2017</GIS:Hakemuspaiva> <GIS:Kasittelyvaihe>Lupa myönnetty</GIS:Kasittelyvaihe> <GIS:Kasittelyvaihe_koodi>2</GIS:Kasittelyvaihe_koodi> <GIS:Nimi>Vanhatie 47</GIS:Nimi> <GIS:Voimassaoloaika>30.05.2017 - 02.06.2017</GIS:Voimassaoloaika> <GIS:VoimassaolonAlkamispaiva>30.05.2017</GIS:VoimassaolonAlkamispaiva> <GIS:VoimassaolonAlkamisaika>00:00</GIS:VoimassaolonAlkamisaika> <GIS:VoimassaolonPaattymispaiva>02.06.2017</GIS:VoimassaolonPaattymispaiva> <GIS:VoimassaolonPaattymissaika>23:59</GIS:VoimassaolonPaattymissaika> <GIS:PintaAla>60</GIS:PintaAla> <GIS:Geometry> <gml:Polygon srsName=\"http://www.opengis.net/gml/srs/epsg.xml#3880\"> <gml:exterior> <gml:LinearRing> <gml:posList>26482469.588 6766957.190 26482479.838 6766965.940 26482479.875 6766965.967 26482480.156 6766965.945 26482480.250 6766965.750 26482480.162 6766965.560 26482469.912 6766956.810 26482469.632 6766956.780 26482469.625 6766956.784 26482469.503 6766957.038 26482469.588 6766957.190</gml:posList> </gml:LinearRing> </gml:exterior> </gml:Polygon> </GIS:Geometry> </GIS:YlAlLuvat> </gml:featureMember> <gml:featureMember> <GIS:YlAlLuvat> <GIS:Id>123305694</GIS:Id> <GIS:Lupanumero>123-2017-126</GIS:Lupanumero> <GIS:Lupatyyppi></GIS:Lupatyyppi> <GIS:Lupatyyppi_koodi>2</GIS:Lupatyyppi_koodi> <GIS:Hakemuspaiva>30.05.2017</GIS:Hakemuspaiva> <GIS:Kasittelyvaihe>Lupa myönnetty</GIS:Kasittelyvaihe> <GIS:Kasittelyvaihe_koodi>2</GIS:Kasittelyvaihe_koodi> <GIS:Nimi>Vanhatie 47</GIS:Nimi> <GIS:PintaAla>60</GIS:PintaAla> <GIS:Geometry> <gml:Polygon srsName=\"http://www.opengis.net/gml/srs/epsg.xml#3880\"> <gml:exterior> <gml:LinearRing> <gml:posList>26482469.588 6766957.190 26482479.838 6766965.940 26482479.875 6766965.967 26482480.156 6766965.945 26482480.250 6766965.750 26482480.162 6766965.560 26482469.912 6766956.810 26482469.632 6766956.780 26482469.625 6766956.784 26482469.503 6766957.038 26482469.588 6766957.190</gml:posList> </gml:LinearRing> </gml:exterior> </gml:Polygon> </GIS:Geometry> </GIS:YlAlLuvat> </gml:featureMember> </wfs:FeatureCollection>";

describe("permits service tests", dbTestBase((db: DTDatabase) => {
    sinon.stub(PermitsApi.prototype, "getPermitsXml").returns(Promise.resolve(TEST_XML_PERMITS));

    test("getPermits filters permits with no effectiveFrom date", async () => {
        const parsedPermits = await getPermitsFromSource("123", "123");

        expect(parsedPermits).toHaveLength(2);
    });

    test('findPermitsInGeojson - empty', async () => {
        const permits = await findPermitsInGeojson();

        expect(permits.features).toHaveLength(0);
    });

    test('findPermitsInGeojson - two permits', async () => {
        await insertPermit(db, 1, 'test');
        await insertPermit(db, 2, 'test2');

        const permits = await findPermitsInGeojson();
        console.log(JSON.stringify(permits, null, 2));
        expect(permits.features).toHaveLength(2);
        expect(permits.features[0].geometry.type).toEqual("GeometryCollection");
    });

    test('findPermitsInGeojson - geometries from duplicates in GeometryCollection', async () => {
        const apiPermit = {
            sourceId: '123abc',
            source: 'Lahden kaupunki',
            permitType: 'Kaivulupa',
            permitSubject: 'Kaukolämpö',
            effectiveFrom: new Date(Date.now()),
            effectiveTo: new Date(Date.now()),
            gmlGeometryXmlString: "<gml:Point srsName=\"http://www.opengis.net/gml/srs/epsg.xml#3880\"> <gml:pos>26483500.000 6761970.000</gml:pos> </gml:Point>",
        };
        await insertPermitOrUpdateGeometry(db, apiPermit);

        apiPermit.gmlGeometryXmlString = "<gml:Point srsName=\"http://www.opengis.net/gml/srs/epsg.xml#3880\"> <gml:pos>25483500.000 6661970.000</gml:pos> </gml:Point>";
        await insertPermitOrUpdateGeometry(db, apiPermit);

        const permits = await findPermitsInGeojson();

        expect(permits.features).toHaveLength(1);
        expect(permits.features[0].geometry.type).toEqual("GeometryCollection");
        expect((permits.features[0].geometry as GeometryCollection).geometries).toHaveLength(2);
    });

    test('findPermitsInD2Light - empty', async () => {
        const permits = await findPermitsInD2Light();

        expect(permits.situationPublicationLight.situationRecord).toHaveLength(0);
    });

    test('findPermitsInD2Light - two permits', async () => {
        await insertPermit(db, 1, 'test');
        await insertPermit(db, 2, 'test2');

        const permits = await findPermitsInD2Light();

        console.info("permits " + JSON.stringify(permits, null, 2));

        expect(permits.situationPublicationLight.situationRecord).toHaveLength(2);
    });

}));
