import express, { Router } from 'express';
import SchoolController from '../controllers/school.controller';
import { AdminAuthenticatedController, adminAuth, AuthenticatedController, basicAuth, optionalAuth } from '../middlewares/authMiddleware';
import { uploadMiddleware, UploadType } from '../middlewares/uploadMiddleware';

const router: Router = express.Router();

// Configure the upload middleware for single file upload (for school logo)
const upload = uploadMiddleware(UploadType.Single, 'logo');

router
    // School management routes
    .post('/', adminAuth('admin'), AdminAuthenticatedController(SchoolController.createSchool))
    .get('/', optionalAuth, SchoolController.getSchools)
    .get('/info', basicAuth('access'), AuthenticatedController(SchoolController.getSchool))
    .patch('/', basicAuth('access'), upload, AuthenticatedController(SchoolController.updateSchool))
    .delete('/', adminAuth('admin'), AdminAuthenticatedController(SchoolController.deleteSchool))

    // School admin management routes
    .post('/admin/add', adminAuth('admin'), AdminAuthenticatedController(SchoolController.addSchoolAdmin))
    .get('/admin/all', adminAuth('admin'), AdminAuthenticatedController(SchoolController.getSchoolAdmins))
    .get('/admin/info', adminAuth('admin'), AdminAuthenticatedController(SchoolController.getSchoolAdmin))
    .patch('/admin/update', adminAuth('admin'), AdminAuthenticatedController(SchoolController.updateSchoolAdmin))
    .delete('/admin/delete', adminAuth('admin'), AdminAuthenticatedController(SchoolController.deleteSchoolAdmin));

export default router;