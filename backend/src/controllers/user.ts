import { Request, Response } from "express"
import { prisma } from "../services/prisma";
import { encryptPassword } from "../helpers/handlePassword";
import { validateToken } from "../helpers/handleToken";
import { CreateResponse, DefaultResponse, DomainValidationResponse, InternalErrorResponse, NotFoundResponse } from "../api/responses";


export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany()

    return res.json({ users })
  } catch(e) {
    return InternalErrorResponse("Houve um erro e a solicitação não pôde ser concluida.", res)
  }
}

export const getUserById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const user = await prisma.user.findUnique({
      where: {
        id: Number(id)
      }
    })

    if(!user) {
      return NotFoundResponse("Usuário não encontrado.", res)
    }

    return res.json({ user })
  } catch(e) {
    return InternalErrorResponse("Houve um erro e a solicitação não pôde ser concluida.", res)
  }
}

export const getUserByToken = async (req: Request, res: Response) => {
  const { authorization } = req.headers;

  const token = authorization!.replace("Bearer", "").trim();
  const tokenInfo = validateToken(token);

  try {
    if(typeof tokenInfo !== "string") {
      const user = await prisma.user.findUnique({
        where: {
          id: tokenInfo.id
        }
      })
  
      if(!user) {
        return NotFoundResponse("Usuário não encontrado.", res)
      }
  
      return res.json({ user })
    }
  } catch(e) {
    return InternalErrorResponse("Houve um erro e a solicitação não pôde ser concluida.", res)
  }
}

export const createUser = async (req: Request, res: Response) => {
  const { name, email, password, document, user_type_id } = req.body;

  try {
    const userAlreadyExists = await prisma.user.findFirst({
      where: {
        email
      }
    })

    if(userAlreadyExists) {
      return DomainValidationResponse("Usuário já existente.", res)
    }

    const user = await prisma.user.create({
      data: {
          name,
          email,
          document,
          user_type_id,
          password: await encryptPassword(password), 
      }
    });

    return CreateResponse("Usuário cadastrado com sucesso.", { user: user }, res)
  } catch (e) {
    return InternalErrorResponse("Erro ao criar novo usuário, por favor tente novamente.", res)
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, document } = req.body;

    const user = await prisma.user.findUnique({
      where: {
        id: Number(id)
      }
    })

    if(!user) {
      return NotFoundResponse("Usuário não encontrado.", res)
    }

    await prisma.user.update({
      where: {
        id: Number(id)
      }, 
      data: {
          name: name,
          email: email,
          document: document
      }
    });

    return DefaultResponse("Usuario atualizado com sucesso.", res)
  } catch (e) {
    return InternalErrorResponse("Erro ao atualizar usuário.", res)
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  const { id } = req.params

  try {
      const user = await prisma.user.findUnique({
          where: {
            id: Number(id)
          }
      })
    
      if (!user) {
        return NotFoundResponse("Usuário não encontrado.", res)
      }

      await prisma.user.delete({
          where: {
            id: Number(id)
          }
      })
      
    return DefaultResponse("Usuário removido com sucesso.", res)
  } catch (e) {
    return InternalErrorResponse("Erro ao excluir usuário.", res)
  }
};
  
  