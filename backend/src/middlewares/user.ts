import { NextFunction, Request, Response } from "express"
import emailValidator from "email-validator";
import { cpf as cpfValidator} from "cpf-cnpj-validator";

const validateEmail = (email: string, res: Response) => {
  if (!email) {
    return res.status(422).json({ message: "O campo 'email' é obrigatório."})
  }

  if (!emailValidator.validate(email)) {
    return res.status(422).json({ message: "Email inválido."})
  }
}

const validateCpf = (cpf: string, res: Response) => {
  if (!cpf) {
    return res.status(422).json({ message: "O campo 'cpf' é obrigatório.'"})
  }

  if (!cpfValidator.isValid(cpf)) {
    return res.status(422).json({ message: "Cpf inválido."})
  }
}

export const validateCreateUserData = (req: Request, res: Response, next: NextFunction) => {
  const body = req.body ? req.body : {}

  if (!body.name) {
    return res.status(422).json({ message: "O campo 'name' é obrigatório."})
  }

  validateEmail(body.email, res)

  if (!body.password) {
    return res.status(422).json({ message: "O campo 'password' é obrigatório."})
  }

  validateCpf(body.cpf, res)

  next()
}

export const validateUpdateUserData = (req: Request, res: Response, next: NextFunction) => {
  const body = req.body ? req.body : {}

  if (!body.name) {
    return res.status(422).json({ message: "O campo 'name' é obrigatório."})
  }

  validateEmail(body.email, res)
  validateCpf(body.cpf, res)

  next()
}