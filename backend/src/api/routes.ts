import { Router } from 'express';
import { 
  validateLoginData, 
  validateCreateUserData, 
  validateUpdateUserData 
} from '../middlewares/user';
import { validateEventData } from '../middlewares/event';
import validateTicketData from '../middlewares/ticket';
import authentication from '../middlewares/authentication';
import * as eventController from '../controllers/event';
import * as userController from '../controllers/user';
import * as loginController from '../controllers/login'

// /events
export const eventsRouter = (): Router => {
  const router: Router = Router()

  // Querying Data
  router.get('/', eventController.getEvents)
  router.get('/categories', eventController.getAllEventCategories)
  router.get('/categories/:id', eventController.getEventCategoryById)
  router.get('/:id', eventController.getEventById)
  router.get('/:slug', eventController.getEventBySlug)

  // Persistence
  router.post('/', authentication, validateEventData, eventController.createEvent)
  router.post('/buy-ticket/:id', authentication, validateTicketData, eventController.buyEventTicket)
  router.put('/:id', authentication, validateEventData, eventController.updateEvent)
  router.delete('/:id', authentication, eventController.deleteEvent)


  return router
}

// /users
export const usersRouter = (): Router => {
  const router: Router = Router()

  // Querying Data
  router.get('/', userController.getAllUsers)
  router.get('/token', authentication, userController.getUserByToken)
  router.get('/:id', userController.getUserById)

  // Persistence
  router.post('/login', validateLoginData, loginController.login)
  router.post('/register', validateCreateUserData, userController.createUser) 
  router.put('/:id', 
    authentication, 
    validateUpdateUserData, 
    userController.updateUser
  )
  router.delete('/:id', authentication, userController.deleteUser)
  
  return router
}
