import express from 'express';
import AppController from '../controllers/appController.js';
import UsersController from '../controllers/usersController.js';

const router = express.Router();

router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);
router.post('/users', UsersController.postNew);

export default router;
