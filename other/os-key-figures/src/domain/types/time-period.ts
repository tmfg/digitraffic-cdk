export interface TimePeriod {
  readonly from: Date;
  readonly to: Date;
}

export interface DateRange {
  readonly startTime: string;
  readonly endTime: string;
}

export function createTimePeriod(from: Date, to: Date): TimePeriod {
  if (from >= to) {
    throw new Error("Invalid time period: from must be before to");
  }
  return { from, to };
}

export function toIsoDateRange(period: TimePeriod): DateRange {
  return {
    startTime: period.from.toISOString(),
    endTime: period.to.toISOString(),
  };
}

export function lastMonth(): TimePeriod {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const to = new Date(now.getFullYear(), now.getMonth(), 1);
  return { from, to };
}

export function forMonth(year: number, month: number): TimePeriod {
  const from = new Date(year, month - 1, 1);
  const to = new Date(year, month, 1);
  return { from, to };
}
