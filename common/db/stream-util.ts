import {IDatabase} from "pg-promise";

export async function stream(db: IDatabase<any, any>, qs: any, conversion: (object: any) => any) {
    const start = Date.now();
    let things = [] as any[];

    await db.stream(qs, s => {
        s.on('data', d => {
            things.push(conversion(d));
        });
        s.on('error', error => {
            throw error;
        });
    });

    console.info("db streaming took %d", Date.now() - start);

    return things;
}