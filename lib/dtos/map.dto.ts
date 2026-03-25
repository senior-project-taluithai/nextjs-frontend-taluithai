export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface MapQueryParams extends MapBounds {
  zoom?: number;
  provinceIds?: number[];
  categoryId?: number;
  minRating?: number;
  searchTerm?: string;
}

export interface MapSummaryQueryParams {
  provinceIds?: number[];
  categoryId?: number;
  minRating?: number;
  searchTerm?: string;
}

export interface MapSummaryItem {
  province_id: number;
  count: number;
}

export interface MapSummaryResponse {
  provinces: MapSummaryItem[];
  totalCount: number;
}

export interface MapPlacesResponse {
  places: MapItemBase[];
  totalCount: number;
}

export interface MapEventsResponse {
  events: MapItemBase[];
  totalCount: number;
}

export interface MapItemBase {
  id: number;
  name: string;
  name_en: string;
  latitude: number;
  longitude: number;
  province_id: number;
  thumbnail_url: string | null;
  rating: number;
}

export type MapItem = MapItemBase & {
  type: "place" | "event";
};
