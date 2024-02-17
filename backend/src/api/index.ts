import { Express, Request, Response, Router } from "express";
import { eventRouter, userRouter } from "./routes";


export const createApp = (app: Express): Express => {
  const baseRouter = Router();
  
  // Config
  baseRouter.get('/info', (req: Request, res: Response) => {
    res.send({
      title: 'Api Golden Events',
      description: 'Api para disponibilizar os recursos da plataforma Golden Eventos'
    })
  })
  
  // Routers
  baseRouter.use('/events', eventRouter())
  baseRouter.use('/users', userRouter())

  app.use('/api', baseRouter);
  return app;
}
