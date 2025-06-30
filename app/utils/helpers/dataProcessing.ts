import { WeightRecord, FeedRecord } from '../features/cats/types';

/**
 * Process raw data into daily records (for week)
 */
export const processDataIntoDaily = (rawData: any[], field: 'weight' | 'amount'): WeightRecord[] | FeedRecord[] => {
  if (!rawData || rawData.length === 0) return [];
  const dailyMap = new Map<string, number>();
  rawData.forEach(record => {
    if (!record || !record.created_at || record[field] == null) return;
    const date = record.created_at.split('T')[0];
    // Use the latest value for the day
    dailyMap.set(date, Number(record[field]));
  });
  return Array.from(dailyMap.entries())
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

/**
 * Process raw data into weekly averages (for month/custom)
 */
export const processDataIntoWeeklyAverages = (rawData: any[], field: 'weight' | 'amount'): WeightRecord[] | FeedRecord[] => {
  if (!rawData || rawData.length === 0) return [];
  const weeklyMap = new Map<string, { sum: number, count: number }>();
  rawData.forEach(record => {
    if (!record || !record.created_at || record[field] == null) return;
    const date = new Date(record.created_at);
    // Get week start (Monday)
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - ((date.getDay() + 6) % 7));
    const weekKey = weekStart.toISOString().split('T')[0];
    if (!weeklyMap.has(weekKey)) weeklyMap.set(weekKey, { sum: 0, count: 0 });
    const entry = weeklyMap.get(weekKey)!;
    entry.sum += Number(record[field]);
    entry.count += 1;
  });
  return Array.from(weeklyMap.entries())
    .map(([date, { sum, count }]) => ({ date, value: sum / count }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};