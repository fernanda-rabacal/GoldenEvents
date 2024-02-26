import { Request, Response } from "express";
import { prisma } from "../services/prisma";
import { generateUserToken } from "../helpers/handleToken"; 
import { comparePassword } from "../helpers/handlePassword"; 
import { DomainValidationResponse, InternalErrorResponse } from "../api/responses";

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    const user = await prisma.user.findFirst({
      where: {
        email
      }
    });

    if (!user) {
      return DomainValidationResponse("Usuario ou senha estão inválidos.", res)
    }

    const verifiedPassword = await comparePassword(password, user.password);

    if (!verifiedPassword) {      
      return DomainValidationResponse("Usuario ou senha estão inválidos.", res)
    }

    const { id, name } = user;

    const token = generateUserToken({ id, email });

    return res.json({ user: { id, name, email } , token });
  } catch (error) {
    return InternalErrorResponse("Falha ao fazer login, tente novamente", res)
  }
};