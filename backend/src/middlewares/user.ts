import { NextFunction, Request, Response } from "express"

const validateUserData = (req: Request, res: Response, next: NextFunction) => {
  const { name, email, password } = req.body

  if(!name || !email || !password) {
    return res.status(400).json("Faltam dados para a criação do usuario")
  }

  next()
}

export default validateUserData;