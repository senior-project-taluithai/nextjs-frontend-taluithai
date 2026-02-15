import { useQuery } from "@tanstack/react-query";
import { categoryService } from "@/lib/services/category";

export const useCategories = () => {
  return useQuery({
    queryKey: ["categories"],
    queryFn: () => categoryService.getAll(),
  });
};
