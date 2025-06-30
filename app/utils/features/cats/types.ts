export type Cat = {
  catid: number;
  catname: string;
  catbreed: string | null;
  catage: number | null;
  catweight: number | null;
  catlength: number | null;
  catsex: string | null;
  feederid: number | null;
  microchip?: number | null;
};

export type WeightRecord = {
  date: string;
  value: number;
};

export type FeedRecord = {
  date: string;
  value: number;
};

export type CatFormData = {
  catname: string;
  catbreed: string;
  catage: string;
  catweight: string;
  catlength: string;
  catsex: string;
  feederid?: number | null;
  microchip?: string;
};

export type DataPeriod = 'week' | 'month';
export type DataType = 'weight' | 'feed';

// New type for the unified history endpoint response
export type CatHistoryResponse = {
  weight?: {
    data: WeightRecord[];
    aggregation: 'daily' | 'weekly' | 'none';
  };
  amount?: {
    data: FeedRecord[];
    aggregation: 'daily' | 'weekly' | 'none';
  };
};