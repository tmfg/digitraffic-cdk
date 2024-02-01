import type { DTDatabase } from "@digitraffic/common/dist/database/database";
import type { SpatialDisruption } from "../../model/disruption.js";
import { type UpdatedTimestamps, getUpdatedTimestamps } from "../db-testutil.js";
import { findAllDisruptions, saveDisruptions } from "../../service/disruptions.js";
import { findAll } from "../../db/disruptions.js";

export class DisruptionsTestDriver {
    private readonly db: DTDatabase;

    private readonly timestamps: UpdatedTimestamps[] = [];

    public lastDisruptions: SpatialDisruption[] = [];

    public constructor(db: DTDatabase) {
        this.db = db;
    }

    public async assertTimestampsCheckedAndUpdated(): Promise<void> {
        await this.getUpdatedTimestamps();

        const lastIndex = this.timestamps.length - 1;

        expect(this.timestamps.length).toBeGreaterThan(1);
        expect(this.timestamps[lastIndex - 1]!.updated).toBeLessThan(this.timestamps[lastIndex]!.updated);
        expect(this.timestamps[lastIndex - 1]!.updated).toBeLessThan(this.timestamps[lastIndex]!.checked);
    }

    public async assertTimestampsCheckedNotUpdated(): Promise<void> {
        await this.getUpdatedTimestamps();

        const lastIndex = this.timestamps.length - 1;

        expect(this.timestamps.length).toBeGreaterThan(1);
        expect(this.timestamps[lastIndex - 1]!.updated).toEqual(this.timestamps[lastIndex]!.updated);
        expect(this.timestamps[lastIndex - 1]!.checked).toBeLessThan(this.timestamps[lastIndex]!.checked);
    }

    public async saveSeedData() {
        await saveDisruptions(DisruptionsTestDriver.createRandomDisruptions());
    }

    /**
     * Save given disruptions into database using disruptions-service.  Also assert the number of disruptions from the service and db will be the same.
     * Before updating, get updated timestamps and save them in this driver instance.
     *
     * @param disruptions
     * @param assertedCount
     */
    public async saveAndAssertDisruptions(
        disruptions: SpatialDisruption[],
        assertedCount: number = disruptions.length
    ): Promise<void> {
        await this.getUpdatedTimestamps();
        this.lastDisruptions = disruptions;
        await saveDisruptions(disruptions);

        const [fetchedDisruptions] = await findAllDisruptions();
        expect(fetchedDisruptions.features.length).toBe(assertedCount);

        const savedDisruptions = await findAll(this.db);
        expect(savedDisruptions.length).toBe(assertedCount);
    }

    public static createRandomDisruptions(amount: number = 10): SpatialDisruption[] {
        return Array.from({
            length: amount
        }).map(() => {
            return this.newDisruption();
        });
    }

    /**
     * Get updated timestamps from the database and save them in this driver instance.
     */
    public async getUpdatedTimestamps(): Promise<void> {
        this.timestamps.push(await getUpdatedTimestamps(this.db));
    }

    static someNumber(): number {
        return Math.floor(Math.random() * 999999);
    }

    static newDisruption(): SpatialDisruption {
        // round off millis
        const StartDate = new Date();
        StartDate.setMilliseconds(0);
        const EndDate = new Date();
        EndDate.setMilliseconds(0);
        return {
            DescriptionEn: this.someNumber().toString(),
            DescriptionFi: this.someNumber().toString(),
            DescriptionSv: this.someNumber().toString(),
            EndDate,
            StartDate,
            Type_Id: this.someNumber(),
            Id: this.someNumber(),
            geometry: {
                type: "Point",
                coordinates: [this.someNumber(), this.someNumber()]
            }
        };
    }
}
