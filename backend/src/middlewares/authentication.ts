import { Request, Response, NextFunction } from "express";

import { validateToken } from "../helpers/handleToken"; 
import { prisma } from "../services/prisma";

const authentication = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { authorization } = req.headers;
   // const { id } = req.params

    if (!authorization) {
      return res.status(401).json("Auth Error");
    }

    const token = authorization.replace("Bearer", "").trim();
    const tokenInfo = validateToken(token);

    if (typeof tokenInfo === "string") {
      return res.status(401).json("Auth Error");
    }

    const user = await prisma.user.findUnique({
        where: { 
            id: tokenInfo.id 
        }
    });

    if (!user) {
      return res.status(401).json("Auth Error");
    }

    next();
  } catch (error) {
    return res.status(401).json("Auth Error");
  }
};

export default authentication;