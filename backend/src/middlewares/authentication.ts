import { Request, Response, NextFunction } from "express";
import { validateToken } from "../helpers/handleToken"; 
import { prisma } from "../services/prisma";

const authentication = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { authorization } = req.headers;

    if (!authorization) {
      return res.status(401).json({ message: "Sem cabeçalho ' Autorization Bearer'." });
    }

    const token = authorization.replace("Bearer", "").trim();
    const tokenInfo = validateToken(token);

    if (typeof tokenInfo === "string") {
      return res.status(401).json({ message: "Token Inválido." });
    }

    const user = await prisma.user.findUnique({
        where: { 
            id: tokenInfo.id 
        }
    });

    if (!user) {
      return res.status(401).json({ message: "Usuário não encontrado." });
    }

    console.log(token)
    next();
  } catch (error) {
    return res.status(401).json({ message: "Error de Autênticação."});
  }
};

export default authentication;