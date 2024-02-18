import express from "express";
import { createApp } from "./api";

const app = createApp(express());

app.listen(8080, () => 
  console.log(
    'Server listen on port 8080\n' +
    'Access on http://localhost:8080/api'
  )
)