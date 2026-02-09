import { api } from './api-client';
import { Category } from './dtos/category.dto';

export const categoryService = {
  getAll: async (): Promise<Category[]> => {
    const response = await api.get<Category[]>('/categories');
    return response.data;
  },
};
