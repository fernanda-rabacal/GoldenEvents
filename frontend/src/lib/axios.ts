import axios from "axios";
import { parseCookies } from "nookies";

export const api = axios.create({
  baseURL: "http://localhost:8080",
})

api.interceptors.request.use((config) => {
  const { 'golden_token': token } = parseCookies()

  config.headers.Authorization =  token ? `Bearer ${token}` : '';
  return config;
});