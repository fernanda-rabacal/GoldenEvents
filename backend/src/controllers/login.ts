import { Request, Response } from "express";
import { generateUserToken } from "../helpers/handleToken"; 
import { comparePassword } from "../helpers/handlePassword"; 
import { prisma } from "../services/prisma";
import emailValidator from "email-validator";

export const login = async (request: Request, response: Response) => {
  try {
    const body = request.body ? request.body : {};

    if (!body.email) {
      return response.status(422).json({ message: "O campo 'email' é obrigatório."})
    }
  
    if (!emailValidator.validate(body.email)) {
      return response.status(422).json({ message: "Email inválido."})
    }
  
    if (!body.password) {
      return response.status(422).json({ message: "O campo 'password' é obrigatório."})
    }

    const { email, password } = body

    const user = await prisma.user.findFirst({
        where: {
            email
        }
    });

    if (!user) {
      return response.status(400).json({ message: "Usuario ou senha estão inválidos." });
    }

    const verifiedPassword = await comparePassword(password, user.password);

    if (!verifiedPassword) {
      return response.status(400).json({ message: "Usuario ou senha estão inválidos." });
    }

    const { id, name } = user;

    const token = generateUserToken({ id, email });

    return response.status(200).json({ user: { id, name, email } ,token });
  } catch (error) {
    return response.status(500).json({ message: "Falha ao fazer login" });
  }
};