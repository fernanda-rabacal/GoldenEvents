import { Request, Response, NextFunction } from "express";
import { validateToken } from "../helpers/handleToken"; 
import { prisma } from "../services/prisma";
import { UnauthorizedResponse } from "../api/responses";

const authentication = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { authorization } = req.headers;

    if (!authorization) {
      return UnauthorizedResponse("Não Autenticado.", res);
    }

    const token = authorization.replace("Bearer", "").trim();
    const tokenInfo = validateToken(token);

    if (typeof tokenInfo === "string") {
      return UnauthorizedResponse("Token Inválido.", res);
    }

    const user = await prisma.user.findUnique({
      where: { 
        id: tokenInfo.id 
      }
    });

    if (!user) {
      return UnauthorizedResponse("Usuário não encontrado.", res);
    }
    
    next();
  } catch (error) {
    return UnauthorizedResponse("Erro de Autenticação.", res);
  }
};

export default authentication;