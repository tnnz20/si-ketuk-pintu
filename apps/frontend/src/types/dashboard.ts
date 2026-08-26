export type ChartPeriod = 'daily' | 'monthly' | 'yearly';

export interface ChartItem {
  key: string;
  label: string;
  subLabel: string;
  count: number;
}
