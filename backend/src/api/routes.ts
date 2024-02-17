import { Router } from 'express';
import * as eventController from '../controllers/event'
import * as userController from '../controllers/user'
import * as loginController from '../controllers/login'
import validateEventData from '../middlewares/event';
import validateUserData from '../middlewares/user';
import authentication from '../middlewares/authentication';
import validateTicketData from '../middlewares/ticket';


export const eventRouter = (): Router => {
  const router: Router = Router()

  // Querying Data
  router.get('/', eventController.getAllEvents)
  router.get('/:id', eventController.getEventById)
  router.get('/:slug', eventController.getEventBySlug)
  router.get('/categories', eventController.getAllEventCategories)
  router.get('/categories/:id', eventController.getEventCategoryById)

  // Persistence
  router.post('/', authentication, validateEventData, eventController.createEvent)
  router.put('/:id', authentication, validateEventData, eventController.updateEvent)
  router.delete('/:id', authentication, eventController.deleteEvent)

  router.post('/buy-ticket/:id', authentication, validateTicketData, eventController.buyEventTicket)

  return router
}

export const userRouter = () => {
  const router: Router = Router()

  // Querying Data
  router.get('/', userController.getAllUsers)
  router.get('/:id', userController.getUserById)
  router.get('/token', /* authentication, */ userController.getUserByToken)

  // Persistence
  router.post('/login', loginController.login)
  router.post('/register', validateUserData, userController.createUser)
  router.put('/:id', authentication, validateUserData, userController.updateUser)
  router.delete('/:id', authentication, validateUserData, userController.deleteUser)
  
  return router
}
