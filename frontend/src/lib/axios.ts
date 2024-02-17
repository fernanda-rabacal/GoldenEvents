import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:8080/api",
 /*  headers: {
    'Access-Control-Allow-Origin': 'http://localhost:8080',
    "Access-Control-Allow-Methods": "GET, OPTIONS, POST, PUT",
    "Access-Control-Allow-Credentials": "true"
  } */
})