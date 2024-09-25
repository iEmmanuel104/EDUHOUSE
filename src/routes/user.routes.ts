import express, { Router } from 'express';
import UserController from '../controllers/user.controller';
import { adminAuth, AdminAuthenticatedController, AuthenticatedController, basicAuth, optionalAuth } from '../middlewares/authMiddleware';
import { uploadMiddleware, UploadType } from '../middlewares/uploadMiddleware';
import AuthController from '../controllers/auth.controller';

const router: Router = express.Router();

// Configure the upload middleware for single file upload
const upload = uploadMiddleware(UploadType.Single, 'file');

router
    .get('/', adminAuth('admin'), AdminAuthenticatedController(UserController.getAllUsers))
    .get('/info', optionalAuth, UserController.getUser)
    .patch('/update', basicAuth('access'), upload, AuthenticatedController(UserController.updateUser))
    .delete('/remove-from-school', adminAuth('admin'), AdminAuthenticatedController(UserController.removeTeacherFromSchool))

// Auth routes
    .post('/', optionalAuth, AuthController.signup)
    .post('/verifyemail', AuthController.verifyEmail)
    .get('/resendverifyemail', AuthController.resendVerificationEmail)
    .post('/login', AuthController.login)

    .get('/logout', basicAuth('access'), AuthenticatedController(AuthController.logout))
    .get('/data', basicAuth('access'), AuthenticatedController(AuthController.getLoggedUserData))
    .get('/authtoken', basicAuth('refresh'));

export default router; 