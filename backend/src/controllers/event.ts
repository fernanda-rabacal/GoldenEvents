import { Request, Response } from 'express';
import { prisma } from '../services/prisma';
import { validateToken } from '../helpers/handleToken';
import { generateSlug } from '../helpers/handleSlug';
import { CreateResponse, DefaultResponse, DomainValidationResponse, InternalErrorResponse, NotFoundResponse } from '../api/responses';
import { EventQuery } from '../@types/event';
import { OffsetPagination } from '../helpers/handlePagination';

export const getEvents = async (req: Request, res: Response) => {
    let where = {};
    const { name, category_id, take, skip, start_date } = req.query as unknown as EventQuery;

    try {
        if (!take || !skip) {
            return DomainValidationResponse('Parametros inválidos', res);
        }

        if (name) {
            where = {
              ...where,
              name: {
                contains: name,
              },
            };
          }

        if (category_id) {
            where = {
              ...where,
              category_id,
            };
          }

        if (start_date) {
            //tratamento do intervalo
            where = {
              ...where,
              start_date: {
                gte: new Date(start_date).toISOString(),
                lte:  new Date(start_date).toISOString(),
              },
            };
          }

        const events = await prisma.event.findMany({
            where
        })

        const totalRecords = await prisma.event.count();

        const paginator = new OffsetPagination(
            totalRecords,
            events.length,
            skip,
            take,
        );

        return res.json({ events: paginator.buildPage(events.splice(skip * take, take)) });
    } catch (e) {
        return InternalErrorResponse("Houve um erro e a solicitação não pôde ser concluida.", res)
    }
}

export const getEventById = async (req: Request, res: Response) => {
    const { id } = req.params

    try {
        const event = await prisma.event.findUnique({
            where: {
                id: Number(id)
            }
        })
    
        if(!event) {
            return NotFoundResponse("Evento não encontrado", res)
        }
        
        return res.json({ event })
    } catch (e) {
        return InternalErrorResponse("Houve um erro e a solicitação não pôde ser concluida.", res)
    }   
}

export const getEventBySlug = async (req: Request, res: Response) => {
    const { slug } = req.params

    try {
        const event = await prisma.event.findFirst({
            where: {
                slug
            }
        })
    
        if(!event) {
            return NotFoundResponse("Evento não encontrado", res)
        }
        
        return res.json({ event })
    } catch (e) {
        return InternalErrorResponse("Houve um erro e a solicitação não pôde ser concluida.", res)
    }   
}

export const getAllEventCategories = async (req: Request, res: Response) => {
    try {
        const categories = await prisma.eventCategory.findMany()
        return res.json({ categories })
    } catch (e) {
        return InternalErrorResponse("Houve um erro e a solicitação não pôde ser concluida.", res)
    }
}

export const getEventCategoryById = async (req: Request, res: Response) => {
    const { id } = req.params

    try {
        const category = await prisma.eventCategory.findUnique({
            where: {
                id: Number(id)
            }
        })

        if(!category) {
            return NotFoundResponse("Categoria não encontrada.", res)
        }

        return res.json({ category })  
    } catch (e) {
        return InternalErrorResponse("Houve um erro e a solicitação não pôde ser concluida.", res)
    }
}

export const createEvent = async (req: Request, res: Response) => {
    const { authorization } = req.headers
    const { 
        name, 
        startDatetime, 
        photo = '', 
        description, 
        categoryId, 
        capacity, 
        price,
        location 
    } = req.body

    const token = authorization!.replace("Bearer", "").trim();
    const tokenInfo = validateToken(token);

    try {
        const user = await prisma.user.findFirst({
            where: {
                id: typeof tokenInfo !== "string" && tokenInfo.id
            }
        })

        const category = prisma.eventCategory.findFirst({
            where: {
                id: categoryId
            }
        }) 

        if (!category) {
            return NotFoundResponse("Categoria não encontrada.", res) 
        }

        const { id, slug } = await prisma.event.create({
            data: {
                name,
                start_date: startDatetime,
                photo,
                description,
                category_id: categoryId,
                user_id: user!.id,
                capacity,
                price,
                location,
                slug: generateSlug(name),
            }
        })

        return CreateResponse("Evento cadastrado com sucesso.", { 
            event: {
                id,
                name,
                slug,
                description,
                capacity,
                price,
                location,
            } 
        }, res)
    } catch (e) {
        return InternalErrorResponse("Houve um erro e a solicitação não pôde ser concluida.", res)
    }

}

export const updateEvent = async (req: Request, res: Response) => {
    const { id } = req.params
    const { 
        name, 
        startDatetime, 
        photo = '', 
        description, 
        categoryId, 
        capacity, 
        price,
        location 
    } = req.body

    try {
        await prisma.event.update({
            where: {
                id: Number(id)
            }, 
            data: {
                name,
                start_date: startDatetime,
                photo,
                description,
                category_id: categoryId,
                capacity,
                price,
                location
            }
        })

        return DefaultResponse("Evento atualizado com sucesso", res)

    } catch (e) {
        return InternalErrorResponse("Houve um erro e a solicitação não pôde ser concluida.", res)
    }

}

export const deleteEvent = async (req: Request, res: Response) => {
    const { id } = req.params
    
    try {
        await prisma.event.delete({
            where: {
                id: Number(id)
            }
        })

        return DefaultResponse("Evento deletado com sucesso", res)
    } catch (e) {
        return InternalErrorResponse("Houve um erro e a solicitação não pôde ser concluida.", res)       
    }
}

export const buyEventTicket = async (req: Request, res: Response) => {
    const { id } = req.params
    const { paymentMethod, quantity } = req.body
    const { authorization } = req.headers;

    const token = authorization!.replace("Bearer", "").trim();
    const tokenInfo = validateToken(token);
    
    try {
        const event = await prisma.event.findUnique({
            where: {
                id: Number(id)
            }
        })
        
        if(!event) {
            return DomainValidationResponse("Evento não encontrado", res)
        }
        
        const user = await prisma.user.findFirst({
            where: {
                id: typeof tokenInfo !== "string" &&  tokenInfo.id
            }
        })      

        // TODO: VERIFICAR SE EXISTEM INGRESSOS DISPONIVEIS PELA QUANTIDADE.
        // 1. Puxar a quantidade de tickets comprados para aquele evento
        // 2. Se a quantidade comprada + a quantidade de requisição > capacidade
        //    então retornar response dizendo que não há essa quantidade disponivel

        const ticketsPromises = []
        for(let i = 0; i < quantity; i++) {
            ticketsPromises.push(prisma.ticket.create({
                data: {
                    event_id: event.id,
                    user_id: user!.id,
                    price: event.price,
                    payment_method: paymentMethod
                }
            }))
        }

        await Promise.all(ticketsPromises);

        return DefaultResponse("Compra de ingressos realizada com sucesso.", res)
    } catch (e: any) {
        return InternalErrorResponse("Houve um erro e a solicitação não pôde ser concluida.", res)
    }
}


// TODO: Fazer função para buscar os eventos do usuario buscando o ID do Token.
export const getEventsByToken = async (req: Request, res: Response) => {
    const { user_id } = req.params

    try {
        const events = await prisma.event.findMany({
            where: {
                user_id: Number(user_id)
            }
        })

        return res.json({ events })
    } catch (e: any) {
        return InternalErrorResponse("Houve um erro e a solicitação não pôde ser concluida.", res)
    }
}