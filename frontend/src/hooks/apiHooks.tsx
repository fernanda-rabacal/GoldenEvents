import { UseQueryOptions, useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';

export const useQueryData = (url: string, options?: Omit<UseQueryOptions<any, unknown, any, string[]>, "queryKey" | "queryFn">) => {
  return useQuery({
    queryKey: [url],
    queryFn: async () => {
      const { data } = await api.get(url);

      return data;
    },
    ...options,
  });
};

export const useMutationData = (
  url: string,
  method: 'post' | 'put' | 'patch',
  onSuccess: (data: any) => void,
  onError: (error: any) => void,
) => {
  return useMutation({
    mutationFn: async (data?: object) => {
      const response = await api[method](url, data);

      return response.data;
    },
    onSuccess,
    onError,
  });
};

export const useDeleteData = (
  url: string,
  method: 'delete',
  onSuccess: (data: any) => void,
  onError: (error: any) => void,
) => {
  return useMutation({
    mutationFn: async () => {
      const response = await api.delete(url);

      return response.data;
    },
    onSuccess,
    onError,
  });
};
