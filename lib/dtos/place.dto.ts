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
  place_reviews?: any[];
  review_count: number;
}

export interface ExplorePlacesQuery {
  searchTerm?: string;
  regions?: string[];
  provinces?: number[];
  categoryId?: number;
  bestSeason?: string[];
  minRating?: number;
  page?: number;
  limit?: number;
  orderField?: string;
  orderDir?: 'ASC' | 'DESC';
}
