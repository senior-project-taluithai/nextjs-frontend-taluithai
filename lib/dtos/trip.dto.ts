export interface CreateTripRequest {
  name: string;
  start_date: string;
  end_date: string;
  province_ids: number[];
  status?: 'draft' | 'upcoming' | 'completed';
}

export interface UpdateTripRequest {
  name?: string;
  start_date?: string;
  end_date?: string;
  province_ids?: number[];
  status?: 'draft' | 'upcoming' | 'completed';
}

export interface TripDayItem {
  id: number;
  item_type?: 'place' | 'event';
  place_id?: number;
  event_id?: number;
  note?: string;
  order: number;
  start_time?: string;
  end_time?: string;
}

export interface CreateTripDayItemRequest {
  item_type: 'place' | 'event';
  item_id: number;
  note?: string;
  order?: number;
  start_time?: string;
  end_time?: string;
}

export interface UpdateTripDayItemRequest {
  note?: string;
  order?: number;
  start_time?: string;
  end_time?: string;
}

export interface ReorderItemsRequest {
  items: Array<{ id: number; order: number }>;
}
