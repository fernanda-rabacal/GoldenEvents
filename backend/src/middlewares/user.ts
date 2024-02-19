import { NextFunction, Request, Response } from "express";
import { EntityValitionResponse } from "../api/responses";
import emailValidator from "email-validator";
import { cpf as cpfValidator} from "cpf-cnpj-validator";

const validateEmail = (email: string, res: Response) => {
  if (!email) {
    return EntityValitionResponse("O campo 'email' é obrigatório.", res)
  }

  if (!emailValidator.validate(email)) {
    return EntityValitionResponse("Email inválido.", res)
  }
}

const validateCpf = (cpf: string, res: Response) => {
  if (!cpf) {
    return EntityValitionResponse("O campo 'cpf' é obrigatório.", res)
  }

  if (!cpfValidator.isValid(cpf)) {
    return EntityValitionResponse("Cpf inválido.", res)
  }
}

export const validateCreateUserData = (req: Request, res: Response, next: NextFunction) => {
  const body = req.body ? req.body : {}

  if (!body.name) {
    return EntityValitionResponse("O campo 'name' é obrigatório.", res)
  }

  validateEmail(body.email, res)

  if (!body.password) {
    return EntityValitionResponse("O campo 'password' é obrigatório.", res)
  }

  validateCpf(body.cpf, res)

  next()
}

export const validateUpdateUserData = (req: Request, res: Response, next: NextFunction) => {
  const body = req.body ? req.body : {}

  if (!body.name) {
    return EntityValitionResponse("O campo 'name' é obrigatório.", res)
  }

  validateEmail(body.email, res)
  validateCpf(body.cpf, res)

  next()
}

export const validateLoginData = (req: Request, res: Response, next: NextFunction) => {
  const body = req.body ? req.body : {};

  validateEmail(body.email, res)

  if (!body.password) {
    return res.status(422).json({ message: "O campo 'password' é obrigatório."})
  }

  next()
}