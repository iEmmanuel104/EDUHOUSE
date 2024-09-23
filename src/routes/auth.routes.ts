import express, { Router } from 'express';
import AuthController from '../controllers/auth.controller';
import { basicAuth, AuthenticatedController } from '../middlewares/authMiddleware';
// import { rateLimiter } from '../middlewares/rateLimiter';
// import passport from 'passport';

const router: Router = express.Router();

router
    .post('/signup', AuthController.signup)
    .post('/verifyemail', AuthController.verifyEmail)
    .get('/resendverifyemail', AuthController.resendVerificationEmail)
    .post('/login', AuthController.login)

    .get('/logout', basicAuth('access'), AuthenticatedController(AuthController.logout))
    .get('/loggeduser', basicAuth('access'), AuthenticatedController(AuthController.getLoggedUserData))
    .get('/authtoken', basicAuth('refresh'));


export default router;

