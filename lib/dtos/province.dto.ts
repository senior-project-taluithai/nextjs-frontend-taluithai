export interface Province {
  id: number;
  name: string;
  name_en: string;
  region_name: string;
  latitude: number;
  longitude: number;
  image_url: string;
}

export type CreateProvinceDto = Omit<Province, 'id'>;
