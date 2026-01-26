export interface Place {
  id: number;
  name: string;
  name_en: string;
  detail: string;
  detail_en: string;
  province_id: number;
  latitude: number;
  longitude: number;
  best_season: string; // 'all_year' | 'winter' | 'summer' | 'rainy' ? - Keeping string for now
  rating: number;
  thumbnail_url: string;
  image_urls: string[];
  categories: string[];
}
