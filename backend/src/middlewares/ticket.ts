import { Request, Response, NextFunction } from 'express';

const validateTicketData = (req: Request, res: Response, next: NextFunction) =>  {
    
    const { paymentMethod, quantity } = req.body

    if(!paymentMethod || !quantity) {
        return res.status(400).json({ message: "Faltam dados para a requisição." })
    }

    next();
  };

  export default validateTicketData