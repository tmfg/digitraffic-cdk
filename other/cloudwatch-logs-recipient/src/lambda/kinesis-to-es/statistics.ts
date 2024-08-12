export class Statistics {
    private statisticsMap: Record<string, number> = {};

    addStatistics(name: string) {
        // eslint-disable-next-line eqeqeq
        if (this.statisticsMap[name] == null) {
            this.statisticsMap[name] = 1;
        } else {
            this.statisticsMap[name] = this.statisticsMap[name] + 1;
        }
    }
}
