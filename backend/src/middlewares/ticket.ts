import { Request, Response, NextFunction } from 'express';

const validateTicketData = (req: Request, res: Response, next: NextFunction) =>  {
    
    const { payment_method, quantity } = req.body
    console.log(payment_method, quantity)

    if(!payment_method || !quantity) {
        return res.status(400).json({ message: "Faltam dados para a requisição." })
    }

    next();
  };

  export default validateTicketData