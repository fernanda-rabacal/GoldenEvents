/* eslint-disable prettier/prettier */
import { hash, compare } from 'bcryptjs';

export const encryptData = async (data: string) => hash(data, 10);
export const compareEncrypedData = async (data: string, encryptData: string) =>
  compare(data, String(encryptData));
