import { api } from "@/lib/api-client";
import { PaginatedResult } from "@/lib/dtos/pagination.dto";

export interface HotelDto {
  id: number;
  name: string;
  name_en?: string;
  address?: string;
  detail?: string;
  detail_en?: string;
  province_id?: number;
  province?: {
    id: number;
    name: string;
    name_en: string;
  };
  latitude: number;
  longitude: number;
  rating: number;
  user_rating?: number;
  user_rating_count?: number;
  thumbnail_url?: string;
  website?: string;
  booking_url?: string;
  price_range?: string;
  phone?: string;
  amenities?: string[];
  images?: { id: number; url: string }[];
}

export const hotelService = {
  getHotelsInTripProvinces: async (
    tripId: number,
    filters: {
      page?: number;
      limit?: number;
      search?: string;
      minRating?: number;
      provinceIds?: number[];
    },
  ): Promise<PaginatedResult<HotelDto>> => {
    const response = await api.post<PaginatedResult<HotelDto>>(
      `/trips/${tripId}/hotels`,
      {
        page: filters.page || 1,
        limit: filters.limit || 12,
        search: filters.search,
        minRating: filters.minRating,
        provinceIds: filters.provinceIds,
        hasPriceRange: true,
      },
    );
    return response.data;
  },

  setDayHotel: async (
    tripId: number,
    dayNumber: number,
    data: {
      hotelId: number;
      checkinTime?: string;
      checkoutTime?: string;
    },
  ): Promise<any> => {
    const response = await api.put(
      `/trips/${tripId}/days/${dayNumber}/hotel`,
      data,
    );
    return response.data;
  },

  removeDayHotel: async (tripId: number, dayNumber: number): Promise<any> => {
    const response = await api.delete(
      `/trips/${tripId}/days/${dayNumber}/hotel`,
    );
    return response.data;
  },
};
