import { Request, Response, NextFunction } from 'express';
import { EntityValitionResponse } from '../api/responses';

export const validateEventData = (req: Request, res: Response, next: NextFunction) =>  {
    const body = req.body ? req.body : {}

    if (!body.name) {
        return EntityValitionResponse("O campo 'name' é obrigatório.", res)
    }

    if (!body.startDatetime) {
        return EntityValitionResponse("O campo 'startDatetime' é obrigatório.", res)
    }

    body.startDatetime = new Date(body.startDatetime)
    
    if (isNaN(body.startDatetime)) {
        return EntityValitionResponse("Data inválida, informe no formato 'yyyy-MM-dd'T'HH:mm'.", res)
    }
    
    if (!body.description) {
        return EntityValitionResponse("O campo 'description' é obrigatório.", res)
    }

    if (!body.capacity) {
        return EntityValitionResponse("O campo 'capacity' é obrigatório.", res)
    }

    body.capacity = Number(body.capacity)

    if (isNaN(body.capacity)) {
        return EntityValitionResponse("A capacidade deve ser um valor numérico.", res)
    }

    if (!body.price) {
        return EntityValitionResponse("O campo 'price' é obrigatório.", res)
    }

    body.price = Number(body.price)

    if (isNaN(body.price)) {
        return EntityValitionResponse("O preço deve ser um valor numérico", res)
    }

    if (!body.categoryId) {
        return EntityValitionResponse("O campo 'categoryId' é obrigatório.", res)
    }

    if (!body.location) {
        return EntityValitionResponse("O campo 'location' é obrigatório.", res)
    }
     
    next();
};