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
  method: 'post' | 'put' | 'delete',
  onSuccess: (data: any) => void,
  onError: (error: any) => void,
) => {
  return useMutation(
    async (data: object) => {
      let response;

      if (method === 'delete') {
        response = await api.delete(url);
      } else {
        response = await api[method](url, data);
      }

      return response.data;
    },
    {
      onSuccess,
      onError,
    },
  );
};
