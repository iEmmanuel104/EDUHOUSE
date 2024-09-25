import express, { Router } from 'express';
import SchoolController from '../controllers/school.controller';
import { AdminAuthenticatedController, adminAuth, optionalAuth } from '../middlewares/authMiddleware';
import { uploadMiddleware, UploadType } from '../middlewares/uploadMiddleware';

const router: Router = express.Router();

// Configure the upload middleware for single file upload (for school logo)
const upload = uploadMiddleware(UploadType.Single, 'logo');

router
    // School management routes
    .post('/', adminAuth('admin'), AdminAuthenticatedController(SchoolController.createSchool))
    .get('/', optionalAuth, SchoolController.getSchools)
    .get('/info', optionalAuth, SchoolController.getSchool)
    .patch('/', optionalAuth, upload, SchoolController.updateSchool)
    .delete('/', adminAuth('admin'), AdminAuthenticatedController(SchoolController.deleteSchool))

    // School admin management routes
    .post('/admin', adminAuth('admin'), AdminAuthenticatedController(SchoolController.createOrUpdateSchoolAdmin))
    .get('/admin', adminAuth('admin'), AdminAuthenticatedController(SchoolController.getSchoolAdmins))
    .delete('/admin', adminAuth('admin'), AdminAuthenticatedController(SchoolController.deleteSchoolAdmin));

export default router;