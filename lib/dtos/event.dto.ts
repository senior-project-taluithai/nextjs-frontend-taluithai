export interface Event {
  id: number;
  name: string;
  name_en: string;
  detail: string;
  detail_en: string;
  start_date: string; // ISO8601 string
  end_date: string; // ISO8601 string
  province_id: number;
  latitude: number;
  longitude: number;
  is_recurring: boolean;
  is_highlight: boolean;
  rating: number;
  thumbnail_url: string;
  image_urls: string[];
  categories: string[];
}

export type CreateEventDto = Omit<Event, 'id' | 'rating'>;
