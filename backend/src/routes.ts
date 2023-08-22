import express from 'express'
import { Router } from 'express';
import * as eventController from './controllers/event'
import * as userController from './controllers/user'
import * as loginController from './controllers/login'
import validateEventData from './middlewares/event';
import validateUserData from './middlewares/user';
import authentication from './middlewares/authentication';
import cors from 'cors'

const app = express();
const route = Router()
app.use(express.json())
app.use(cors())

route.get('/api/events', eventController.getAllEvents)
route.get('/api/events/:id', eventController.getEventById)
route.get('/api/categories', eventController.getAllEventCategories)
route.get('/api/categories/:id', eventController.getEventCategoryById)
route.post('/api/events/create', authentication, validateEventData, eventController.createEvent)
route.put('/api/events/update/:id', authentication, validateEventData, eventController.updateEvent)
route.delete('/api/events/delete/:id', authentication, eventController.deleteEvent)

route.get('/api/users', userController.getAllUsers)
route.get('/api/users/:id', userController.getUserById)
route.get('/api/users/recover', authentication, userController.getUserByToken)
route.post('/api/login', loginController.login)
route.post('/api/register', validateUserData, userController.createUser)
route.put('/api/users/update/:id', authentication, validateUserData, userController.updateUser)
route.delete('/api/users/delete/:id', authentication, validateUserData, userController.deleteUser)

app.use(route)

app.listen(80, () => 'server running on port 80')




