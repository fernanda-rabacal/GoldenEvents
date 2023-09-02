import { Request, Response } from "express";
import { generateUserToken } from "../helpers/handleToken"; 
import { comparePassword } from "../helpers/handlePassword"; 
import { prisma } from "../services/prisma";

export const login = async (request: Request, response: Response) => {
  try {
    const { email, password } = request.body;

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

    const { id } = user;

    const token = generateUserToken({ id, email });

    return response.status(200).json({ user, token });
  } catch (error) {
    return response.status(500).json({ message: "Falha ao fazer login" });
  }
};