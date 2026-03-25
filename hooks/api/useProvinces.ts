import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { provinceService } from "@/lib/services/province";
import { CreateProvinceDto } from "@/lib/dtos/province.dto";

export const useProvinces = () => {
  return useQuery({
    queryKey: ["provinces"],
    queryFn: () => provinceService.getAll(),
    staleTime: 60 * 60 * 1000,
  });
};

export const useProvince = (id: number) => {
  return useQuery({
    queryKey: ["provinces", id],
    queryFn: () => provinceService.getById(id),
    enabled: !!id,
  });
};

export const useCreateProvinceMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProvinceDto) => provinceService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["provinces"] });
    },
  });
};
