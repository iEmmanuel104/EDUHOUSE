import express, { Router } from 'express';
import AssessmentController from '../controllers/assessment.controller';
import { AdminAuthenticatedController, AuthenticatedController, adminAuth, basicAuth, optionalAuth } from '../middlewares/authMiddleware';

const router: Router = express.Router();

router
    // Assessment management routes
    .post('/', adminAuth('admin'), AdminAuthenticatedController(AssessmentController.createAssessment))
    .get('/', optionalAuth, AssessmentController.getAssessments)
    .get('/:id', optionalAuth, AssessmentController.getAssessment)
    .patch('/:id', adminAuth('admin'), AdminAuthenticatedController(AssessmentController.updateAssessment))
    .delete('/:id', adminAuth('admin'), AdminAuthenticatedController(AssessmentController.deleteAssessment))

    // Assessment grading route
    .post('/:assessmentId/grade', adminAuth('admin'), AdminAuthenticatedController(AssessmentController.gradeAssessment))

    // Assessment taker routes
    .post('/taker', adminAuth('admin'), AdminAuthenticatedController(AssessmentController.assignAssessmentToUser))
    .get('/takers', optionalAuth, AssessmentController.getAssessmentTakers)
    .get('/taker/:id', optionalAuth, AssessmentController.getAssessmentTaker)
    .patch('/taker/:id', basicAuth('access'), AuthenticatedController(AssessmentController.updateAssessmentTaker))
    .delete('/taker/:id', adminAuth('admin'), AdminAuthenticatedController(AssessmentController.deleteAssessmentTaker))

    // Assessment taking routes
    .post('/start/:id', basicAuth('access'), AuthenticatedController(AssessmentController.startAssessment))
    .post('/submit/:id', basicAuth('access'), AuthenticatedController(AssessmentController.submitAssessment));

export default router;