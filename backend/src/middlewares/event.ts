import { Request, Response, NextFunction } from 'express';

const validateEventData = (req: Request, res: Response, next: NextFunction) =>  {
    const { name, start_date, photo, description } = req.body

    console.log(name)

    if(!name || !start_date || !photo || !description) {
        return res.status(400).json({ message: "Faltam dados para a requisição." })
    }
    
   /*  if(typeof name !== 'string' || typeof description !== 'string' || typeof photo !== 'string') {
        return res.status(400).json({ message: "Os dados estão no formato incorreto, precisam ser em string." })
    }
 */
    next();
  };

  export default validateEventData