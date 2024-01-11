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
  router.get('/categories', eventController.getAllEventCategories)
  router.get('/categories/:id', eventController.getEventCategoryById)

  // Persistence
  router.post('/', authentication, validateEventData, eventController.createEvent)
  router.put('/:id', authentication, validateEventData, eventController.updateEvent)
  router.delete('/:id', authentication, eventController.deleteEvent)

  router.post('/api/events/buy-ticket/:id', authentication, validateTicketData, eventController.buyEventTicket)

  return router
}

export const userRouter = () => {
  const router: Router = Router()

  // Querying Data
  router.get('/api/users', userController.getAllUsers)
  router.get('/api/users/:id', userController.getUserById)
  router.get('/api/token', authentication, userController.getUserByToken)

  // Persistence
  router.post('/api/login', loginController.login)
  router.post('/api/register', validateUserData, userController.createUser)
  router.put('/api/users/update/:id', authentication, validateUserData, userController.updateUser)
  router.delete('/api/users/delete/:id', authentication, validateUserData, userController.deleteUser)
  
  return router
}
