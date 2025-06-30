export interface Feeder {
    id: number;
    foodbrand: string | null;
    brandname?: string | null;
    created_at: string;
    hardwareid?: string | null;
    name?: string | null;
    manual_feed_calories?: number;
    foodBrandDetails?: {
      id?: number | null;
      brandName?: string | null;
      calories?: number | null;
      servSize?: number | null;
    };
  };
  
  export interface ScheduleData {
    name?: string;
    schedule: {
      [day: string]: string[]; // Simple string array of times
    };
    manualFeedCalories: number;
    feedingTimes: number;
    lastUpdated: string;
  }

  export interface ScheduleResponse {
    scheduleId: number | null;
    scheduleData: ScheduleData;
    quantity: number;
  }

export type FoodBrand = {
  id: number;
  brandName: string;
  servSize: number;
  calories: number;
};