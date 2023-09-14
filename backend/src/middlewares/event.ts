import { Request, Response, NextFunction } from 'express';

const validateEventData = (req: Request, res: Response, next: NextFunction) =>  {
    const { name, start_date, photo, description } = req.body

    if(!name || !start_date || !photo || !description) {
        return res.status(400).json({ message: "Faltam dados para a requisição." })
    }
     
    next();
  };

  export default validateEventData