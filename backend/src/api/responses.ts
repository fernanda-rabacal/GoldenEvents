import { Response } from "express";
import { constants as STATUS } from 'http2';

// Success
export const DefaultResponse = (message: string, res: Response) => {
  return res.status(STATUS.HTTP_STATUS_OK)
    .json({
      message: message
    });
}

export const CreateResponse = (message: string, data: any, res: Response) => {
  return res.status(STATUS.HTTP_STATUS_CREATED)
    .json({
      message: message,
      ...data
    });
}

// Errors
export const DomainValidationResponse = (message: string, res: Response) => {
  return res.status(STATUS.HTTP_STATUS_BAD_REQUEST)
    .json({
      message: message
    });
}

export const UnauthorizedResponse = (message: string, res: Response) => {
  return res.status(STATUS.HTTP_STATUS_UNAUTHORIZED)
    .json({
      message: message
    });
}

export const NotFoundResponse = (message: string, res: Response) => {
  return res.status(STATUS.HTTP_STATUS_NOT_FOUND)
    .json({
      message: message
    });
}

export const EntityValitionResponse = (message: string, res: Response) => {
  return res.status(STATUS.HTTP_STATUS_UNPROCESSABLE_ENTITY)
    .json({
      message: message
    });
}

export const InternalErrorResponse = (message: string, res: Response) => {
  return res.status(STATUS.HTTP_STATUS_INTERNAL_SERVER_ERROR)
    .json({
      message: message
    });
}