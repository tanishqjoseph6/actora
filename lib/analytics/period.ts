import type { AnalyticsPeriod, TimeSeriesPoint } from "./types";

export function periodToDays(period: AnalyticsPeriod): number {
  switch (period) {
    case "7d":
      return 7;
    case "30d":
      return 30;
    case "90d":
      return 90;
    case "12m":
      return 365;
  }
}

export function getPeriodStart(period: AnalyticsPeriod): Date {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - periodToDays(period));
  start.setHours(0, 0, 0, 0);
  return start;
}

export function isWithinPeriod(iso: string, period: AnalyticsPeriod): boolean {
  const t = new Date(iso).getTime();
  return t >= getPeriodStart(period).getTime() && t <= Date.now();
}

type BucketSpec = { label: string; start: Date; end: Date };

export function buildBuckets(period: AnalyticsPeriod): BucketSpec[] {
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  if (period === "7d") {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(end);
      d.setDate(d.getDate() - (6 - i));
      d.setHours(0, 0, 0, 0);
      const bucketEnd = new Date(d);
      bucketEnd.setHours(23, 59, 59, 999);
      return {
        label: d.toLocaleDateString(undefined, { weekday: "short" }),
        start: d,
        end: bucketEnd,
      };
    });
  }

  if (period === "30d") {
    return Array.from({ length: 4 }).map((_, i) => {
      const bucketEnd = new Date(end);
      bucketEnd.setDate(bucketEnd.getDate() - (3 - i) * 7);
      bucketEnd.setHours(23, 59, 59, 999);
      const start = new Date(bucketEnd);
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      return { label: `W${i + 1}`, start, end: bucketEnd };
    });
  }

  if (period === "90d") {
    return Array.from({ length: 6 }).map((_, i) => {
      const bucketEnd = new Date(end);
      bucketEnd.setDate(bucketEnd.getDate() - (5 - i) * 15);
      bucketEnd.setHours(23, 59, 59, 999);
      const start = new Date(bucketEnd);
      start.setDate(start.getDate() - 14);
      start.setHours(0, 0, 0, 0);
      return {
        label: start.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        start,
        end: bucketEnd,
      };
    });
  }

  return Array.from({ length: 12 }).map((_, i) => {
    const d = new Date(end.getFullYear(), end.getMonth() - (11 - i), 1);
    const bucketEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
    return {
      label: d.toLocaleDateString(undefined, { month: "short" }),
      start: d,
      end: bucketEnd,
    };
  });
}

export function bucketCounts(
  dates: string[],
  period: AnalyticsPeriod
): TimeSeriesPoint[] {
  const buckets = buildBuckets(period);
  return buckets.map((bucket) => ({
    label: bucket.label,
    value: dates.filter((iso) => {
      const t = new Date(iso).getTime();
      return t >= bucket.start.getTime() && t <= bucket.end.getTime();
    }).length,
  }));
}

export function cumulativeBucket(
  dates: string[],
  period: AnalyticsPeriod
): TimeSeriesPoint[] {
  const sorted = [...dates].sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );
  const buckets = buildBuckets(period);
  let running = 0;
  let idx = 0;
  return buckets.map((bucket) => {
    while (
      idx < sorted.length &&
      new Date(sorted[idx]).getTime() <= bucket.end.getTime()
    ) {
      running += 1;
      idx += 1;
    }
    return { label: bucket.label, value: running };
  });
}
