import express from "express";
import cors from 'cors';
import { createApp } from "./api";


const app = createApp(express());
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS']
}));

app.listen(8080, () => 
  console.log(
    'Server listen on port 8080\n' +
    'Access on http://localhost:8080/api'
    )
)