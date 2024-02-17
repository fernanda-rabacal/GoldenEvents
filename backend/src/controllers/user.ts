import { Request, Response } from "express"
import { prisma } from "../services/prisma";
import { encryptPassword } from "../helpers/handlePassword";
import { validateToken } from "../helpers/handleToken";


export const getAllUsers = async (request: Request, response: Response) => {
  try {
    const users = await prisma.user.findMany()

    return response.status(200).json({ users })
  } catch(e) {
    return response.status(500).json({ message: "Houve um erro e a solicitação não pôde ser concluida"})
  }
}

export const getUserById = async (request: Request, response: Response) => {
  const { id } = request.params;

  try {
    const user = await prisma.user.findUnique({
      where: {
        id
      }
    })

    if(!user) {
      return response.status(404).json({ message: "Usuário não encontrado" })
    }

    return response.status(200).json({ user })
  } catch(e) {
    return response.status(500).json({ message: "Houve um erro e a solicitação não pôde ser concluida"})
  }
}

export const getUserByToken = async (request: Request, response: Response) => {
  const { authorization } = request.headers;

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
        return response.status(404).json({ message: "Usuário não encontrado" })
      }
  
      return response.status(200).json({ user })
    }
  } catch(e) {
    return response.status(500).json({ message: "Houve um erro e a solicitação não pôde ser concluida"})
  }
}

export const createUser = async (request: Request, response: Response) => {
    const { name, email, password, cpf } = request.body;
  
    try {
      const userAlreadyExists = await prisma.user.findFirst({
        where: {
          email
        }
      })

      if(userAlreadyExists) {
        return response.status(400).json({ message: "Usuário já existente"});
      }

      const user = await prisma.user.create({
        data: {
            name,
            email,
            cpf,
            password: await encryptPassword(password), 
        }
      });
  
      return response.status(200).json({ message: "Cliente cadastrado com sucesso!", user: user });
    } catch (e) {
      return response.status(500).json({ message: "Erro ao criar novo usuário, por favor tente novamente." });
    }
  };

  export const updateUser = async (request: Request, response: Response) => {
    try {
      const { id } = request.params;
      const { name, email, password } = request.body;


      const user = await prisma.user.findUnique({
        where: {
            id
        }
      })

      if(!user) {
        return response.status(404).json({ message: "Usuario não encontrado" })
      }
  
      await prisma.user.update({
        where: {
            id
        }, 
        data: {
            name: name ? name : user.name,
            email: email ? email : user.email,
            password: password ? await encryptPassword(password) : user.password
        }
      });
  
      return response.status(200).json({ message: "Usuario atualizado com sucesso." });
    } catch (e) {
      return response.status(500).json({ message: "Erro ao atualizar usuário." });
    }
  };

  export const deleteUser = async (request: Request, response: Response) => {
    const { id } = request.params

    try {
        const user = await prisma.user.findUnique({
            where: {
                id
            }
        })
      
        if (!user) {
          return response.status(404).json({ message: "Usuario não encontrado" });
        }

        await prisma.user.delete({
            where: {
                id
            }
        })
        
        return response.status(200).json({ message: "Usuário deletar com sucesso" });
    } catch (e) {
        return response.status(500).json({ message: "Erro ao deletar usuário." });
    }
  };
  
  