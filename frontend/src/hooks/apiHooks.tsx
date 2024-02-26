import { useMutation, useQuery } from 'react-query';
import { api } from '@/lib/axios';

export const useQueryData = (url: string, options = {}) => {
  return useQuery(
    url,
    async () => {
      const { data } = await api.get(url);

      return data;
    },
    options,
  );
};

export const useMutationData = (
  url: string,
  method: 'post' | 'put',
  onSuccess: (data: any) => void,
  onError: (error: any) => void,
) => {
  return useMutation(
    async (data?: object) => {
      const response = await api[method](url, data);

      return response.data;
    },
    {
      onSuccess,
      onError,
    },
  );
};

export const useDeleteData = (
  url: string,
  method: 'delete',
  onSuccess: (data: any) => void,
  onError: (error: any) => void,
) => {
  return useMutation(
    async () => {
      const response = await api.delete(url);

      return response.data;
    },
    {
      onSuccess,
      onError,
    },
  );
};
