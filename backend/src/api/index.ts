import express from 'express';
import cors from 'cors';
import { Express, Request, Response, Router } from "express";
import { eventsRouter, usersRouter } from "./routes";


export const createApp = (app: Express): Express => {
  const baseRouter = Router();
  
  baseRouter.use(express.json({limit: '50mb'}));
  baseRouter.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS']
  }));
  
  // Config
  baseRouter.get('/info', (req: Request, res: Response) => {
    res.send({
      title: 'Api Golden Events',
      description: 'Api para disponibilizar os recursos da plataforma Golden Eventos'
    })
  })
  
  // Routers
  baseRouter.use('/events', eventsRouter())
  baseRouter.use('/users', usersRouter())

  app.use('/api', baseRouter);
  return app;
}
