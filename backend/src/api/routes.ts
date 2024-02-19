import { NextFunction, Request, Response, Router } from 'express';
import * as eventController from '../controllers/event'
import * as userController from '../controllers/user'
import * as loginController from '../controllers/login'
import validateEventData from '../middlewares/event';
import { validateCreateUserData, validateUpdateUserData } from '../middlewares/user';
import authentication from '../middlewares/authentication';
import validateTicketData from '../middlewares/ticket';


export const eventsRouter = (): Router => {
  const router: Router = Router()

  // Querying Data
  router.get('/', eventController.getAllEvents)
  router.get('/:id', eventController.getEventById)
  router.get('/:slug', eventController.getEventBySlug)
  router.get('/categories', eventController.getAllEventCategories)
  router.get('/categories/:id', eventController.getEventCategoryById)
  router.get('?user_id=:id', eventController.getEventsByUserId)

  // Persistence
  router.post('/', authentication, validateEventData, eventController.createEvent)
  router.put('/:id', authentication, validateEventData, eventController.updateEvent)
  router.delete('/:id', authentication, eventController.deleteEvent)

  router.post('/buy-ticket/:id', authentication, validateTicketData, eventController.buyEventTicket)

  return router
}

export const usersRouter = () => {
  const router: Router = Router()

  // Querying Data
  router.get('/', userController.getAllUsers)
  router.get('/token', authentication, userController.getUserByToken)
  router.get('/:id', userController.getUserById)

  // Persistence
  router.post('/login', loginController.login)
  router.post('/register', validateCreateUserData, userController.createUser) 
  router.put('/:id', 
    authentication, 
    validateUpdateUserData, 
    userController.updateUser
  )
  router.delete('/:id', authentication, userController.deleteUser)
  
  return router
}
