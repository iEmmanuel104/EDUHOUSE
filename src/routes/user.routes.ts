import express, { Router } from 'express';
import UserController from '../controllers/user.controller';
import { adminAuth, AdminAuthenticatedController, AuthenticatedController, basicAuth, optionalAuth } from '../middlewares/authMiddleware';
import { uploadMiddleware, UploadType } from '../middlewares/uploadMiddleware';

const router: Router = express.Router();

// Configure the upload middleware for single file upload
const upload = uploadMiddleware(UploadType.Single, 'file');

router
    .get('/', adminAuth('admin'), AdminAuthenticatedController(UserController.getAllUsers))
    .get('/info', optionalAuth, UserController.getUser)
    .patch('/update', basicAuth('access'), upload, AuthenticatedController(UserController.updateUser))
    .post('/add-to-schoool', adminAuth('admin'), AdminAuthenticatedController(UserController.addTeacherToSchool))
    .patch('/update-in-school', adminAuth('admin'), AdminAuthenticatedController(UserController.updateTeacherInSchool))
    .delete('/remove-from-school', adminAuth('admin'), AdminAuthenticatedController(UserController.removeTeacherFromSchool));

export default router;

