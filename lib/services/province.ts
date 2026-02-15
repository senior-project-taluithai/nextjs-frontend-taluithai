import { api } from '../api-client';
import { Province, CreateProvinceDto } from '../dtos/province.dto';

export const provinceService = {
  getAll: async (): Promise<Province[]> => {
    const response = await api.get<Province[]>('/provinces');
    return response.data;
  },

  getById: async (id: number): Promise<Province> => {
    const response = await api.get<Province>(`/provinces/${id}`);
    return response.data;
  },

  create: async (data: CreateProvinceDto): Promise<Province> => {
    const response = await api.post<Province>('/provinces', data);
    return response.data;
  },
};
