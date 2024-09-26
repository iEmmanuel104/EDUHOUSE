import { Router } from 'express';
import userRoute from './user.routes';
import AdminRoute from './Admin/admin.routes';
import SchoolRoute from './school.routes';
import AssessmentRoute from './assessment.routes';

const router = Router();

router
    .use('/iamEduh', AdminRoute)
    .use('/school', SchoolRoute)
    .use('/assessment', AssessmentRoute)
    .use('/teacher', userRoute);

export default router;


