import { Request, Response } from 'express';
import { prisma } from '../services/prisma';
import { validateToken } from '../helpers/handleToken';

export const getAllEvents = async (req: Request, res: Response) => {
    try {
        const events = await prisma.event.findMany()
        
        return res.json({ events })
    } catch (e) {
        return res.status(500).json({ message: "Houve um erro e a solicitação não pôde ser concluida."})
    }
}

export const getEventById = async (req: Request, res: Response) => {
    const { id } = req.params

    try {
        const event = await prisma.event.findUnique({
            where: {
                id
            }
        })
    
        if(!event) {
            return res.status(404).json({ message: "Evento não encontrado" })
        }
        
        return res.json({ event })
    } catch (e) {
        return res.status(500).json({ message: "Houve um erro e a solicitação não pôde ser concluida."})
    }   
}

export const getAllEventCategories = async (req: Request, res: Response) => {
    try {
        const categories = await prisma.eventCategory.findMany()

        return res.json({ categories })
    } catch (e) {
        return res.status(500).json({ message: "Houve um erro e a solicitação não pôde ser concluida." })
    }
}

export const getEventCategoryById = async (req: Request, res: Response) => {
    const { id } = req.params

    try {
        const category = await prisma.eventCategory.findUnique({
            where: {
                id
            }
        })

        if(!category) {
            return res.status(404).json({ message: "Categoria não encontrada." })
        }

        return res.json({ category })  
    } catch (e) {
        return res.status(500).json({ message: "Houve um erro e a solicitação não pôde ser concluida."})
    }
}

export const createEvent = async (req: Request, res: Response) => {
    const { name, start_date, photo, description, category_id } = req.body
    const { authorization } = req.headers;

    const token = authorization!.replace("Bearer", "").trim();
    const tokenInfo = validateToken(token);

    if(!tokenInfo) {
        return res.status(403).json({ message: "Não autorizado." })
    }

    try {
        const user = await prisma.user.findFirst({
            where: {
                id: typeof tokenInfo !== "string" &&  tokenInfo.id
            }
        })

        await prisma.event.create({
            data: {
                name,
                start_date,
                photo,
                description,
                category_id,
                user_id: user!.id,
            }
        })

        return res.status(201).json({ message: "Evento criado com sucesso!" })
    } catch (e) {
        return res.status(500).json({ message: "Houve um erro e a solicitação não pôde ser concluida." })
    }

}

export const updateEvent = async (req: Request, res: Response) => {
    const { id } = req.params
    const { name, start_date, photo, description } = req.body

    try {
        await prisma.event.update({
            where: {
                id
            }, 
            data: {
                name,
                start_date,
                photo,
                description
            }
        })

        return res.status(200).json({ message: "Evento atualizado com sucesso" })

    } catch (e) {
        return res.status(500).json({ message: "Houve um erro e a solicitação não pôde ser concluida." })
    }

}

export const deleteEvent = async (req: Request, res: Response) => {
    const { id } = req.params
    
    try {
        await prisma.event.delete({
            where: {
                id
            }
        })

        return res.status(200).json({ message: "Evento deletado com sucesso" })
    } catch (e) {
        return res.status(500).json({ message: "Houve um erro e a solicitação não pôde ser concluida." })
    }
}