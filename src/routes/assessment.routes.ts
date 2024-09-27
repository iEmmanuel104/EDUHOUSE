import express, { Router } from 'express';
import AssessmentController from '../controllers/assessment.controller';
import { AdminAuthenticatedController, AuthenticatedController, adminAuth, basicAuth, optionalAuth } from '../middlewares/authMiddleware';

const router: Router = express.Router();

router
    // Assessment management routes
    .post('/', adminAuth('admin'), AdminAuthenticatedController(AssessmentController.createAssessment))
    .get('/', optionalAuth, AssessmentController.getAssessments)
    .get('/info', optionalAuth, AssessmentController.getAssessment)
    .patch('/', adminAuth('admin'), AdminAuthenticatedController(AssessmentController.updateAssessment))
    .delete('/', adminAuth('admin'), AdminAuthenticatedController(AssessmentController.deleteAssessment))

    // Assessment grading route
    .post('/grade', adminAuth('admin'), AdminAuthenticatedController(AssessmentController.gradeAssessment))

    // Assessment taker routes
    .post('/taker', adminAuth('admin'), AdminAuthenticatedController(AssessmentController.assignAssessmentToUser))
    .get('/takers', optionalAuth, AssessmentController.getAssessmentTakers)
    .get('/taker/info', optionalAuth, AssessmentController.getAssessmentTaker)
    .patch('/taker', basicAuth('access'), AuthenticatedController(AssessmentController.updateAssessmentTaker))
    .delete('/taker', adminAuth('admin'), AdminAuthenticatedController(AssessmentController.deleteAssessmentTaker))

    // Assessment taking routes
    .post('/start', basicAuth('access'), AuthenticatedController(AssessmentController.startAssessment))
    .post('/submit', basicAuth('access'), AuthenticatedController(AssessmentController.submitAssessment))

    // Assessment question routes
    .post('/question', adminAuth('admin'), AdminAuthenticatedController(AssessmentController.addOrUpdateAssessmentQuestion))
    .delete('/question', adminAuth('admin'), AdminAuthenticatedController(AssessmentController.removeQuestionFromAssessment))
    .get('/questions', basicAuth('access'), AuthenticatedController(AssessmentController.getAssessmentQuestions));

export default router;