import { Router } from 'express';
import userRoute from './user.routes';
import AdminRoute from './Admin/admin.routes';
import SchoolRoute from './school.routes';

const router = Router();

router
    .use('/iamEduh', AdminRoute)
    .use('/school', SchoolRoute)
    .use('/teacher', userRoute);

export default router;


